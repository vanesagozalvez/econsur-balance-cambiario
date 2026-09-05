"""
Versión de REFERENCIA en Python de scripts/aggregate.mjs.

El pipeline automático de la app (el que corre en cada build de Vercel) usa
la versión Node.js: scripts/aggregate.mjs. Este script en Python hace
exactamente lo mismo y se deja como alternativa por si alguien prefiere
correrlo manualmente con Python en vez de Node.

Reconstruye src/data/balance_cambiario.json a partir del Excel fuente del BCRA
("data/mercado-cambios-balance-cambiario.xlsx"), con apertura mensual por
sector y concepto del balance cambiario.

Uso:
    pip install -r scripts/requirements.txt
    python3 scripts/aggregate.py [ruta_al_excel]

Si no se pasa ruta, busca "data/mercado-cambios-balance-cambiario.xlsx" en la
raíz del repo.
"""
import sys
import os
import re
import unicodedata
import hashlib
import openpyxl
from collections import defaultdict
import json

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO_ROOT, "data", "mercado-cambios-balance-cambiario.xlsx")
OUT = os.path.join(REPO_ROOT, "src", "data", "balance_cambiario.json")

wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
ws = wb["Datos Mercado de Cambios"]

# bucket_sums[serie_id][mes_str] = suma acumulada (USD) -> series "curadas" (compuestas)
bucket_sums = defaultdict(lambda: defaultdict(float))
# detalle_sums[(E,F,G,H)][mes_str] = suma acumulada (USD) -> TODOS los conceptos, auto-descubiertos
detalle_sums = defaultdict(lambda: defaultdict(float))
all_months = set()

PUBLICO = "Sector Público"

def add(bucket, mes_key, monto, sign=1):
    bucket_sums[bucket][mes_key] += sign * monto


def limpiar_etiqueta(texto):
    """Saca el prefijo numérico ('01- ', '02-', etc.) de las categorías del Excel."""
    if texto is None:
        return ""
    return re.sub(r"^\d+\s*-\s*", "", str(texto)).strip()


def slugificar(texto):
    """'Cobros de exportaciones' -> 'cobros-de-exportaciones' (sin acentos, sin espacios)."""
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = texto.lower()
    texto = re.sub(r"[^a-z0-9]+", "-", texto).strip("-")
    return texto or "concepto"


def id_detalle(cuenta, subcuenta, grupo, concepto):
    """
    Id corto y ESTABLE para un concepto de detalle: 'd-' + hash de sus 4 campos.
    No depende del orden ni de cuántos otros conceptos existan, así que un
    concepto puntual conserva el mismo id de una corrida a otra aunque el
    BCRA agregue o saque otras categorías en el medio.
    """
    clave = f"{cuenta}|{subcuenta}|{grupo}|{concepto}"
    return "d-" + hashlib.md5(clave.encode("utf-8")).hexdigest()[:10]

i = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    i += 1
    anexo, mes, sector, monto, E, F, G, H = row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]
    if monto is None:
        continue
    monto = float(monto)
    mes_key = mes.strftime("%Y-%m")
    all_months.add(mes_key)

    # --- Detalle completo (TODOS los conceptos, auto-descubiertos, sin curar) ---
    detalle_sums[(E, F, G, H)][mes_key] += monto

    # --- Grandes cuentas ---
    if E == "01- Cuenta Corriente":
        add("cuenta_corriente", mes_key, monto)
    elif E == "02- Cuenta Capital":
        add("cuenta_capital", mes_key, monto)
    elif E == "03- Cuenta Financiera":
        add("cuenta_financiera", mes_key, monto)

    # --- Bienes / Servicios ---
    if F == "01- Bienes":
        add("balance_bienes", mes_key, monto)
        if monto > 0:
            add("exportaciones_bienes", mes_key, monto)
        else:
            add("importaciones_bienes", mes_key, monto)
    elif F == "02- Servicios":
        add("balance_servicios", mes_key, monto)

    # --- Ingreso primario ---
    if F == "03- Ingreso primario":
        add("ingreso_primario", mes_key, monto)
        if H in ("Utilidades y Dividendos - Ingresos", "Utilidades y Dividendos - Egresos"):
            add("utilidades_dividendos", mes_key, monto)
        if H in ("Intereses - Ingresos", "Intereses - Egresos"):
            add("intereses_cta_cte", mes_key, monto)

    # --- Ingreso secundario ---
    if F == "04- Ingreso secundario":
        add("ingreso_secundario", mes_key, monto)

    # --- Inversion directa y portafolio no residentes ---
    if F == "01- Inversión directa y de portafolio de no residentes":
        if H in ("Inversión directa - Ingresos", "Inversión directa - Egresos"):
            add("ied", mes_key, monto)
        elif H in ("Inversión de portafolio - Ingresos", "Inversión de portafolio - Egresos"):
            add("inversion_portafolio_no_residentes", mes_key, monto)
        elif H in ("Inversiones aplicadas a la compra de inmuebles - Ingresos",
                   "Inversiones aplicadas a la compra de inmuebles - Egresos"):
            add("inversion_inmuebles_no_residentes", mes_key, monto)

    # --- Prestamos financieros / deuda financiera ---
    if F == "02- Préstamos financieros, títulos de deuda y líneas de crédito":
        add("deuda_financiera_total", mes_key, monto)
        if sector == PUBLICO:
            add("deuda_financiera_publica", mes_key, monto)
        else:
            add("deuda_financiera_privada", mes_key, monto)

    # --- Compra-venta de billetes y divisas sin fines especificos (FAE) ---
    if F == "03- Compra-venta de billetes y divisas sin fines específicos":
        if H == "Inversiones directas de residentes en el exterior":
            add("ide_residentes_exterior", mes_key, monto)
        else:
            # Billetes-Ingresos, Divisas-Ingresos, Billetes-Egresos, Otras inversiones
            # Invertimos el signo: positivo = compra neta de divisas (dolarizacion)
            add("fae", mes_key, monto, sign=-1)

    # --- Otros movimientos cuenta financiera ---
    if F == "04- Operaciones de canje por transferencias con el exterior":
        add("operaciones_canje", mes_key, monto)
    elif F == "05- Compra-venta de títulos valores":
        add("titulos_valores", mes_key, monto)
    elif F == "06- Otros movimientos de la cuenta financiera":
        add("otros_mov_financiera", mes_key, monto)

    # --- Deuda comercial (proxy financiamiento de comercio exterior) ---
    if H in ("Prefinanciaciones de exportaciones del exterior",
              "Financiaciones locales de exportaciones",
              "Cobros anticipados de exportaciones"):
        add("deuda_comercial", mes_key, monto)
    elif H == "Pagos diferidos de importaciones y otros egresos por bienes":
        add("deuda_comercial", mes_key, monto)

print("filas procesadas:", i)
print("meses:", len(all_months))
print("series curadas:", len(bucket_sums))
print("conceptos de detalle (auto):", len(detalle_sums))

meses_ordenados = sorted(all_months)

# Construir salida final: por cada serie, alinear valores con meses_ordenados (en millones de USD)
series_out = {}
for serie_id, d in bucket_sums.items():
    series_out[serie_id] = [round(d.get(m, 0.0) / 1_000_000, 4) for m in meses_ordenados]

# Detalle completo: un id único por cada combinación (Cuenta, Subcuenta, Grupo, Concepto)
# encontrada en el Excel. Esto se regenera solo, sin mantenimiento manual: si el BCRA
# agrega o saca una categoría, en la próxima corrida aparece o desaparece sola.
detalle_out = {}
for (E, F, G, H), d in detalle_sums.items():
    cuenta = limpiar_etiqueta(E)
    subcuenta = limpiar_etiqueta(F)
    grupo = limpiar_etiqueta(G)
    concepto = limpiar_etiqueta(H) or grupo or subcuenta

    slug = id_detalle(cuenta, subcuenta, grupo, concepto)

    detalle_out[slug] = {
        "cuenta": cuenta,
        "subcuenta": subcuenta,
        "grupo": grupo,
        "concepto": concepto,
        "valores": [round(d.get(m, 0.0) / 1_000_000, 4) for m in meses_ordenados],
    }

out = {
    "meses": meses_ordenados,
    "series": series_out,
    "detalle": detalle_out,
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)

print(f"OK - escrito {OUT}")
print("series curadas:", list(series_out.keys()))
print("conceptos de detalle:", list(detalle_out.keys()))

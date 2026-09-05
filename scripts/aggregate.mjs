#!/usr/bin/env node
/**
 * Reconstruye src/data/balance_cambiario.json a partir del Excel fuente del
 * BCRA ("data/mercado-cambios-balance-cambiario.xlsx"), con apertura mensual
 * por sector y concepto del balance cambiario.
 *
 * Este script corre automáticamente en cada build (ver "prebuild" en
 * package.json) — no hace falta ejecutarlo a mano. Para actualizar los
 * datos alcanza con reemplazar el Excel en `data/` y pushear a GitHub;
 * Vercel corre `npm run build`, que dispara este script antes de compilar
 * la app.
 *
 * Uso manual (opcional):
 *   node scripts/aggregate.mjs [ruta_al_excel]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.dirname(__dirname);
const SRC =
  process.argv[2] ||
  path.join(REPO_ROOT, "data", "mercado-cambios-balance-cambiario.xlsx");
const OUT = path.join(REPO_ROOT, "src", "data", "balance_cambiario.json");
const HOJA = "Datos Mercado de Cambios";
const PUBLICO = "Sector Público";

if (!fs.existsSync(SRC)) {
  console.error(`❌ No se encontró el Excel en: ${SRC}`);
  console.error(
    "   Colocá el archivo en data/mercado-cambios-balance-cambiario.xlsx (mismo nombre) y volvé a intentar."
  );
  process.exit(1);
}

function limpiarEtiqueta(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replace(/^\d+\s*-\s*/, "")
    .trim();
}

function idDetalle(cuenta, subcuenta, grupo, concepto) {
  const clave = `${cuenta}|${subcuenta}|${grupo}|${concepto}`;
  const hash = crypto.createHash("md5").update(clave, "utf8").digest("hex").slice(0, 10);
  return `d-${hash}`;
}

function excelSerialAMes(valor) {
  // XLSX con cellDates:true ya entrega objetos Date; este helper cubre el caso
  // en que, por algún motivo, llegue como número de serie de Excel.
  let fecha = valor;
  if (typeof valor === "number") {
    fecha = XLSX.SSF ? new Date(Date.UTC(1899, 11, 30) + valor * 86400000) : new Date(valor);
  }
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
}

console.log(`📖 Leyendo ${SRC} …`);
const wb = XLSX.readFile(SRC, { cellDates: true, dense: true });
const ws = wb.Sheets[HOJA];
if (!ws) {
  console.error(`❌ No se encontró la hoja "${HOJA}" en el Excel.`);
  console.error(`   Hojas disponibles: ${wb.SheetNames.join(", ")}`);
  process.exit(1);
}

// header:1 -> filas como arrays (más rápido que objetos para ~270k filas)
const filas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });

const bucketSums = new Map(); // id_curado -> Map(mes -> suma)
const detalleSums = new Map(); // clave "E|F|G|H" -> { E,F,G,H, meses: Map(mes->suma) }
const todosLosMeses = new Set();

function add(bucket, mesKey, monto, sign = 1) {
  if (!bucketSums.has(bucket)) bucketSums.set(bucket, new Map());
  const m = bucketSums.get(bucket);
  m.set(mesKey, (m.get(mesKey) || 0) + sign * monto);
}

let procesadas = 0;
for (let i = 1; i < filas.length; i++) {
  const row = filas[i];
  if (!row) continue;
  const [anexo, mesRaw, sector, montoRaw, E, F, G, H] = row;
  if (montoRaw === null || montoRaw === undefined || mesRaw === null || mesRaw === undefined) continue;

  const monto = Number(montoRaw);
  if (Number.isNaN(monto)) continue;

  const mesKey = excelSerialAMes(mesRaw);
  todosLosMeses.add(mesKey);
  procesadas++;

  // --- Detalle completo (TODOS los conceptos, auto-descubiertos, sin curar) ---
  const claveDetalle = `${E}|${F}|${G}|${H}`;
  if (!detalleSums.has(claveDetalle)) {
    detalleSums.set(claveDetalle, { E, F, G, H, meses: new Map() });
  }
  const bucketDetalle = detalleSums.get(claveDetalle).meses;
  bucketDetalle.set(mesKey, (bucketDetalle.get(mesKey) || 0) + monto);

  // --- Grandes cuentas ---
  if (E === "01- Cuenta Corriente") add("cuenta_corriente", mesKey, monto);
  else if (E === "02- Cuenta Capital") add("cuenta_capital", mesKey, monto);
  else if (E === "03- Cuenta Financiera") add("cuenta_financiera", mesKey, monto);

  // --- Bienes / Servicios ---
  if (F === "01- Bienes") {
    add("balance_bienes", mesKey, monto);
    if (monto > 0) add("exportaciones_bienes", mesKey, monto);
    else add("importaciones_bienes", mesKey, monto);
  } else if (F === "02- Servicios") {
    add("balance_servicios", mesKey, monto);
  }

  // --- Ingreso primario ---
  if (F === "03- Ingreso primario") {
    add("ingreso_primario", mesKey, monto);
    if (H === "Utilidades y Dividendos - Ingresos" || H === "Utilidades y Dividendos - Egresos") {
      add("utilidades_dividendos", mesKey, monto);
    }
    if (H === "Intereses - Ingresos" || H === "Intereses - Egresos") {
      add("intereses_cta_cte", mesKey, monto);
    }
  }

  // --- Ingreso secundario ---
  if (F === "04- Ingreso secundario") add("ingreso_secundario", mesKey, monto);

  // --- Inversión directa y portafolio no residentes ---
  if (F === "01- Inversión directa y de portafolio de no residentes") {
    if (H === "Inversión directa - Ingresos" || H === "Inversión directa - Egresos") {
      add("ied", mesKey, monto);
    } else if (H === "Inversión de portafolio - Ingresos" || H === "Inversión de portafolio - Egresos") {
      add("inversion_portafolio_no_residentes", mesKey, monto);
    } else if (
      H === "Inversiones aplicadas a la compra de inmuebles - Ingresos" ||
      H === "Inversiones aplicadas a la compra de inmuebles - Egresos"
    ) {
      add("inversion_inmuebles_no_residentes", mesKey, monto);
    }
  }

  // --- Préstamos financieros / deuda financiera ---
  if (F === "02- Préstamos financieros, títulos de deuda y líneas de crédito") {
    add("deuda_financiera_total", mesKey, monto);
    if (sector === PUBLICO) add("deuda_financiera_publica", mesKey, monto);
    else add("deuda_financiera_privada", mesKey, monto);
  }

  // --- Compra-venta de billetes y divisas sin fines específicos (FAE) ---
  if (F === "03- Compra-venta de billetes y divisas sin fines específicos") {
    if (H === "Inversiones directas de residentes en el exterior") {
      add("ide_residentes_exterior", mesKey, monto);
    } else {
      // Billetes-Ingresos, Divisas-Ingresos, Billetes-Egresos, Otras inversiones.
      // Invertimos el signo: positivo = compra neta de divisas (dolarización).
      add("fae", mesKey, monto, -1);
    }
  }

  // --- Otros movimientos cuenta financiera ---
  if (F === "04- Operaciones de canje por transferencias con el exterior") {
    add("operaciones_canje", mesKey, monto);
  } else if (F === "05- Compra-venta de títulos valores") {
    add("titulos_valores", mesKey, monto);
  } else if (F === "06- Otros movimientos de la cuenta financiera") {
    add("otros_mov_financiera", mesKey, monto);
  }

  // --- Deuda comercial (proxy financiamiento de comercio exterior) ---
  if (
    H === "Prefinanciaciones de exportaciones del exterior" ||
    H === "Financiaciones locales de exportaciones" ||
    H === "Cobros anticipados de exportaciones"
  ) {
    add("deuda_comercial", mesKey, monto);
  } else if (H === "Pagos diferidos de importaciones y otros egresos por bienes") {
    add("deuda_comercial", mesKey, monto);
  }
}

const mesesOrdenados = Array.from(todosLosMeses).sort();

const seriesOut = {};
for (const [id, mapa] of bucketSums) {
  seriesOut[id] = mesesOrdenados.map((m) => Math.round(((mapa.get(m) || 0) / 1_000_000) * 10000) / 10000);
}

const detalleOut = {};
for (const { E, F, G, H, meses } of detalleSums.values()) {
  const cuenta = limpiarEtiqueta(E);
  const subcuenta = limpiarEtiqueta(F);
  const grupo = limpiarEtiqueta(G);
  const concepto = limpiarEtiqueta(H) || grupo || subcuenta;
  const id = idDetalle(cuenta, subcuenta, grupo, concepto);
  detalleOut[id] = {
    cuenta,
    subcuenta,
    grupo,
    concepto,
    valores: mesesOrdenados.map((m) => Math.round(((meses.get(m) || 0) / 1_000_000) * 10000) / 10000),
  };
}

const salida = {
  generadoEl: new Date().toISOString(),
  meses: mesesOrdenados,
  series: seriesOut,
  detalle: detalleOut,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(salida), "utf-8");

console.log(`✅ Filas procesadas: ${procesadas}`);
console.log(`✅ Meses: ${mesesOrdenados.length} (${mesesOrdenados[0]} → ${mesesOrdenados[mesesOrdenados.length - 1]})`);
console.log(`✅ Series curadas: ${Object.keys(seriesOut).length}`);
console.log(`✅ Conceptos de detalle (auto): ${Object.keys(detalleOut).length}`);
console.log(`✅ Escrito: ${OUT}`);

#!/usr/bin/env node
// load_hpc.js — one-time loader for HPC 2026 tables (hpc_severity + hpc_pin)
//
// Prerequisites:
//   npm install xlsx          (SheetJS — not needed for the browser, needed here)
//
// Usage:
//   node load_hpc.js --dry-run          # prints summary + first 5 rows, no inserts
//   node load_hpc.js                    # real insert
//
// Required env vars:
//   SUPABASE_URL               e.g. https://vshntreclf...supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  the service_role key (never the anon key)
//
// Optional env var:
//   PIN_FILE   path to the PIN/CIBLE xlsx (default: see PIN_FILE_DEFAULT below)

'use strict';

const XLSX = require('xlsx');
const path = require('path');

// ── Constants ─────────────────────────────────────────────────────────────────
const PIN_FILE_DEFAULT = 'PIN CIBLE Clusters par province et groupe de population.xlsx';
const PIN_FILE   = process.env.PIN_FILE || PIN_FILE_DEFAULT;
const DRY_RUN    = process.argv.includes('--dry-run');
const BATCH      = 500;
const HPC_CYCLE  = 2026;
const SEV_SOURCE = 'HPC 2026 JIAF — SEVERITE ADMIN 2';
const PIN_SOURCE = 'HPC 2026 — PIN CIBLE Clusters';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SB_URL || !SB_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// Returns a Number or null (never NaN).
const num = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

// Returns an integer or null.
const int = v => { const n = num(v); return n === null ? null : Math.round(n); };

// Reads a sheet as an array of plain objects.
// range: 0 = first row is header (default), 1 = second row is header.
function readSheet(file, sheetName, range = 0) {
  const wb = XLSX.readFile(file);
  if (!wb.Sheets[sheetName]) {
    console.error(`\nERROR: Sheet "${sheetName}" not found in ${path.basename(file)}.`);
    console.error(`       Available sheets: ${wb.SheetNames.join(' | ')}`);
    process.exit(1);
  }
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null, range });
}

// Warn about any expected column names absent from actual headers.
function warnMissingCols(rows, expectedCols, context) {
  if (!rows.length) return;
  const headers = new Set(Object.keys(rows[0]));
  const missing = expectedCols.filter(c => !headers.has(c));
  if (missing.length) {
    console.warn(`  WARN [${context}] — ${missing.length} column(s) not found in sheet:`);
    missing.forEach(c => console.warn(`    → "${c}"`));
  }
}

// POST one batch to Supabase REST.
async function sbInsert(table, rows) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey':        SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} — ${body.slice(0, 400)}`);
  }
}

// Insert all rows in batches; hard-stop on first error.
async function insertBatched(table, rows) {
  const total = rows.length;
  const nBatches = Math.ceil(total / BATCH);
  console.log(`  → ${table}: inserting ${total} rows in ${nBatches} batch(es)...`);
  for (let i = 0; i < total; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const bn = Math.floor(i / BATCH) + 1;
    try {
      await sbInsert(table, batch);
      process.stdout.write(`    [${bn}/${nBatches}] OK\r`);
    } catch (e) {
      console.error(`\n  FAILED — ${table} batch ${bn}/${nBatches} (rows ${i}–${i + batch.length - 1})`);
      console.error(`  ${e.message}`);
      process.exit(1);
    }
  }
  console.log(`    All ${nBatches} batch(es) inserted.        `);
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE 1 — hpc_severity  (sheet: "SEVERITE ADMIN 2", header row 0)
// ══════════════════════════════════════════════════════════════════════════════
function buildSeverity(pinFile) {
  const rows = readSheet(pinFile, 'SEVERITE ADMIN 2', 0);

  const DIMS = [
    { col: 'INTERSECTOR', dimension_name: 'INTERSECTOR', cluster_level: 'intersectoral' },
    { col: 'PROECTION',   dimension_name: 'PROTECTION',  cluster_level: 'cluster' },
    { col: 'ABRIS',       dimension_name: 'ABRIS',       cluster_level: 'cluster' },
    { col: 'GSAT',        dimension_name: 'GSAT',        cluster_level: 'cluster' },
    { col: 'SANTE',       dimension_name: 'SANTE',       cluster_level: 'cluster' },
    { col: 'SECAL',       dimension_name: 'SECAL',       cluster_level: 'cluster' },
    { col: 'WASH',        dimension_name: 'WASH',        cluster_level: 'cluster' },
    { col: 'NUTRITION',   dimension_name: 'NUTRITION',   cluster_level: 'cluster' },
    { col: 'EDUCATION',   dimension_name: 'EDUCATION',   cluster_level: 'cluster' },
  ];

  warnMissingCols(rows, [
    'Admin 1', 'Admin 1 P-Code', 'Admin 2', 'Admin 2 P-Code',
    ...DIMS.map(d => d.col),
  ], 'SEVERITE ADMIN 2');

  const out = [];
  for (const r of rows) {
    const adm2 = r['Admin 2'];
    if (!adm2) continue; // skip blank/total rows

    const geo = {
      adm1:       r['Admin 1']       || null,
      adm1_pcode: r['Admin 1 P-Code']|| null,
      adm2:       String(adm2),
      adm2_pcode: r['Admin 2 P-Code']|| null,
    };

    for (const dim of DIMS) {
      const severity = int(r[dim.col]);
      if (severity === null) continue; // skip blank cells

      out.push({
        ...geo,
        hpc_cycle:      HPC_CYCLE,
        dimension_name: dim.dimension_name,
        cluster_level:  dim.cluster_level,
        severity,
        source:         SEV_SOURCE,
        confidence:     'élevée',
      });
    }
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE 2 — hpc_pin  (sheet: "PIN CIBLE Clusters", header row 1 = second row)
// ══════════════════════════════════════════════════════════════════════════════
function buildPin(pinFile) {
  const rows = readSheet(pinFile, 'PIN CIBLE Clusters', 1);
  const out  = [];

  // (B) SECTORAL — cluster_level='cluster'
  // Each entry: cluster_code -> [pin_nd, pin_pdi, pin_ret, cible_nd, cible_pdi, cible_ret]
  const SECTORAL = {
    PRO:   ['PRO PIN Non deplaces',   'PRO PIN PDI',       'PRO PIN Retournes',
            'PRO CIBLE Non deplaces', 'PRO CIBLE PDI',     'PRO CIBLE Retournes'],
    ABRIS: ['Abris PIN Non deplaces', 'Abris PIN PDI',     'Abris PIN Retournes',
            'Abris CIBLE Non deplaces','Abris CIBLE PDI',  'Abris CIBLE  Retournes'],   // trailing double-space intentional
    GSAT:  ['GSAT PIN Non deplaces',  'GSAT PIN PDI',      'GSAT PIN Retournes',
            'GSAT CIBLE Non deplaces','GSAT CIBLE PDI',    'GSAT CIBLE Retournes'],
    SANTE: ['Sante PIN Non deplaces', 'Sante PIN PDI',     'Sante PIN Retournes',
            'Sante CIBLE Non deplaces','Sante CIBLE PDI',  'Sante CIBLE Retournes'],
    SECAL: ['SECAL PIN Non deplaces', 'SECAL  PIN PDI',    'SECAL  Pin Retournes',       // double-space + 'Pin' intentional
            'SECAL CIBLE Non deplaces','SECAL  CIBLE PDI', 'SECAL  CIBLE Retournes'],
    WASH:  ['WASH PIN Non deplaces',  'WASH PIN PDI',      'WASH PIN Retournes',
            'WASH CIBLE Non deplaces','WASH CIBLE PDI',    'WASH CIBLE Retournes'],
    NUT:   ['NUT PIN Non deplaces',   'NUT PIN  PDI',      'NUT Pin Retournes',           // double-space + 'Pin' intentional
            'NUT CIBLE Non deplaces', 'NUT CIBLE  PDI',    'NUT CIBLE Retournes'],
    EDU:   ['EDU PIN Non deplaces',   'EDU PIN PDI',       'EDU PIN Retournes',
            'EDU CIBLE Non deplaces', 'EDU CIBLE PDI',     'EDU CIBLE Retournes'],
  };

  // (C) PROTECTION AoRs — cluster_level='aor', parent_cluster='PRO'
  const AORS = {
    VBG: ['VBG PIN Non deplaces',  'VBG PIN PDI',    'VBG PIN Retournes',
          'VBG CIBLE Non deplaces','VBG CIBL E PDI', 'VBG CIBLE Retournes'],  // 'CIBL E' typo intentional
    PE:  ['PE PIN Non deplaces',   'PE PIN PDI',     'PE Pin Retournes',
          'PE CIBLE Non deplaces', 'PE CIBLE PDI',   'PE CIBLE Retournes'],
    LTB: ['LTB PIN Non deplaces',  'LTB PIN PDI',    'LTB PIN Retournes',
          'LTB CIBLE Non deplaces','LTB CIBLE PDI',  'LTB CIBLE Retournes'],
    LAM: ['LAM PIN Non deplaces',  'LAM PIN PDI',    'LAM Pin Retournes',
          'LAM CIBLE Non deplaces2','LAM CIBLE PDI', 'LAM CIBLE Retournes'],  // 'Non deplaces2' typo intentional
  };

  // (D) INTERSECTORAL columns (typo 'INTERCTOR' is literal)
  const INTER_PIN   = ['INTERCTOR PIN Non deplaces', 'INTERCTOR PIN PDI', 'INTERCTOR PIN Retournes',   'INTERCTOR PIN Total'];
  const INTER_CIBLE = ['INTERCTOR CIBLE Non deplaces','INTERCTOR CIBLE PDI','INTERCTOR CIBLE Retournes','INTERCTOR CIBLE Total'];
  const INTER_GRPS  = ['non_displaced', 'idp', 'returnee', 'total'];

  // Validate columns upfront
  const allExpected = [
    'Admin 1', 'Admin 1 P-Code', 'Admin 2', 'Admin 2 P-Code',
    'Total Non-déplacés', 'PDI', 'Retournés',
    ...Object.values(SECTORAL).flat(),
    ...Object.values(AORS).flat(),
    ...INTER_PIN, ...INTER_CIBLE,
    'Refugies PIN', 'Refugies cible',
  ];
  warnMissingCols(rows, allExpected, 'PIN CIBLE Clusters');

  const GROUPS = ['non_displaced', 'idp', 'returnee'];

  for (const r of rows) {
    const adm2 = r['Admin 2'];
    if (!adm2) continue; // skip blank/total rows

    const geo = {
      adm1:       r['Admin 1']        || null,
      adm1_pcode: r['Admin 1 P-Code'] || null,
      adm2:       String(adm2),
      adm2_pcode: r['Admin 2 P-Code'] || null,
      hpc_cycle:  HPC_CYCLE,
      source:     PIN_SOURCE,
      as_of_date: null,
    };

    // (A) BASELINE POPULATION — skip if blank
    const baselineCols = {
      non_displaced: 'Total Non-déplacés',
      idp:           'PDI',
      returnee:      'Retournés',
    };
    for (const [grp, col] of Object.entries(baselineCols)) {
      const v = num(r[col]);
      if (v === null) continue;
      out.push({ ...geo, figure_type: 'population', cluster: 'baseline', cluster_level: 'baseline', population_group: grp, figure: v });
    }

    // (B) SECTORAL — blank/NaN → 0
    for (const [cluster, cols] of Object.entries(SECTORAL)) {
      const pinVals   = cols.slice(0, 3).map(c => num(r[c]) ?? 0);
      const cibleVals = cols.slice(3, 6).map(c => num(r[c]) ?? 0);
      for (let i = 0; i < 3; i++) {
        out.push({ ...geo, figure_type: 'pin',    cluster, cluster_level: 'cluster', population_group: GROUPS[i], figure: pinVals[i] });
        out.push({ ...geo, figure_type: 'target', cluster, cluster_level: 'cluster', population_group: GROUPS[i], figure: cibleVals[i] });
      }
    }

    // (C) PROTECTION AoRs — blank/NaN → 0
    for (const [cluster, cols] of Object.entries(AORS)) {
      const pinVals   = cols.slice(0, 3).map(c => num(r[c]) ?? 0);
      const cibleVals = cols.slice(3, 6).map(c => num(r[c]) ?? 0);
      for (let i = 0; i < 3; i++) {
        out.push({ ...geo, figure_type: 'pin',    cluster, cluster_level: 'aor', parent_cluster: 'PRO', population_group: GROUPS[i], figure: pinVals[i] });
        out.push({ ...geo, figure_type: 'target', cluster, cluster_level: 'aor', parent_cluster: 'PRO', population_group: GROUPS[i], figure: cibleVals[i] });
      }
    }

    // (D) INTERSECTORAL — blank/NaN → 0 (Total stored as its own row)
    for (let i = 0; i < 4; i++) {
      const pinV   = num(r[INTER_PIN[i]])   ?? 0;
      const cibleV = num(r[INTER_CIBLE[i]]) ?? 0;
      out.push({ ...geo, figure_type: 'pin',    cluster: 'intersectoral', cluster_level: 'intersectoral', population_group: INTER_GRPS[i], figure: pinV });
      out.push({ ...geo, figure_type: 'target', cluster: 'intersectoral', cluster_level: 'intersectoral', population_group: INTER_GRPS[i], figure: cibleV });
    }

    // (E) REFUGEES — only when value > 0
    const refPin   = num(r['Refugies PIN']);
    const refCible = num(r['Refugies cible']);
    if (refPin   !== null && refPin   > 0) out.push({ ...geo, figure_type: 'pin',    cluster: 'refugee', cluster_level: 'refugee', population_group: 'refugee', figure: refPin });
    if (refCible !== null && refCible > 0) out.push({ ...geo, figure_type: 'target', cluster: 'refugee', cluster_level: 'refugee', population_group: 'refugee', figure: refCible });
  }

  return out;
}

// ── Sanity checks ─────────────────────────────────────────────────────────────
function sanityChecks(pinRows) {
  const sum = (filter) => pinRows.filter(filter).reduce((s, r) => s + r.figure, 0);

  const interPinTotal = sum(r =>
    r.cluster === 'intersectoral' && r.figure_type === 'pin' && r.population_group === 'total');

  const refugeePin = sum(r => r.cluster === 'refugee' && r.figure_type === 'pin');

  const fmt = n => n.toLocaleString('en-US');
  const chk = (label, val, expect, tol = 0.01) => {
    const ok = Math.abs(val - expect) / expect <= tol;
    console.log(`  ${ok ? '✓' : '✗'} ${label}`);
    console.log(`      got ${fmt(val)}  (expect ~${fmt(expect)})`);
  };

  console.log('\n── Sanity checks ─────────────────────────────────────────────────');
  chk('Intersectoral PIN Total (national)', interPinTotal, 4_474_321);
  chk('National refugee PIN',               refugeePin,      41_979);
  console.log('──────────────────────────────────────────────────────────────────\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nload_hpc.js — HPC 2026`);
  console.log(`Mode    : ${DRY_RUN ? 'DRY RUN (no inserts)' : 'LIVE INSERT'}`);
  console.log(`PIN file: ${PIN_FILE}\n`);

  console.log('Building hpc_severity...');
  const sevRows = buildSeverity(PIN_FILE);
  console.log(`  ${sevRows.length} rows built`);

  console.log('Building hpc_pin...');
  const pinRows = buildPin(PIN_FILE);
  console.log(`  ${pinRows.length} rows built`);

  console.log('\n── Row counts ────────────────────────────────────────────────────');
  console.log(`  hpc_severity : ${sevRows.length}`);
  console.log(`  hpc_pin      : ${pinRows.length}`);

  sanityChecks(pinRows);

  if (DRY_RUN) {
    console.log('── First 5 hpc_severity rows ─────────────────────────────────────');
    sevRows.slice(0, 5).forEach((r, i) => console.log(`  [${i}]`, JSON.stringify(r)));

    console.log('\n── First 5 hpc_pin rows ──────────────────────────────────────────');
    pinRows.slice(0, 5).forEach((r, i) => console.log(`  [${i}]`, JSON.stringify(r)));

    console.log('\nDRY RUN complete. Re-run without --dry-run to insert into Supabase.');
    return;
  }

  console.log('Inserting into Supabase...');
  await insertBatched('hpc_severity', sevRows);
  await insertBatched('hpc_pin', pinRows);
  console.log('\nDone.');
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });

// lib/profiling/attitude.js
// Подсчёт 1 этапа (отношение к болезни/лечению).
// Если в /data/attitude_items.csv и /data/attitude_thresholds.csv лежат файлы — берём их;
// иначе используем дефолтный демо‑набор.

import fs from 'fs';
import path from 'path';

function readCsv(relPath) {
  try {
    const p = path.join(process.cwd(), 'data', relPath);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

// --- ДЕФОЛТНЫЕ ДЕМО-ДАННЫЕ ---
export const DEFAULT_ATTITUDE_ITEMS = [
  { id: 'A1-01', text: 'У меня тяжёлое заболевание', scale: 'severity', reverse: 0 },
  { id: 'A1-02', text: 'Часто чувствую слабость', scale: 'severity', reverse: 0 },
  { id: 'A2-01', text: 'Болезнь помогает избегать обязанностей', scale: 'secondary_gain', reverse: 0 },
  { id: 'A3-01', text: 'Стараюсь не показывать, что я болею', scale: 'hide_resist', reverse: 0 },
  { id: 'A4-01', text: 'Я должен упорно трудиться', scale: 'work_escape', reverse: 0 },
  { id: 'A5-01', text: 'Моё будущее кажется печальным', scale: 'low_selfesteem', reverse: 0 },
  { id: 'A5-02', text: 'Я верю в Бога', scale: 'low_selfesteem', reverse: 1 },
  { id: 'A6-01', text: 'Верю в эффективность гомеопатии/остеопатии', scale: 'alt_med', reverse: 0 },
  { id: 'A7-01', text: 'Я воздерживаюсь от алкоголя', scale: 'addictions', reverse: 1 },
  { id: 'A7-02', text: 'Я не курю', scale: 'addictions', reverse: 1 },
  { id: 'A8-01', text: 'Надеюсь, что организм сам справится', scale: 'ignore', reverse: 0 },
  { id: 'A9-01', text: 'Почти всегда тревожусь', scale: 'anxiety', reverse: 0 },
];

export const DEFAULT_THRESHOLDS = {
  severity: { low: [0, 4], med: [5, 9], high: [10, 16] },
  secondary_gain: { low: [0, 2], med: [3, 5], high: [6, 8] },
  hide_resist: { low: [0, 3], med: [4, 7], high: [8, 10] },
  work_escape: { low: [0, 3], med: [4, 7], high: [8, 10] },
  low_selfesteem: { low: [-2, 1], med: [2, 4], high: [5, 6] },
  alt_med: { low: [0, 3], med: [4, 8], high: [9, 12] },
  addictions: { low: [-4, 0], med: [1, 3], high: [4, 6] },
  ignore: { low: [0, 2], med: [3, 4], high: [5, 6] },
  anxiety: { low: [0, 2], med: [3, 4], high: [5, 6] },
};

// --- Загрузка из CSV, если есть ---
export function loadAttitudeItems() {
  const txt = readCsv('attitude_items.csv');
  if (!txt) return DEFAULT_ATTITUDE_ITEMS;
  const lines = txt.trim().split(/\r?\n/);
  lines.shift(); // header
  return lines
    .filter(Boolean)
    .map((l) => {
      // безопасный split с учётом запятых в тексте
      const parts = [];
      let cur = '';
      let q = false;
      for (const ch of l) {
        if (ch === '"') {
          q = !q;
          continue;
        }
        if (ch === ',' && !q) {
          parts.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      parts.push(cur);
      const [id, text, scale, reverse] = parts.map((s) => s.trim());
      return { id, text, scale, reverse: Number(reverse || 0) };
    });
}

export function loadAttitudeThresholds() {
  const txt = readCsv('attitude_thresholds.csv');
  if (!txt) return DEFAULT_THRESHOLDS;
  const lines = txt.trim().split(/\r?\n/);
  lines.shift();
  const out = {};
  lines.forEach((l) => {
    const [scale, low_min, low_max, med_min, med_max, high_min, high_max] = l.split(',').map((s) => s.trim());
    out[scale] = {
      low: [Number(low_min), Number(low_max)],
      med: [Number(med_min), Number(med_max)],
      high: [Number(high_min), Number(high_max)],
    };
  });
  return out;
}

// --- Подсчёт профиля ---
export function computeAttitude(answersMap) {
  const items = loadAttitudeItems();
  const thr = loadAttitudeThresholds();
  const scales = [
    'severity',
    'secondary_gain',
    'hide_resist',
    'work_escape',
    'low_selfesteem',
    'alt_med',
    'addictions',
    'ignore',
    'anxiety',
  ];

  const sums = Object.fromEntries(scales.map((s) => [s, 0]));
  items.forEach((it) => {
    const v = Number(answersMap?.[it.id] ?? 0);
    // реверс 0↔2, 1 остаётся 1
    const val = it.reverse ? (v === 2 ? 0 : v === 0 ? 2 : 1) : v;
    sums[it.scale] = (sums[it.scale] || 0) + val;
  });

  const profile = {};
  const inRange = (x, [a, b]) => x >= a && x <= b;
  function level(scale, val) {
    const t = thr[scale] || DEFAULT_THRESHOLDS[scale];
    if (!t) return 'med';
    if (inRange(val, t.high)) return 'high';
    if (inRange(val, t.med)) return 'med';
    return 'low';
  }

  const risk_tags = [];
  const comm_flags = new Set();

  scales.forEach((s) => {
    const raw = sums[s] || 0;
    const lvl = level(s, raw);
    profile[s] = { raw, level: lvl };
  });

  if (profile.alt_med?.level === 'high') {
    risk_tags.push('alt_medicine_pref');
    comm_flags.add('use_facts_no_pressure');
  }
  if (profile.ignore?.level !== 'low') {
    risk_tags.push('ignore_risk');
    comm_flags.add('short_clear_messages');
  }
  if (profile.anxiety?.level !== 'low') {
    risk_tags.push('anxiety_flag');
    comm_flags.add('slow_pace');
  }
  if (profile.work_escape?.level === 'high') {
    risk_tags.push('avoidance_work');
  }
  if (profile.low_selfesteem?.level !== 'low') {
    comm_flags.add('praise_specific');
  }
  if (profile.secondary_gain?.level !== 'low') {
    risk_tags.push('secondary_gain_flag');
    comm_flags.add('focus_outside_illness');
  }

  return { version: 'v1', scales: profile, risk_tags, comm_flags: Array.from(comm_flags) };
}// Логика подсчёта attitude

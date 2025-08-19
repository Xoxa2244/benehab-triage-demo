// lib/profiling/typology.js
// Подсчёт 2 этапа (акцентуации / тип общения)

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

export const DEFAULT_TYPOLOGY_ITEMS = [
  { id: 'T1-01', text: 'Мне нужна спокойная обстановка и короткие разговоры', scale: 'sensitive' },
  { id: 'T7-01', text: 'Люблю порядок и чёткие инструкции', scale: 'pedantic' },
  { id: 'T9-01', text: 'Предпочитаю активность и разнообразие', scale: 'hyperthymic' },
  { id: 'T6-01', text: 'Остро реагирую на несправедливость', scale: 'stuck' },
  { id: 'T3-01', text: 'Мне важно признание за реальные усилия', scale: 'demonstrative' },
  { id: 'T5-01', text: 'Бывает, что настроение то повышается, то снижается', scale: 'cyclothymic' },
  { id: 'T2-01', text: 'Часто чувствую упадок сил', scale: 'dysthymic' },
  { id: 'T8-01', text: 'Нуждаюсь в личной дистанции', scale: 'withdrawn' },
  { id: 'T4-01', text: 'Раздражают задержки и пустые запреты', scale: 'excitable' },
];

export function loadTypologyItems() {
  const txt = readCsv('typology_items.csv');
  if (!txt) return DEFAULT_TYPOLOGY_ITEMS;
  const lines = txt.trim().split(/\r?\n/);
  lines.shift();
  return lines
    .filter(Boolean)
    .map((l) => {
      // на случай запятых в тексте
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
      const [id, text, scale] = parts.map((s) => s.trim());
      return { id, text, scale };
    });
}

export const DEFAULT_DOMINANCE = { minScore: 5, margin: 2 };

export function loadTypologyThresholds() {
  const txt = readCsv('typology_thresholds.csv');
  if (!txt) return DEFAULT_DOMINANCE;
  const lines = txt.trim().split(/\r?\n/);
  lines.shift();
  const d = { ...DEFAULT_DOMINANCE };
  lines.forEach((l) => {
    const [key, value] = l.split(',').map((s) => s.trim());
    d[key] = Number(value);
  });
  return d;
}

export function computeTypology(answersMap) {
  const items = loadTypologyItems();
  const types = [
    'sensitive',
    'dysthymic',
    'demonstrative',
    'excitable',
    'cyclothymic',
    'stuck',
    'pedantic',
    'withdrawn',
    'hyperthymic',
  ];
  const sums = Object.fromEntries(types.map((t) => [t, 0]));
  items.forEach((it) => {
    sums[it.scale] += answersMap?.[it.id] ? 1 : 0; // чек‑лист: true/false
  });

  const thr = loadTypologyThresholds();
  const arr = types.map((t) => ({ t, s: sums[t] })).sort((a, b) => b.s - a.s);
  const dom = [];
  if (arr[0].s >= thr.minScore) {
    dom.push(arr[0].t);
    if (arr[1] && arr[0].s - arr[1].s < thr.margin && arr[1].s >= thr.minScore - 1) {
      dom.push(arr[1].t);
    }
  }

  const tone_modifiers = {};
  const doList = new Set();
  const avoidList = new Set();

  const add = (t) => {
    switch (t) {
      case 'pedantic':
        tone_modifiers.session_length = 'short';
        tone_modifiers.info_depth = 'full_detail';
        tone_modifiers.pressure_level = 'low';
        doList.add('давать порядок и проверенные шаги');
        avoidList.add('хаос и торопливость');
        break;
      case 'sensitive':
        tone_modifiers.session_length = 'short';
        doList.add('признавать усталость, дозировать нагрузку');
        avoidList.add('перегрузки и спешка');
        break;
      case 'hyperthymic':
        doList.add('давать активные задачи и варианты');
        avoidList.add('монотонные запреты');
        break;
      case 'stuck':
        doList.add('подчёркивать справедливость и последовательность');
        avoidList.add('непоследовательность');
        break;
      case 'demonstrative':
        doList.add('похвала за реальные действия');
        avoidList.add('пустые комплименты');
        break;
      case 'cyclothymic':
        doList.add('подстраиваться под текущую фазу');
        avoidList.add('жёсткая регламентация в подъём, критика в спад');
        break;
      case 'dysthymic':
        doList.add('поддержка, чувство нужности');
        avoidList.add('критика и указание на ошибки');
        break;
      case 'withdrawn':
        doList.add('соблюдать дистанцию и автономию');
        avoidList.add('навязчивая эмоциональность');
        break;
      case 'excitable':
        doList.add('быстрая обратная связь, объяснять последствия');
        avoidList.add('запреты без объяснений');
        break;
    }
  };
  dom.forEach(add);

  return {
    version: 'v1',
    scores: sums,
    dominant_types: dom,
    tone_modifiers,
    do: Array.from(doList),
    avoid: Array.from(avoidList),
  };
}

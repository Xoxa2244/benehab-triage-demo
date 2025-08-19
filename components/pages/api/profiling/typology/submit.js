import { computeTypology } from '../../../../lib/profiling/typology';
export default function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {answers}=req.body||{};
  const profile=computeTypology(answers||{});
  const summary=makeSummary(profile);
  res.status(200).json({profile,summary});
}
function makeSummary(p){
  const dom=p.dominant_types||[];
  if(!dom.length) return 'Спасибо! Сохраняю спокойный, поддерживающий стиль и даю выбор.';
  const map={pedantic:'Буду давать структуру и полный порядок без спешки.',sensitive:'Сделаем короткие и бережные шаги без перегрузки.',hyperthymic:'Добавлю варианты и активные задачи.',stuck:'Сохраню последовательность и прозрачность.',demonstrative:'Буду отмечать реальные успехи.',cyclothymic:'Подстроюсь под текущий темп.',dysthymic:'Поддержу и без критики помогу двигаться по чуть‑чуть.',withdrawn:'Соблюду дистанцию, больше фактов — меньше эмоций.',excitable:'Буду давать быстрые ответы и объяснять последствия.'};
  return 'Спасибо! '+dom.map(t=>map[t]).filter(Boolean).join(' ');
}

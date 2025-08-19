import { computeAttitude } from '../../../../lib/profiling/attitude';
export default function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {answers}=req.body||{};
  const profile=computeAttitude(answers||{});
  const summary=makeSummary(profile);
  res.status(200).json({profile,summary});
}
function makeSummary(p){
  const parts=[];
  if(p.scales?.anxiety?.level!=='low') parts.push('Буду говорить спокойнее и по шагам, чтобы снизить тревогу.');
  if(p.scales?.alt_med?.level==='high') parts.push('Дам фактическую информацию о препаратах без давления и без дозировок.');
  if(p.scales?.ignore?.level!=='low') parts.push('Предложу короткие понятные шаги — без перегрузки.');
  if(p.scales?.work_escape?.level==='high') parts.push('Помогу встроить план в день микрошагами.');
  if(p.scales?.low_selfesteem?.level!=='low') parts.push('Буду отмечать конкретные успехи — это поддерживает.');
  return parts.length ? 'Спасибо! '+parts.join(' ') : 'Спасибо! Я подстрою стиль общения под тебя.';
}

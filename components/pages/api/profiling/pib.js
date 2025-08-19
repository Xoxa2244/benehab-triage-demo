export default function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {attitude_profile,typology_profile}=req.body||{};
  const plan=derivePlan(attitude_profile,typology_profile);
  res.status(200).json({pib:{version:'v1',attitude_profile,accentuation_profile:typology_profile,communication_plan:plan}});
}
function derivePlan(A,B){
  const plan={tone:'calm_supportive',style_tags:[],do:[],avoid:[]};
  if(A?.risk_tags?.includes('anxiety_flag')) plan.style_tags.push('slow_pace');
  if(A?.risk_tags?.includes('ignore_risk')) plan.style_tags.push('short_clear_messages');
  if(A?.risk_tags?.includes('alt_medicine_pref')) plan.style_tags.push('use_facts_no_pressure');
  if(A?.comm_flags?.includes('praise_specific')) plan.do.push('похвалу за конкретные шаги');
  if(B?.tone_modifiers?.session_length==='short') plan.style_tags.push('short_sessions');
  if(B?.tone_modifiers?.info_depth==='full_detail') plan.style_tags.push('full_detail');
  if(B?.do?.length) plan.do=[...new Set([...plan.do,...B.do])];
  if(B?.avoid?.length) plan.avoid=[...new Set([...plan.avoid,...B.avoid])];
  return plan;
}

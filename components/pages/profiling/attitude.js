import { useEffect, useState } from 'react';
import SurveyLikert from '../../components/SurveyLikert';
import ProfileSummary from '../../components/ProfileSummary';
import Link from 'next/link';

export default function AttitudeSurvey(){
  const [items,setItems]=useState([]);
  const [answers,setAnswers]=useState({});
  const [summary,setSummary]=useState(null);
  const [profile,setProfile]=useState(null);

  useEffect(()=>{fetch('/api/profiling/attitude/items').then(r=>r.json()).then(d=>{
    setItems(d.items||[]);
    if(typeof window!=='undefined'){
      const saved=JSON.parse(localStorage.getItem('benehab_attitude_answers')||'{}');
      setAnswers(saved);
    }
  });},[]);

  const onChange=(id,val)=>{
    const next={...answers,[id]:val};
    setAnswers(next);
    if(typeof window!=='undefined') localStorage.setItem('benehab_attitude_answers',JSON.stringify(next));
  };

  const submit=async()=>{
    const res=await fetch('/api/profiling/attitude/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})});
    const data=await res.json();
    setProfile(data.profile); setSummary(data.summary);
    if(typeof window!=='undefined') localStorage.setItem('benehab_attitude_profile',JSON.stringify(data.profile));
  };

  const done=profile && summary;

  return (<div className="max-w-3xl mx-auto p-6 space-y-4">
    <h1 className="text-xl font-semibold">Шаг 1 — Отношение к болезни и лечению</h1>
    <p className="text-sm text-gray-600">Отвечай так, как чувствуешь сейчас. Правильных/неправильных ответов нет.</p>
    <div className="grid gap-3">{items.map(it=>(<SurveyLikert key={it.id} item={it} value={answers[it.id]} onChange={onChange}/>))}</div>
    <div className="flex gap-2">
      <button onClick={submit} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Завершить шаг 1</button>
      <Link href="/profiling" className="px-4 py-2 rounded-xl border">Выйти</Link>
    </div>
    {done && (<ProfileSummary title="Как я буду общаться лучше" lines={[summary]} />)}
    {done && (<div className="pt-2"><Link href="/profiling/typology" className="px-4 py-2 inline-block rounded-xl bg-indigo-600 text-white">Продолжить шагом 2 →</Link></div>)}
  </div>);
}

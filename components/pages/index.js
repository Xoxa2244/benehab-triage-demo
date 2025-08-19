'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import OnboardingCard from '../components/OnboardingCard';

export default function Home(){
  const [messages,setMessages]=useState([{role:'assistant',content:'Привет! Я — Татьяна, твой ассистент по здоровью. Расскажи, что беспокоит. Если станет совсем плохо — нажми SOS.'}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false);
  const [demoDone,setDemoDone]=useState(false); const [needProfiling,setNeedProfiling]=useState(false);

  useEffect(()=>{
    if(typeof window==='undefined') return;
    const demo=!!localStorage.getItem('benehab_demographics');
    const haveA=!!localStorage.getItem('benehab_attitude_profile');
    const haveT=!!localStorage.getItem('benehab_typology_profile');
    setDemoDone(demo); setNeedProfiling(!(haveA&&haveT));
  },[]);

  const listRef=useRef(null);
  useEffect(()=>{ if(listRef.current) listRef.current.scrollTop=listRef.current.scrollHeight; },[messages]);

  const getPIB=async()=>{
    if(typeof window==='undefined') return null;
    const A=JSON.parse(localStorage.getItem('benehab_attitude_profile')||'null');
    const B=JSON.parse(localStorage.getItem('benehab_typology_profile')||'null');
    if(!A && !B) return null;
    const r=await fetch('/api/profiling/pib',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attitude_profile:A,typology_profile:B})});
    const d=await r.json(); return d.pib||null;
  };

  const send=async(text)=>{
    if(!text.trim()) return;
    const next=[...messages,{role:'user',content:text}];
    setMessages(next); setInput(''); setLoading(true);
    try{
      const pib=await getPIB();
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next,meta:{pib}})});
      const d=await r.json();
      setMessages(m=>[...m,{role:'assistant',content:d.content||'Готово.'}]);
    }catch(e){
      setMessages(m=>[...m,{role:'assistant',content:'Что-то пошло не так. Попробуй ещё раз.'}]);
    }finally{ setLoading(false); }
  };

  return (<div className="min-h-screen">
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      {!demoDone && <OnboardingCard onDone={()=>setDemoDone(true)} />}
      {demoDone && needProfiling && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm">
          <div className="font-medium mb-1">Можно я задам несколько коротких вопросов? Это займёт 5–10 минут и поможет мне говорить с тобой максимально комфортно.</div>
          <Link href="/profiling" className="inline-block px-3 py-1.5 rounded-xl bg-emerald-600 text-white">Да, пройти опрос →</Link>
        </div>
      )}
      <div className="bg-slate-100/60 rounded-2xl p-3 h-[60vh] overflow-y-auto border" ref={listRef}>
        <div className="space-y-2">
          {messages.map((m,i)=>(
            <div key={i} className="w-full flex justify-start">
              <div className={`max-w-[85%] rounded-2xl shadow p-3 text-sm leading-relaxed ${m.role==='user'?'bg-blue-50 ml-auto':'bg-white'}`}>{m.content}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-2 flex items-center gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input);}}} placeholder="Опиши симптомы или задай медицинский вопрос…" className="flex-1 px-3 py-2 outline-none"/>
        <button onClick={()=>send(input)} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50">Отправить</button>
      </div>
      <div className="text-xs text-gray-500">Демо: ассистент даёт фактическую справку по препаратам без дозировок и не назначает лечение. При опасных симптомах — вызывайте скорую.</div>
    </div>
  </div>);
}

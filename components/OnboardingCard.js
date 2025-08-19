import { useState } from 'react';

export default function OnboardingCard({ onDone }) {
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const save = () => {
    const demo = { age: age || null, height: height || null, weight: weight || null };
    if (typeof window !== 'undefined') {
      localStorage.setItem('benehab_demographics', JSON.stringify(demo));
    }
    onDone?.(demo);
  };

  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
      <div className="font-medium">Привет! Я — Татьяна, твой ассистент по здоровью.</div>
      <div className="text-sm text-gray-700">
        Я помогу записаться к врачу, ответить на вопросы по препаратам и напоминать о назначениях.
        <br />Чтобы лучше подстроиться, скажи, пожалуйста: возраст, рост и вес.
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input placeholder="Возраст" value={age} onChange={(e) => setAge(e.target.value)} className="px-3 py-2 border rounded-xl" />
        <input placeholder="Рост (см)" value={height} onChange={(e) => setHeight(e.target.value)} className="px-3 py-2 border rounded-xl" />
        <input placeholder="Вес (кг)" value={weight} onChange={(e) => setWeight(e.target.value)} className="px-3 py-2 border rounded-xl" />
      </div>
      <button onClick={save} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Продолжить</button>
    </div>
  );
}

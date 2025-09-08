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
      <div className="font-medium">Hello! I am Tatiana, your health assistant.</div>
      <div className="text-sm text-gray-700">
        I will help you book doctor appointments, answer questions about medications and remind you about assignments.
        <br />To better adapt, please tell me: age, height and weight.
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="px-3 py-2 border rounded-xl" />
        <input placeholder="Height (cm)" value={height} onChange={(e) => setHeight(e.target.value)} className="px-3 py-2 border rounded-xl" />
        <input placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} className="px-3 py-2 border rounded-xl" />
      </div>
      <button onClick={save} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Continue</button>
    </div>
  );
}

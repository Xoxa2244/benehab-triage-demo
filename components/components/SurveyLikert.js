export default function SurveyLikert({ item, value, onChange }) {
  const v = value ?? null;
  const Btn = (val, label) => (
    <button
      key={val}
      onClick={() => onChange(item.id, val)}
      className={`px-3 py-2 rounded-lg border text-sm ${v === val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border">
      <div className="text-sm mb-3">{item.text}</div>
      <div className="flex gap-2">{[Btn(0, 'Нет'), Btn(1, 'Отчасти'), Btn(2, 'Да')]}</div>
    </div>
  );
}

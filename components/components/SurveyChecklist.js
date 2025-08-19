export default function SurveyChecklist({ item, value, onChange }) {
  const v = !!value;
  return (
    <label className="bg-white rounded-2xl p-4 shadow-sm border flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={v} onChange={(e) => onChange(item.id, e.target.checked)} className="mt-1" />
      <span className="text-sm">{item.text}</span>
    </label>
  );
}

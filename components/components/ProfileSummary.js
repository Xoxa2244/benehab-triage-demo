export default function ProfileSummary({ title, lines = [] }) {
  if (!lines.length) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm">
      <div className="font-medium mb-1">{title}</div>
      <ul className="list-disc ml-4 text-emerald-800">
        {lines.map((l, i) => (<li key={i}>{l}</li>))}
      </ul>
    </div>
  );
}

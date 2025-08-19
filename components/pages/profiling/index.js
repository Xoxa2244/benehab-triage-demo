import Link from 'next/link';
export default function ProfilingHome(){
  return (<div className="max-w-3xl mx-auto p-6 space-y-6">
    <h1 className="text-2xl font-semibold">Персонализация общения</h1>
    <p className="text-sm text-gray-600">За 5–10 минут я подстрою стиль общения под тебя. Можно остановиться в любой момент.</p>
    <div className="grid gap-3">
      <Link href="/profiling/attitude" className="bg-white border rounded-2xl p-4 shadow hover:shadow-md">
        <div className="font-medium">Шаг 1 — Отношение к болезни и лечению</div>
        <div className="text-sm text-gray-600">Короткие утверждения, ответы «Нет / Отчасти / Да»</div>
      </Link>
      <Link href="/profiling/typology" className="bg-white border rounded-2xl p-4 shadow hover:shadow-md">
        <div className="font-medium">Шаг 2 — Тип личности (акцентуации)</div>
        <div className="text-sm text-gray-600">Чек‑лист по 9 шкалам</div>
      </Link>
    </div>
    <Link href="/" className="inline-block text-sm text-emerald-700">← Вернуться в чат</Link>
  </div>);
}

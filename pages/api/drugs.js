
/**
 * GET /api/drugs?name=aspirin
 * Uses openFDA drug/label endpoint for factual monograph sections (no doses).
 * Note: English labels; for RU локализация можно подключить eapteka/vidal later.
 */
export default async function handler(req, res) {
  const { name = "" } = req.query;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(name)}+openfda.generic_name:${encodeURIComponent(name)}&limit=1`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`openFDA ${r.status}`);
    const data = await r.json();
    const item = data.results?.[0] || {};
    // Extract factual fields (when present)
    const out = {
      brand: item.openfda?.brand_name?.[0] || null,
      generic: item.openfda?.generic_name?.[0] || null,
      indications: item.indications_and_usage?.[0] || null,
      contraindications: item.contraindications?.[0] || null,
      warnings: item.warnings?.[0] || item.warnings_and_cautions?.[0] || null,
      adverse_reactions: item.adverse_reactions?.[0] || null,
      pregnancy: item.pregnancy?.[0] || null,
      disclaimer: "Это информационная сводка по официальным листкам-вкладышам. Я не назначаю лечение и не указываю дозировки."
    };
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}


/**
 * GET /api/clinics?q=ЛОР&city=Москва&limit=5
 * Lightweight search via OpenStreetMap Nominatim (no key).
 * Note: For production prefer Places API with SLA.
 */
export default async function handler(req, res) {
  const { q = '', city = '', limit = 5 } = req.query;
  const query = encodeURIComponent([q, city, 'clinic'].filter(Boolean).join(' '));
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${query}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'benehab-triage-demo/1.0' } });
    const data = await r.json();
    const items = data.map((x) => ({
      name: x.display_name?.split(',')[0],
      address: x.display_name,
      lat: x.lat,
      lon: x.lon,
      // phones are not in Nominatim; keep null, UI should show it's missing
      phone: null,
      source: 'nominatim'
    }));
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Proxy metric update/delete to FastAPI backend

export default async function handler(req, res) {
  const { metricName } = req.query;
  if (!metricName) {
    return res.status(400).json({ error: 'Metric name is required' });
  }

  const baseUrl =
    typeof window === 'undefined'
      ? process.env.INTERNAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL;
  const backendUrl = baseUrl || 'http://localhost:8000';
  const endpoint = `${backendUrl}/api/metrics/${metricName}`;

  const method = req.method;
  if (!['PUT', 'DELETE'].includes(method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers: method === 'PUT' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'PUT' ? JSON.stringify(req.body || {}) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: 'Backend error', details: text });
    }
    return res.status(method === 'PUT' ? 200 : 204).json(text ? JSON.parse(text) : {});
  } catch (error) {
    console.error('Error proxying metric request:', error);
    return res
      .status(500)
      .json({ error: 'Internal error', details: error.message });
  }
}

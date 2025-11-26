// Proxy metrics list/create to FastAPI backend

export default async function handler(req, res) {
  const baseUrl =
    typeof window === 'undefined'
      ? process.env.INTERNAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL;
  const backendUrl = baseUrl || 'http://localhost:8000';
  const endpoint = `${backendUrl}/api/metrics`;

  if (req.method === 'GET') {
    try {
      const response = await fetch(endpoint);
      const text = await response.text();
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: 'Backend error', details: text });
      }
      return res.status(200).json(JSON.parse(text));
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return res
        .status(500)
        .json({ error: 'Internal error', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      const text = await response.text();
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: 'Backend error', details: text });
      }
      return res.status(201).json(JSON.parse(text));
    } catch (error) {
      console.error('Error creating metric:', error);
      return res
        .status(500)
        .json({ error: 'Internal error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

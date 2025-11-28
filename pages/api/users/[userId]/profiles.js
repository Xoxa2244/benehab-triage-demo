// Proxy PATCH profiles to FastAPI backend
export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const baseUrl =
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = baseUrl || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/users/${userId}/profiles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });

    const data = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Backend error', details: data });
    }

    return res.status(200).json(JSON.parse(data));
  } catch (error) {
    console.error('Error proxying user profile update:', error);
    return res.status(500).json({ error: 'Internal error', details: error.message });
  }
}

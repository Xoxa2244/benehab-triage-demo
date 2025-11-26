// Proxy to backend Color Test inputs
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl =
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = baseUrl || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/color-tests/inputs`);
    if (!response.ok) {
      const text = await response.text();
      return res
        .status(response.status)
        .json({ error: 'Backend error', details: text });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching color test inputs:', error);
    return res.status(500).json({ error: 'Internal error', details: error.message });
  }
}

// pages/api/chats/[chatId]/refresh-instructions.js - Proxy to refresh chat instructions on backend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;
  const { patient_tags } = req.body || {};

  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    const endpoint = `${baseUrl}/api/chats/${chatId}/refresh-instructions`;

    console.log('🔄 Proxying refresh instructions to backend:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_tags })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Backend error', detail: errorText });
    }

    const data = await response.json();
    console.log('✅ Instructions refreshed on backend');
    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error refreshing instructions:', error);
    return res.status(500).json({ error: 'Failed to refresh instructions', detail: error.message });
  }
}

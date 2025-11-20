// pages/api/chats/[chatId]/instructions.js - Proxy to get raw/final instructions
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;

  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    const endpoint = `${baseUrl}/api/chats/${chatId}/instructions`;

    console.log('🔄 Proxying instructions fetch to backend:', endpoint);

    const response = await fetch(endpoint, { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Backend error', detail: errorText });
    }

    const data = await response.json();
    console.log('✅ Instructions fetched from backend');
    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error fetching instructions:', error);
    return res.status(500).json({ error: 'Failed to fetch instructions', detail: error.message });
  }
}

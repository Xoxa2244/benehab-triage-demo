// pages/api/chats/[chatId]/clear-history.js - Proxy to clear chat history on backend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;

  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    const endpoint = `${baseUrl}/api/chats/${chatId}/clear-history`;

    console.log('🔄 Proxying clear chat history to backend:', endpoint);

    const response = await fetch(endpoint, { method: 'POST' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Backend error', detail: errorText });
    }

    const data = await response.json();
    console.log('✅ Chat history cleared on backend');
    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error clearing chat history:', error);
    return res.status(500).json({ error: 'Failed to clear chat history', detail: error.message });
  }
}

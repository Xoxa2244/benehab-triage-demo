// pages/api/chats/[chatId]/index.js - Proxy for getting chat data
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId } = req.query;

    console.log('🔄 Proxying get chat data to backend for chat:', chatId);
    
    // Use INTERNAL_API_URL for server-side requests
    const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    const endpoint = `${baseUrl}/api/chats/${chatId}`;
    
    console.log('🎯 Backend URL:', endpoint);

    // Call backend API
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Chat data retrieved successfully');

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error getting chat data:', error);
    res.status(500).json({ 
      error: 'Failed to get chat data',
      detail: error.message
    });
  }
}
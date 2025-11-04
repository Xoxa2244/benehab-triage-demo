// pages/api/chats/[chatId]/message.js - Proxy for sending messages
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId } = req.query;
    const { message } = req.body;

    console.log('🔄 Proxying message to backend for chat:', chatId);
    
    // Use INTERNAL_API_URL for server-side requests
    const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    const endpoint = `${baseUrl}/api/chats/${chatId}/message`;
    
    console.log('🎯 Backend URL:', endpoint);

    // Call backend API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Message sent successfully');

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      detail: error.message
    });
  }
}
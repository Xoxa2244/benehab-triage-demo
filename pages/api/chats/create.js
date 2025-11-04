// pages/api/chats/create.js - Proxy for chat creation
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { diagnosis, prescriptions, patient_tags } = req.body;

    console.log('🔄 Proxying chat creation to backend');
    
    // Use INTERNAL_API_URL for server-side requests
    const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000';
    const endpoint = `${baseUrl}/api/chats/create`;
    
    console.log('🎯 Backend URL:', endpoint);

    // Call backend API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diagnosis,
        prescriptions,
        patient_tags
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Chat created successfully');

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error creating chat:', error);
    res.status(500).json({ 
      error: 'Failed to create chat',
      detail: error.message
    });
  }
}
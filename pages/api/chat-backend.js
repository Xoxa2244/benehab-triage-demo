// pages/api/chat-backend.js - Proxy to FastAPI backend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, profile, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🔄 Proxying to backend:', message);
    
    // Use INTERNAL_API_URL for server-side requests, NEXT_PUBLIC_API_URL for client-side
    const baseUrl = typeof window === 'undefined'
      ? process.env.INTERNAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL;
    
    const backendUrl = baseUrl || 'http://localhost:8000';
    const endpoint = `${backendUrl}/api/chat`;
    
    console.log('🎯 Backend URL:', endpoint);

    // Prepare request body for backend
    const backendRequest = {
      message: message,
      user_id: profile?.userId || 'anonymous',
      session_id: context?.sessionId || `session_${Date.now()}`,
      context: {
        demographics: profile?.demographics || null,
        profiling: profile?.profiling || null,
        activeAssignments: context?.activeAssignments || []
      }
    };

    console.log('📤 Sending to backend:', JSON.stringify(backendRequest, null, 2));

    // Call backend API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Backend response received');

    // Return response in format expected by frontend
    res.status(200).json({
      response: data.response,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'Response from FastAPI backend',
      chat_id: data.chat_id,
      message_id: data.message_id
    });

  } catch (error) {
    console.error('❌ Error calling backend:', error);
    
    // Fallback response
    res.status(500).json({ 
      error: 'Backend connection error',
      details: error.message,
      response: 'Извините, у меня временные проблемы с подключением к серверу. Пожалуйста, попробуйте снова через минуту.',
      success: false,
      note: 'Fallback response due to backend error'
    });
  }
}
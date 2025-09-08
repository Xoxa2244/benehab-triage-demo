// pages/api/chat-simple.js - Simple version for diagnostics
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);

    // Simple response without OpenAI for testing
    const simpleResponse = `Hello! I am Tatiana, your health assistant. 👋

You wrote: "${message}"

Unfortunately, I have temporary problems connecting to the AI service. But I am here and ready to help!

What is bothering you? I can give general health advice or help with assignments.`;

    res.status(200).json({
      response: simpleResponse,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'This is a simple version of Tatiana for diagnostics'
    });

  } catch (error) {
    console.error('Error in simple chat API:', error);
    
    res.status(500).json({ 
      error: 'Message processing error',
      details: error.message,
      fallback: 'Sorry, an error occurred. Please try again.'
    });
  }
}

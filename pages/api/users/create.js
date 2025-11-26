// pages/api/users/create.js - Proxy to FastAPI backend for user creation

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, demographics, email, chat_id } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const baseUrl =
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL;

    const backendUrl = baseUrl || 'http://localhost:8000';
    const endpoint = `${backendUrl}/api/users`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: email || null,
        demographics: demographics || null,
        chat_id: chat_id || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('User creation failed:', response.status, errorText);
      return res
        .status(response.status)
        .json({ error: 'Backend user creation failed', details: errorText });
    }

    const data = await response.json();
    return res.status(201).json({ user: data });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      error: 'Internal error creating user',
      details: error.message,
    });
  }
}

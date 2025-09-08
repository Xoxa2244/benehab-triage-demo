// pages/api/notifications/check.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assignmentId } = req.body;
    
    // In demo mode, just return check information
    const now = new Date();
    const currentTime = now.toLocaleTimeString('ru-RU');
    
    console.log(`[${currentTime}] Checking notifications for assignment:`, assignmentId);
    
    // Here should be logic for checking time and sending notifications
    // In real application this is done through cron job
    
    res.status(200).json({
      message: 'Notification check completed',
      timestamp: now.toISOString(),
      currentTime,
      assignmentId,
      note: 'In demo mode, notifications are not sent automatically. Use the "Test notification" button on the assignments page.'
    });
    
  } catch (error) {
    console.error('Notification check error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

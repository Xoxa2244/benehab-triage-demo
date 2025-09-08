// pages/api/chat.js - Enhanced version with assignment proactivity
// VERCEL UPDATE: 2025-08-29 20:45 - Forced update to fix cache
import OpenAI from 'openai';

// Initialize OpenAI only if API key is available
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized');
  } else {
    console.log('⚠️ OPENAI_API_KEY not found, using only fallback');
  }
} catch (error) {
  console.log('⚠️ OpenAI initialization error:', error.message);
}

// Enhanced fallback with assignment proactivity
function getFallbackResponse(message, profile, context) {
  const lowerMessage = message.toLowerCase();
  
  let response = `Hello! I am Tatiana, your health assistant. 👋\n\n`;
  
  // PROACTIVITY: First check assignments
  if (context && context.activeAssignments && context.activeAssignments.length > 0) {
    response += `📋 **IMPORTANT! You have ${context.activeAssignments.length} uncompleted assignment:**\n\n`;
    
    context.activeAssignments.forEach((assignment, index) => {
      response += `${index + 1}. **${assignment.title}** (${assignment.type})\n`;
      if (assignment.description) {
        response += `   ${assignment.description}\n`;
      }
      if (assignment.dueDate) {
        response += `   📅 Due: ${new Date(assignment.dueDate).toLocaleDateString()}\n`;
      }
      response += `\n`;
    });
    
    response += `💡 **I recommend:**\n`;
    response += `• Complete assignments soon\n`;
    response += `• Set reminders\n`;
    response += `• Discuss difficulties if any\n\n`;
  }
  
  // Analyze message and give appropriate response
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    response += `Glad to see you! How are you feeling today?`;
    
    // Additional proactivity on greeting
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      response += `\n\nBy the way, I see your assignments above. Would you like me to help with their completion?`;
    }
  } else if (lowerMessage.includes('doctor') || lowerMessage.includes('appointment')) {
    response += `Would you like to make an appointment with a doctor? We have available slots: 13:00, 15:00, 17:00. What time is convenient for you?`;
  } else if (lowerMessage.includes('medication') || lowerMessage.includes('drug') || lowerMessage.includes('pill')) {
    response += `I can provide general information about medications (indications, contraindications, side effects), but only a doctor determines dosages. What specifically interests you?`;
  } else if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('bad')) {
    response += `I understand something is bothering you. Tell me more - when did it start, what exactly hurts, are there other symptoms?`;
  } else if (lowerMessage.includes('assignment') || lowerMessage.includes('help') || lowerMessage.includes('task') || lowerMessage.includes('remind') || lowerMessage.includes('what was assigned') || lowerMessage.includes('what specifically')) {
    response += `Of course, I will help with assignments! `;
    
    if (context && context.activeAssignments && context.activeAssignments.length > 0) {
      response += `You have ${context.activeAssignments.length} active assignment. Let's analyze each one:\n\n`;
      
      context.activeAssignments.forEach((assignment, index) => {
        response += `**${assignment.title}** (${assignment.type})\n`;
        if (assignment.description) {
          response += `${assignment.description}\n`;
        }
        response += `What exactly needs to be done? Are there any difficulties?\n\n`;
      });
      
      // Additional help
      response += `💡 **What I can offer:**\n`;
      response += `• Help with time planning\n`;
      response += `• Discuss completion difficulties\n`;
      response += `• Set up reminders\n`;
      response += `• Adapt plan to your capabilities\n\n`;
      
      response += `Which assignment needs help first?`;
    } else {
      response += `You currently have no active assignments. Would you like to create a new one?`;
    }
  } else {
    response += `Interesting question! Tell me more about what interests you.`;
  }
  
  // Add profile information if available
  if (profile && profile.demographics) {
    response += `\n\n👤 **About you:** ${profile.demographics.age} years old, ${profile.demographics.gender === 'male' ? 'male' : 'female'}. `;
    
    if (profile.demographics.age < 30) {
      response += `At your age, it is important to take care of your health for the future! 💪`;
    } else if (profile.demographics.age > 60) {
      response += `At your age, it is especially important to have regular check-ups. 🏥`;
    }
  }
  
  response += `\n\nI am here to support you! 💙`;
  
  return response;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, profile, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🎯 ENHANCED API: Received message:', message);
    console.log('🎯 ENHANCED API: Profile:', profile ? 'Yes' : 'No');
    console.log('🎯 ENHANCED API: Assignment context:', context ? 'Yes' : 'No');
    
    if (context && context.activeAssignments) {
      console.log('🎯 ENHANCED API: Active assignments:', context.activeAssignments.length);
      context.activeAssignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.title} (${assignment.type})`);
      });
    } else {
      console.log('🎯 ENHANCED API: Assignment context is missing or empty');
    }

    // Try to use OpenAI if available
    if (openai) {
      try {
        console.log('🎯 ENHANCED API: Trying to use OpenAI...');
        
        // УЛУЧШЕННЫЙ СИСТЕМНЫЙ ПРОМПТ С НАЗНАЧЕНИЯМИ
        let systemPrompt = `You are "Tatiana", a health assistant for Benehab. Speak warmly, with empathy, adapt to the user. Don't make diagnoses or prescribe medications. About medications, provide only reference information WITHOUT dosages.

ОСОБЕННО ВАЖНО - БУДЬ ПРОАКТИВНОЙ ПО НАЗНАЧЕНИЯМ:
• If user has uncompleted assignments - MANDATORY mention them
• Offer specific help with each assignment
• Remind about importance of completing assignments
• Ask about difficulties and help solve them
• Be persistent but friendly

ТОН ОБЩЕНИЯ:
• Friendly and supportive
• Professional but not formal
• Use emojis for warmth
• Ask clarifying questions when necessary`;

        // Add assignment information to prompt
        if (context && context.activeAssignments && context.activeAssignments.length > 0) {
          console.log('🎯 ENHANCED API: Adding assignments to OpenAI prompt');
          
          systemPrompt += `\n\nАКТИВНЫЕ НАЗНАЧЕНИЯ ПОЛЬЗОВАТЕЛЯ (ОБЯЗАТЕЛЬНО УЧТИ):
User has ${context.activeAssignments.length} uncompleted assignment:`;
          
          context.activeAssignments.forEach((assignment, index) => {
            systemPrompt += `\n${index + 1}. ${assignment.title} (${assignment.type})`;
            if (assignment.description) {
              systemPrompt += ` - ${assignment.description}`;
            }
            if (assignment.dueDate) {
              systemPrompt += ` - due: ${new Date(assignment.dueDate).toLocaleDateString()}`;
            }
          });
          
          systemPrompt += `\n\nИНСТРУКЦИИ ПО НАЗНАЧЕНИЯМ:
- MANDATORY mention assignments in response
- Offer specific help with each
- Remind about importance of completion
- Ask about difficulties
- Be proactive and persistent`;
          
          console.log('🎯 ENHANCED API: OpenAI prompt updated with assignments');
        } else {
          console.log('🎯 ENHANCED API: No assignments, OpenAI prompt without assignments');
        }
        
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0].message.content;
        console.log('🎯 ENHANCED API: OpenAI response received:', aiResponse.substring(0, 100) + '...');

        res.status(200).json({
          response: aiResponse,
          success: true,
          timestamp: new Date().toISOString(),
          note: 'AI response from OpenAI (ENHANCED API)',
          assignments_count: context?.activeAssignments?.length || 0
        });
        return;
        
      } catch (openaiError) {
        console.log('🎯 ENHANCED API: OpenAI unavailable, using fallback:', openaiError.message);
      }
    } else {
      console.log('🎯 ENHANCED API: OpenAI not initialized, using fallback');
    }
    
    // Use enhanced fallback response
    console.log('🎯 ENHANCED API: Using fallback response');
    const fallbackResponse = getFallbackResponse(message, profile, context);
    
    res.status(200).json({
      response: fallbackResponse,
      success: true,
      timestamp: new Date().toISOString(),
      note: 'Enhanced fallback response (ENHANCED API)',
      openai_available: !!openai,
      assignments_count: context?.activeAssignments?.length || 0
    });

  } catch (error) {
    console.error('🎯 ENHANCED API: Critical error:', error);
    
    // Critical fallback
    res.status(500).json({ 
      error: 'Critical error',
      details: error.message,
      fallback: 'Sorry, I have technical problems. Please try writing again in a minute.',
      note: 'Critical fallback (ENHANCED API)'
    });
  }
}

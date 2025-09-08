// pages/index.js

import { useState, useEffect } from 'react';
import DemographicsCheck from '../components/DemographicsCheck';

export default function Home() {
  const [demographics, setDemographics] = useState(null);
  const [completedSurveys, setCompletedSurveys] = useState({
    attitude: false,
    typology: false,
    values: false
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeAssignments, setActiveAssignments] = useState([]);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Load demographic data on page load
    const savedData = localStorage.getItem('benehab_demographics');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDemographics(parsed);
      } catch (e) {
        console.error('Error loading demographic data:', e);
      }
    }

    // Check completed surveys
    setCompletedSurveys({
      attitude: !!localStorage.getItem('benehab_attitude_profile'),
      typology: !!localStorage.getItem('benehab_typology_profile'),
      values: !!localStorage.getItem('benehab_values_profile')
    });

    // Load active assignments
    loadActiveAssignments();

    // Add welcome message from Tatiana
    const welcomeMessage = {
      id: Date.now(),
      type: 'tatiana',
      text: `Hello! I'm Tatiana, your personal health assistant. 👋

I'm here to help you with:
• Doctor appointments
• Medication information  
• Symptom analysis
• General health questions
• Just to chat and provide support

Choose a quick question above or write your own in the chat!`,
      timestamp: new Date()
    };

    setChatMessages([welcomeMessage]);
  }, []);

  // Load active assignments
  const loadActiveAssignments = () => {
    try {
      const assignments = localStorage.getItem('benehab_assignments');
      if (assignments) {
        const parsed = JSON.parse(assignments);
        const active = parsed.filter(assignment => {
          // Check if there are active occurrences
          const occurrences = localStorage.getItem('benehab_occurrences');
          if (occurrences) {
            const parsedOccurrences = JSON.parse(occurrences);
            return parsedOccurrences.some(occ => 
              occ.assignment_id === assignment.id && 
              ['PENDING', 'NO_RESPONSE'].includes(occ.status)
            );
          }
          return false;
        });
        setActiveAssignments(active);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  // Check and offer help with assignments
  useEffect(() => {
    if (activeAssignments.length > 0 && chatMessages.length === 1) {
      // Add assignment help suggestion
      const assignmentHelpMessage = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: `I see you have active assignments! 📋

You have ${activeAssignments.length} assignment(s) that need attention. Would you like me to help you with them?

You can:
• View assignment details
• Get reminders
• Discuss difficulties with completion
• Schedule new appointments

Just say "help with assignments" or choose the corresponding question above!`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assignmentHelpMessage]);
    }
  }, [activeAssignments, chatMessages.length]);

  // Service Worker message listener
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'OCCURRENCE_ACTION') {
        // Update assignments after user action
        loadActiveAssignments();
        
        // Add message from Tatiana
        let responseText = '';
        switch (event.data.action) {
          case 'done':
            responseText = 'Great! I\'m glad you completed the assignment. 🎉 Would you like to discuss something else or need help with other assignments?';
            break;
          case 'not_done':
            responseText = 'I understand that you couldn\'t complete the assignment. Let\'s figure out what prevented it and how we can adapt the plan. 🤔';
            break;
          case 'mute_current':
            responseText = 'Okay, I\'ve disabled current reminders for this assignment. But remember, it\'s important not to forget about your health! 💪';
            break;
          default:
            responseText = 'Thank you for the feedback! Is there anything else I can help you with?';
        }
        
        const responseMessage = {
          id: Date.now(),
          type: 'tatiana',
          text: responseText,
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, responseMessage]);
      }
    };

    // Add listener
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    // Cleanup
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const handleDemographicsComplete = (data) => {
    setDemographics(data);
  };

  const handleQuickQuestion = async (questionType) => {
    let question = '';
    
    switch (questionType) {
      case 'doctor':
        question = 'I want to book a doctor appointment';
        break;
      case 'medicine':
        question = 'I want to know about medication';
        break;
      case 'symptoms':
        question = 'I have symptoms';
        break;
      case 'general':
        question = 'Just want to chat';
        break;
      case 'assignments':
        question = 'Help with assignments';
        break;
      case 'reminders':
        question = 'Set up reminders';
        break;
      default:
        return;
    }

    // Add user question
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: question,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Load user profile for personalization
      const attitudeProfile = localStorage.getItem('benehab_attitude_profile') ? JSON.parse(localStorage.getItem('benehab_attitude_profile')) : null;
      const accentuationProfile = localStorage.getItem('benehab_typology_profile') ? JSON.parse(localStorage.getItem('benehab_typology_profile')) : null;
      const valuesProfile = localStorage.getItem('benehab_values_profile') ? JSON.parse(localStorage.getItem('benehab_values_profile')) : null;

      // Load active assignments for context
      const assignments = localStorage.getItem('benehab_assignments') ? JSON.parse(localStorage.getItem('benehab_assignments')) : [];
      const occurrences = localStorage.getItem('benehab_occurrences') ? JSON.parse(localStorage.getItem('benehab_occurrences')) : [];

      // Debug information
      console.log('🚨 === QUICK QUESTION PROFILE DEBUG === 🚨');
      console.log('Attitude profile:', attitudeProfile);
      console.log('Accentuation profile:', accentuationProfile);
      console.log('Values profile:', valuesProfile);
      console.log('Active assignments:', activeAssignments);
      console.log('🚨 === END QUICK QUESTION DEBUG === 🚨');
      
      // Additional check - show in UI
      if (attitudeProfile || accentuationProfile || valuesProfile) {
        console.log('✅ PROFILE FOUND! Tatiana will personalize responses');
      } else {
        console.log('❌ PROFILE NOT FOUND! Tatiana will give general responses');
      }

      // Get base prompt from localStorage
      const basePrompt = localStorage.getItem('benehab_base_prompt') || '';
      
      // Send request to OpenAI API with profile and assignment context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          profile: {
            attitude_profile: attitudeProfile,
            accentuation_profile: accentuationProfile,
            values_profile: valuesProfile,
            demographics: demographics
          },
          basePromptOverride: basePrompt,
          context: {
            activeAssignments: activeAssignments,
            allAssignments: assignments,
            occurrences: occurrences
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const tatianaResponse = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: data.response || 'Sorry, an error occurred. Please try again.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, tatianaResponse]);
    } catch (error) {
      console.error('Error sending quick question:', error);
      
      // Fallback response in case of error
      const fallbackResponse = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: 'Sorry, I\'m having temporary connection issues. Please try again in a minute.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Load user profile for personalization
      const attitudeProfile = localStorage.getItem('benehab_attitude_profile') ? JSON.parse(localStorage.getItem('benehab_attitude_profile')) : null;
      const accentuationProfile = localStorage.getItem('benehab_typology_profile') ? JSON.parse(localStorage.getItem('benehab_typology_profile')) : null;
      const valuesProfile = localStorage.getItem('benehab_values_profile') ? JSON.parse(localStorage.getItem('benehab_values_profile')) : null;

      // Load active assignments for context
      const assignments = localStorage.getItem('benehab_assignments') ? JSON.parse(localStorage.getItem('benehab_assignments')) : [];
      const occurrences = localStorage.getItem('benehab_occurrences') ? JSON.parse(localStorage.getItem('benehab_occurrences')) : [];

      // Debug information
      console.log('🚨 === SEND MESSAGE PROFILE DEBUG === 🚨');
      console.log('Attitude profile:', attitudeProfile);
      console.log('Accentuation profile:', accentuationProfile);
      console.log('Values profile:', valuesProfile);
      console.log('Active assignments:', activeAssignments);
      console.log('🚨 === END SEND MESSAGE DEBUG === 🚨');
      
      // Additional check - show in UI
      if (attitudeProfile || accentuationProfile || valuesProfile) {
        console.log('✅ PROFILE FOUND! Tatiana will personalize responses');
      } else {
        console.log('❌ PROFILE NOT FOUND! Tatiana will give general responses');
      }

      // Get base prompt from localStorage
      const basePrompt = localStorage.getItem('benehab_base_prompt') || '';
      
      // Send request to OpenAI API with profile and assignment context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          profile: {
            attitude_profile: attitudeProfile,
            accentuation_profile: accentuationProfile,
            values_profile: valuesProfile,
            demographics: demographics
          },
          basePromptOverride: basePrompt,
          context: {
            activeAssignments: activeAssignments,
            allAssignments: assignments,
            occurrences: occurrences
          }
        }),
        });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const tatianaResponse = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: data.response || 'Sorry, an error occurred. Please try again.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, tatianaResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response in case of error
      const fallbackResponse = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: 'Sorry, I\'m having temporary connection issues. Please try again in a minute.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DemographicsCheck onDemographicsComplete={handleDemographicsComplete}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Benehab - Personal Assistant</h1>
              </div>
              
              {/* User information */}
              {demographics && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{demographics.name}</p>
                    <p className="text-xs text-gray-500">
                      {demographics.age} years old, {demographics.gender === 'male' ? 'M' : 'F'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {demographics.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          {demographics && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {demographics.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome, {demographics.name}! 👋
                  </h2>
                  <p className="text-gray-600">
                    I'm Tatiana, your personal agent. Let's go through profiling together 
                    so I can better understand you and adapt my communication style to your individual characteristics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profiling */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profiling</h2>
            <p className="text-gray-600 mb-4">
              Complete surveys so Tatiana can better understand you and adapt her communication style
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => window.location.href = '/profiling/attitude'}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-xl">🏥</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Attitude to Illness</h3>
                <p className="text-sm text-gray-600">First survey</p>
              </button>

              <button
                onClick={() => window.location.href = '/profiling/typology'}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <span className="text-green-600 text-xl">🧠</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Psychotype</h3>
                <p className="text-sm text-gray-600">Second survey</p>
              </button>

              <button
                onClick={() => window.location.href = '/profiling/values'}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <span className="text-purple-600 text-xl">💎</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Values</h3>
                <p className="text-sm text-gray-600">Third survey</p>
              </button>

              <button
                onClick={() => window.location.href = '/debug-prompts'}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                  <span className="text-orange-600 text-xl">🔍</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Debug</h3>
                <p className="text-sm text-gray-600">Prompts</p>
              </button>

              <button
                onClick={() => window.location.href = '/assignments'}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-200 transition-colors">
                  <span className="text-indigo-600 text-xl">📋</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Assignments</h3>
                <p className="text-sm text-gray-600">Management</p>
              </button>
            </div>
          </div>

          {/* Profiling Progress */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profiling Progress</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <span className="text-gray-700">Attitude to Illness</span>
                </div>
                <div className="flex items-center space-x-2">
                  {completedSurveys.attitude ? (
                    <span className="text-green-600 text-sm">✓ Completed</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not started</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">2</span>
                  </div>
                  <span className="text-gray-700">Psychotype</span>
                </div>
                <div className="flex items-center space-x-2">
                  {completedSurveys.typology ? (
                    <span className="text-green-600 text-sm">✓ Completed</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not started</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">3</span>
                  </div>
                  <span className="text-gray-700">Values</span>
                </div>
                <div className="flex items-center space-x-2">
                  {completedSurveys.values ? (
                    <span className="text-green-600 text-sm">✓ Completed</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not started</span>
                  )}
                </div>
              </div>
            </div>

            {/* Button for base prompt configuration */}
            {completedSurveys.attitude && 
             completedSurveys.typology && 
             completedSurveys.values && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.location.href = '/base-prompt'}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <span className="mr-2">⚙️</span>
                  Configure Base Prompt
                </button>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Questions</h2>
            <p className="text-gray-600 mb-4">
              Choose a quick question or write your own in the chat below
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleQuickQuestion('doctor')}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-xl">👨‍⚕️</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Book Doctor Appointment</h3>
                <p className="text-sm text-gray-600">Help with booking</p>
              </button>

              <button
                onClick={() => handleQuickQuestion('medicine')}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <span className="text-green-600 text-xl">💊</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Learn About Medication</h3>
                <p className="text-sm text-gray-600">Medication information</p>
              </button>

              <button
                onClick={() => handleQuickQuestion('symptoms')}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <span className="text-purple-600 text-xl">🤒</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">I Have Symptoms</h3>
                <p className="text-sm text-gray-600">Tell about the problem</p>
              </button>

              <button
                onClick={() => handleQuickQuestion('general')}
                className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                  <span className="text-orange-600 text-xl">💬</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Just Chat</h3>
                <p className="text-sm text-gray-600">Communication and support</p>
              </button>
            </div>
          </div>

          {/* Chat with Tatiana */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chat with Tatiana</h2>
            
            {/* Message history */}
            <div className="mb-4 max-h-96 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-2xl">💬</span>
                  </div>
                  <p>Start chatting with Tatiana!</p>
                  <p className="text-sm">Write a message below</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Tatiana is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input field */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Write a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>

          {/* Admin Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Administration</h2>
            <button
              onClick={() => window.location.href = '/admin'}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">⚙️</span>
              Admin Panel
            </button>
          </div>
        </div>
      </div>
    </DemographicsCheck>
  );
}

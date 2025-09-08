// pages/index.js

import { useState, useEffect } from 'react';
import DemographicsCheck from '../components/DemographicsCheck';
import Link from 'next/link';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
• Medication reminders
• Health questions
• Personalized support

Let's start by completing your profiling surveys so I can better understand you and provide more personalized assistance.`,
      timestamp: new Date().toISOString()
    };
    setChatMessages([welcomeMessage]);
  }, []);

  const loadActiveAssignments = () => {
    try {
      const assignments = JSON.parse(localStorage.getItem('benehab_assignments') || '[]');
      const now = new Date();
      const active = assignments.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate > now && !assignment.completed;
      });
      setActiveAssignments(active);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          demographics,
          completedSurveys,
          activeAssignments
        }),
        });

      const data = await response.json();
      
      const tatianaMessage = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: data.response || data.fallback || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, tatianaMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'tatiana',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "How can I improve my health?",
    "What should I do if I feel unwell?",
    "How to manage stress?",
    "Tell me about healthy lifestyle",
    "What are the benefits of regular exercise?",
    "How to maintain mental health?"
  ];

  const surveyData = [
    {
      id: 'attitude',
      title: 'Health Attitude',
      description: 'Discover your attitude towards health and illness',
      link: '/profiling/attitude',
      completed: completedSurveys.attitude,
      color: 'emerald'
    },
    {
      id: 'typology',
      title: 'Communication Style',
      description: 'Understand your communication preferences',
      link: '/profiling/typology',
      completed: completedSurveys.typology,
      color: 'blue'
    },
    {
      id: 'values',
      title: 'Values Model',
      description: 'Explore your personal value system',
      link: '/profiling/values',
      completed: completedSurveys.values,
      color: 'purple'
    }
  ];

  const getSurveyColor = (color) => {
    const colors = {
      emerald: 'from-emerald-500 to-emerald-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  const getSurveyHoverColor = (color) => {
    const colors = {
      emerald: 'hover:from-emerald-600 hover:to-emerald-700',
      blue: 'hover:from-blue-600 hover:to-blue-700',
      purple: 'hover:from-purple-600 hover:to-purple-700'
    };
    return colors[color] || 'hover:from-gray-600 hover:to-gray-700';
  };

  if (!demographics) {
    return <DemographicsCheck onComplete={setDemographics} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">{demographics.name?.charAt(0) || 'U'}</span>
                </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome, {demographics.name || 'User'}!</h2>
              <p className="text-emerald-100 text-sm">
                {demographics.age} years old • {demographics.gender}
                    </p>
                  </div>
                  </div>
          
          {/* Burger Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                <Link href="/assignments" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Health Assignments
                </Link>
                <Link href="/communication-instructions" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Communication Instructions
                </Link>
                <Link href="/debug-prompts" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Debug Prompts
                </Link>
                <Link href="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </Link>
                <div className="border-t border-gray-100 my-2"></div>
                <Link href="/base-prompt" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Base Prompt Editor
                </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-8 mb-6 shadow-lg text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Welcome, {demographics.name}! 👋
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              I'm Tatiana, your personal agent. Let's go through profiling together so I can better understand you and adapt my communication style to your individual characteristics.
            </p>
            </div>
          </div>

        {/* Survey Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {surveyData.map((survey) => (
            <Link key={survey.id} href={survey.link}>
              <div className={`
                bg-white rounded-3xl p-6 shadow-lg border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl h-80 flex flex-col
                ${survey.completed 
                  ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg
                    ${survey.completed 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : `bg-gradient-to-r ${getSurveyColor(survey.color)}`
                    }
                  `}>
                    {survey.completed ? '✓' : survey.id.charAt(0).toUpperCase()}
                  </div>
                  {survey.completed && (
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">Completed</span>
                </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {survey.title}
                  </h3>
                  <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
                    {survey.description}
                  </p>
                  
                  <div className={`
                    px-4 py-3 rounded-xl font-medium text-center transition-all duration-300 mt-auto
                    ${survey.completed
                      ? 'bg-green-100 text-green-700'
                      : `bg-gradient-to-r ${getSurveyColor(survey.color)} ${getSurveyHoverColor(survey.color)} text-white`
                    }
                  `}>
                    {survey.completed ? 'View Results' : 'Start Survey'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
              </div>

        {/* Chat Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Chat with Tatiana</h3>
                <p className="text-sm text-gray-600">Your personal health assistant</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                  className={`
                    max-w-xs lg:max-w-md px-4 py-3 rounded-2xl
                    ${message.type === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
            ))}
              
              {isTyping && (
                <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          {/* Quick Questions */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</h4>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Send
              </button>
            </div>
          </div>
          </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 py-4">
          © {new Date().getFullYear()} Benehab. All rights reserved.
        </div>
      </div>
    </div>
  );
}
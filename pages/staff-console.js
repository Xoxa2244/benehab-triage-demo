import { useState } from 'react';

export default function StaffConsolePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    patientInfo: false,
    medication: false,
    concerns: false,
    adherence: false,
    riskLevel: false
  });
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'doctor',
      message: 'Patient has been missing appointments and reports fatigue. Should we adjust medication?',
      timestamp: '2025-01-20 14:30'
    },
    {
      id: 2,
      sender: 'agent',
      message: 'Based on patient\'s fatigue score (8/10) and missed visits, I suggest not changing the medication but scheduling motivational support.',
      timestamp: '2025-01-20 14:31',
      source: 'SNOMED / dm+d / NHS.uk'
    },
    {
      id: 3,
      sender: 'doctor',
      message: 'What about the Metformin side effects?',
      timestamp: '2025-01-20 14:32'
    },
    {
      id: 4,
      sender: 'agent',
      message: 'Metformin (VMP 321028006) is not known to cause fatigue; primary cause is likely behavioral.',
      timestamp: '2025-01-20 14:33',
      source: 'SNOMED / dm+d / NHS.uk'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'psychological', label: 'Psychological Profile' },
    { id: 'behavioral', label: 'Behavioral Metrics' },
    { id: 'chat', label: 'Agent Chat' }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const doctorMessage = {
        id: chatMessages.length + 1,
        sender: 'doctor',
        message: newMessage,
        timestamp: new Date().toLocaleString()
      };
      setChatMessages([...chatMessages, doctorMessage]);
      setNewMessage('');
    }
  };

  const handleMarkCompleted = (visit) => {
    alert(`Marked "${visit}" as completed`);
  };

  const handleReschedule = (visit) => {
    alert(`Rescheduling "${visit}"`);
  };

  const sendNotification = () => {
    setShowNotificationModal(true);
    setTimeout(() => setShowNotificationModal(false), 3000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Care-Team Console</h1>
              <p className="text-blue-100 mt-1">Clinical & Behavioral Overview</p>
            </div>
            <button
              onClick={sendNotification}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Send Notification
            </button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Sent</h3>
              <p className="text-gray-600">Reminder sent to patient</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Profile Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Profile</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">Sarah Johnson</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">42 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-medium">PAT-2024-001234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">Type 2 Diabetes Mellitus</span>
                  </div>
                  <div className="text-xs text-gray-500">(SNOMED 44054006)</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medication:</span>
                    <span className="font-medium">Metformin 500 mg tablet</span>
                  </div>
                  <div className="text-xs text-gray-500">(dm+d 321028006)</div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Visit Plan</h4>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-3 py-2 text-sm text-gray-900">Endocrinology Check</td>
                          <td className="px-3 py-2 text-sm text-gray-900">2025-10-24</td>
                          <td className="px-3 py-2 text-sm text-green-600">Planned</td>
                          <td className="px-3 py-2 text-sm">
                            <button
                              onClick={() => handleMarkCompleted('Endocrinology Check')}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleReschedule('Endocrinology Check')}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-gray-900">Dietitian Coaching</td>
                          <td className="px-3 py-2 text-sm text-gray-900">2025-10-27</td>
                          <td className="px-3 py-2 text-sm text-green-600">Planned</td>
                          <td className="px-3 py-2 text-sm">
                            <button
                              onClick={() => handleMarkCompleted('Dietitian Coaching')}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleReschedule('Dietitian Coaching')}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-gray-900">GP Follow-up</td>
                          <td className="px-3 py-2 text-sm text-gray-900">2025-10-31</td>
                          <td className="px-3 py-2 text-sm text-red-600">Missed (2x history)</td>
                          <td className="px-3 py-2 text-sm">
                            <button
                              onClick={() => handleReschedule('GP Follow-up')}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Engagement Summary Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last agent contact:</span>
                    <span className="font-medium">2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adherence:</span>
                    <span className="font-medium">76%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk of Dropout:</span>
                    <span className="font-medium text-orange-600">Medium (0.54)</span>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Trust in Treatment</span>
                        <span className="text-sm font-medium">7/10</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Fatigue Barrier</span>
                        <span className="text-sm font-medium text-red-600">8/10</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Awareness</span>
                        <span className="text-sm font-medium text-green-600">9/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Psychological Profile Tab */}
          {activeTab === 'psychological' && (
            <div className="space-y-6">
              {/* Assessment Results */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">7.2</div>
                    <div className="text-sm text-gray-600">Anxiety Scale</div>
                    <div className="text-xs text-gray-500">(0-10 scale)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">6.8</div>
                    <div className="text-sm text-gray-600">Self-Efficacy</div>
                    <div className="text-xs text-gray-500">(0-10 scale)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">8.1</div>
                    <div className="text-sm text-gray-600">Health Awareness</div>
                    <div className="text-xs text-gray-500">(0-10 scale)</div>
                  </div>
                </div>
              </div>

              {/* Psychotype and Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Psychotype Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600">Primary Type:</span>
                      <span className="font-medium ml-2">Anxious-Responsible</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Key Barriers:</span>
                      <ul className="mt-1 text-sm text-gray-700">
                        <li>• Fear of side effects</li>
                        <li>• Low self-efficacy</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-600">Motivational Triggers:</span>
                      <ul className="mt-1 text-sm text-gray-700">
                        <li>• Praise and reassurance</li>
                        <li>• Sense of control</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-600">Tone of Voice:</span>
                      <span className="font-medium ml-2">Soft, explanatory, non-directive</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Communication Style</div>
                      <div className="text-sm text-blue-700">Speak calmly, highlight stability</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-900">Motivation Strategy</div>
                      <div className="text-sm text-green-700">Reinforce small wins</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-red-900">Avoid</div>
                      <div className="text-sm text-red-700">Threat-based motivation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Behavioral Metrics Tab */}
          {activeTab === 'behavioral' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Behavioral Metrics</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Proactivity</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6.2/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.3</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Motivation (Fear-based)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4.1/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↘ -0.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Awareness</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">9.0/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.2</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fears & Barriers</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.8/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↗ +0.4</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Adherence</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">76%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +5%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Emotional State</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5.4/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↘ -0.8</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Trust in Treatment</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.0/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.1</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Good</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fatigue Barrier</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8.0/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↗ +0.6</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Response to Reinforcement</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6.5/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.2</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Risk of Dropout</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.54</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↗ +0.08</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Medium</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Agent Chat Tab */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Data Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Data Summary</h3>
                <div className="space-y-3 text-sm">
                  {/* Patient Info */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('patientInfo')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Patient Information</div>
                        <div className="text-gray-600">Sarah Johnson, 42 • Type 2 Diabetes</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.patientInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.patientInfo && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Full Name:</span> Sarah Elizabeth Johnson</div>
                          <div><span className="font-medium">DOB:</span> March 15, 1982</div>
                          <div><span className="font-medium">Gender:</span> Female</div>
                          <div><span className="font-medium">Primary Diagnosis:</span> Type 2 Diabetes Mellitus (E11.9)</div>
                          <div><span className="font-medium">Secondary Diagnoses:</span> Hypertension (I10), Obesity (E66.9)</div>
                          <div><span className="font-medium">Allergies:</span> None known</div>
                          <div><span className="font-medium">Emergency Contact:</span> John Johnson (Spouse) - (555) 123-4567</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Medication */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('medication')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Current Medication</div>
                        <div className="text-gray-600">Metformin 500mg</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.medication ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.medication && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Metformin:</span> 500mg twice daily with meals</div>
                          <div><span className="font-medium">Prescribed:</span> Dr. Smith, January 15, 2024</div>
                          <div><span className="font-medium">Last Refill:</span> December 20, 2024</div>
                          <div><span className="font-medium">Days Supply:</span> 30 days</div>
                          <div><span className="font-medium">Side Effects:</span> Mild gastrointestinal discomfort</div>
                          <div><span className="font-medium">Compliance:</span> 85% (missed 4 doses this month)</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Concerns */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('concerns')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Key Concerns</div>
                        <div className="text-gray-600">Fatigue (8/10), Missed visits</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.concerns ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.concerns && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Fatigue Level:</span> 8/10 (High concern)</div>
                          <div><span className="font-medium">Missed Appointments:</span> 2 in last 3 months</div>
                          <div><span className="font-medium">Blood Sugar Control:</span> HbA1c 8.2% (Target: &lt;7%)</div>
                          <div><span className="font-medium">Weight Management:</span> +3kg in last 6 months</div>
                          <div><span className="font-medium">Exercise Compliance:</span> 2/5 days per week</div>
                          <div><span className="font-medium">Diet Adherence:</span> Moderate (60% compliance)</div>
                          <div><span className="font-medium">Stress Level:</span> High due to work pressure</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Adherence */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('adherence')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Adherence</div>
                        <div className="text-gray-600">76% (improving)</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.adherence ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.adherence && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Medication Adherence:</span> 85% (Metformin)</div>
                          <div><span className="font-medium">Appointment Attendance:</span> 67% (4/6 appointments)</div>
                          <div><span className="font-medium">Dietary Guidelines:</span> 60% compliance</div>
                          <div><span className="font-medium">Exercise Routine:</span> 40% compliance</div>
                          <div><span className="font-medium">Blood Glucose Monitoring:</span> 70% (daily checks)</div>
                          <div><span className="font-medium">Overall Trend:</span> Improving (+12% vs last month)</div>
                          <div><span className="font-medium">Barriers:</span> Time constraints, forgetfulness</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Risk Level */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('riskLevel')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Risk Level</div>
                        <div className="text-orange-600">Medium dropout risk</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.riskLevel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.riskLevel && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Dropout Risk Score:</span> 0.54 (Medium)</div>
                          <div><span className="font-medium">Risk Factors:</span> Missed appointments, high fatigue</div>
                          <div><span className="font-medium">Protective Factors:</span> Good medication compliance</div>
                          <div><span className="font-medium">Engagement Level:</span> Moderate (responds to messages)</div>
                          <div><span className="font-medium">Support System:</span> Strong (family support)</div>
                          <div><span className="font-medium">Previous Dropouts:</span> None</div>
                          <div><span className="font-medium">Intervention Needed:</span> Motivational support</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Chat</h3>
                
                {/* Chat Messages */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'doctor' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm">{msg.message}</div>
                        <div className={`text-xs mt-1 ${
                          msg.sender === 'doctor' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp}
                        </div>
                        {msg.source && (
                          <div className="text-xs mt-1 text-gray-500 italic">
                            Source: {msg.source}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t pt-4">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to the AI agent..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

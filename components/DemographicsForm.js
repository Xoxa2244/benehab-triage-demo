

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  ScaleIcon, 
  Square3Stack3DIcon, 
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DemographicsForm({ onComplete, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    weight: '',
    height: '',
    age: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Load saved data when opening the form
    const savedData = localStorage.getItem('benehab_demographics');
    const savedUserId = localStorage.getItem('benehab_user_id');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setIsSubmitted(true);
        if (savedUserId && onComplete) {
          onComplete({ ...parsed, userId: savedUserId });
        }
      } catch (e) {
        console.error('Error loading demographic data:', e);
      }
    }
  }, [onComplete]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Select gender';
    }
    
    if (!formData.weight) {
      newErrors.weight = 'Enter weight';
    } else if (isNaN(formData.weight) || formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = 'Weight must be between 30 and 300 kg';
    }
    
    if (!formData.height) {
      newErrors.height = 'Enter height';
    } else if (isNaN(formData.height) || formData.height < 100 || formData.height > 250) {
      newErrors.height = 'Height must be between 100 and 250 cm';
    }
    
    if (!formData.age) {
      newErrors.age = 'Enter age';
    } else if (isNaN(formData.age) || formData.age < 12 || formData.age > 120) {
      newErrors.age = 'Age must be between 12 and 120 years';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const save = async () => {
      try {
        setSubmitError('');
        setIsSaving(true);
        // Save data to localStorage for immediate reuse
        localStorage.setItem('benehab_demographics', JSON.stringify(formData));

        // Try to create/update user in backend
        const chatId = localStorage.getItem('benehab_chat_id');
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            demographics: formData,
            chat_id: chatId || null,
          }),
        });

        let userId;
        if (response.ok) {
          const data = await response.json();
          userId = data?.user?.id;
          if (userId) {
            localStorage.setItem('benehab_user_id', userId);
          }
        } else {
          const errorText = await response.text();
          setSubmitError('Failed to create user. You can try again later.');
          console.error('User creation failed:', response.status, errorText);
        }

        setIsSubmitted(true);
        if (onComplete) {
          onComplete({ ...formData, userId });
        }
      } catch (err) {
        console.error('Error submitting demographics:', err);
        setSubmitError('Unexpected error. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    save();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on input
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getGenderLabel = (gender) => {
    return gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tell us about yourself
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="inline w-4 h-4 mr-2" />
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Male</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Female</span>
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ScaleIcon className="inline w-4 h-4 mr-2" />
                Weight (kg) *
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.weight ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g.: 70"
                min="30"
                max="300"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.weight}
                </p>
              )}
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Square3Stack3DIcon className="inline w-4 h-4 mr-2" />
                Height (cm) *
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.height ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g.: 175"
                min="100"
                max="250"
              />
              {errors.height && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.height}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-2" />
                Age *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.age ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g.: 35"
                min="12"
                max="120"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.age}
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-4 space-y-2">
              {submitError && (
                <p className="text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save and Continue'}
              </button>
            </div>
          </form>

          {/* Information about why this data is needed */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Why do we need this data?
            </h3>
            <p className="text-sm text-blue-700">
              This information will help Tatiana, your personal agent, better understand you and adapt her communication style to your individual characteristics. We guarantee the confidentiality of all data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

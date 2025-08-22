'use client';

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

  useEffect(() => {
    // Загружаем сохраненные данные при открытии формы
    const savedData = localStorage.getItem('benehab_demographics');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setIsSubmitted(true);
      } catch (e) {
        console.error('Ошибка загрузки демографических данных:', e);
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Имя должно содержать минимум 2 символа';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Выберите пол';
    }
    
    if (!formData.weight) {
      newErrors.weight = 'Введите вес';
    } else if (isNaN(formData.weight) || formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = 'Вес должен быть от 30 до 300 кг';
    }
    
    if (!formData.height) {
      newErrors.height = 'Введите рост';
    } else if (isNaN(formData.height) || formData.height < 100 || formData.height > 250) {
      newErrors.height = 'Рост должен быть от 100 до 250 см';
    }
    
    if (!formData.age) {
      newErrors.age = 'Введите возраст';
    } else if (isNaN(formData.age) || formData.age < 12 || formData.age > 120) {
      newErrors.age = 'Возраст должен быть от 12 до 120 лет';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Сохраняем данные в localStorage
      localStorage.setItem('benehab_demographics', JSON.stringify(formData));
      setIsSubmitted(true);
      onComplete(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при вводе
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getGenderLabel = (gender) => {
    return gender === 'male' ? 'Мужской' : gender === 'female' ? 'Женский' : '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Расскажите о себе
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
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="inline w-4 h-4 mr-2" />
                Имя *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Введите ваше имя"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Пол */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пол *
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
                  <span className="text-sm text-gray-700">Мужской</span>
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
                  <span className="text-sm text-gray-700">Женский</span>
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Вес */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ScaleIcon className="inline w-4 h-4 mr-2" />
                Вес (кг) *
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.weight ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Например: 70"
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

            {/* Рост */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Square3Stack3DIcon className="inline w-4 h-4 mr-2" />
                Рост (см) *
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.height ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Например: 175"
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

            {/* Возраст */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-2" />
                Возраст *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.age ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Например: 35"
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

            {/* Кнопка отправки */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Сохранить и продолжить
              </button>
            </div>
          </form>

          {/* Информация о том, зачем нужны эти данные */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Зачем нужны эти данные?
            </h3>
            <p className="text-sm text-blue-700">
              Эта информация поможет Татьяне, вашему персональному агенту, лучше понять вас и адаптировать стиль общения под ваши индивидуальные особенности. Мы гарантируем конфиденциальность всех данных.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

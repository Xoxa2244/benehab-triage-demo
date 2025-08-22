'use client';

import { useState, useEffect } from 'react';
import { UserIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function TatianaMessage({ 
  demographics, 
  surveyType, 
  surveyResults, 
  isVisible 
}) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isVisible && demographics && surveyType) {
      generateMessage();
    }
  }, [isVisible, demographics, surveyType, surveyResults]);

  const generateMessage = () => {
    setIsTyping(true);
    
    // Имитируем печатание
    setTimeout(() => {
      const personalizedMessage = createPersonalizedMessage();
      setMessage(personalizedMessage);
      setIsTyping(false);
    }, 1000);
  };

  const createPersonalizedMessage = () => {
    const { name, gender, age, weight, height } = demographics;
    const genderText = gender === 'male' ? 'мужчина' : 'женщина';
    const ageText = getAgeText(age);
    
    let baseMessage = `Привет, ${name}! 👋\n\n`;
    
    // Базовое описание на основе демографических данных
    baseMessage += `Я рада познакомиться с вами! Вы ${genderText}, ${ageText} возраста. `;
    
    // Анализ физических параметров
    const bmi = calculateBMI(weight, height);
    if (bmi < 18.5) {
      baseMessage += `У вас хрупкое телосложение, что говорит о деликатности и чувствительности. `;
    } else if (bmi > 25) {
      baseMessage += `У вас крепкое телосложение, что указывает на силу духа и выносливость. `;
    } else {
      baseMessage += `У вас гармоничное телосложение, что отражает внутренний баланс. `;
    }

    // Персонализация на основе типа опроса
    switch (surveyType) {
      case 'attitude':
        baseMessage += generateAttitudeMessage(surveyResults);
        break;
      case 'typology':
        baseMessage += generateTypologyMessage(surveyResults);
        break;
      case 'values':
        baseMessage += generateValuesMessage(surveyResults);
        break;
      default:
        baseMessage += `Я буду рада помочь вам в решении ваших вопросов. `;
    }

    // Завершающая часть
    baseMessage += `\n\nТеперь я понимаю вас гораздо лучше и буду общаться с вами в наиболее подходящем стиле. `;
    baseMessage += `Если у вас есть вопросы или нужна поддержка, я здесь для вас! 💙`;

    return baseMessage;
  };

  const generateAttitudeMessage = (results) => {
    if (!results) return `Я понимаю, что отношение к болезни - это очень личная тема. `;
    
    let message = `\n\nИсходя из ваших ответов об отношении к болезни, я вижу, что `;
    
    // Анализируем основные шкалы
    const scales = results.scales || {};
    
    if (scales.severity && scales.severity > 5) {
      message += `вы серьезно относитесь к своему здоровью и глубоко переживаете за него. `;
      message += `Я буду особенно внимательна к вашим переживаниям и постараюсь создать ощущение безопасности. `;
    } else if (scales.severity && scales.severity < 3) {
      message += `вы оптимистично смотрите на свое состояние. `;
      message += `Я поддержу ваш позитивный настрой, но также помогу не упустить важные детали. `;
    }
    
    if (scales.anxiety && scales.anxiety > 5) {
      message += `Я заметила, что вы склонны к тревожности. `;
      message += `В нашем общении я буду давать четкую, структурированную информацию и создавать ощущение предсказуемости. `;
    }
    
    if (scales.secondary_gain && scales.secondary_gain > 3) {
      message += `Я понимаю, что болезнь может приносить определенные выгоды. `;
      message += `Я буду поддерживать вас, но также помогу найти здоровые способы получения внимания и заботы. `;
    }
    
    return message;
  };

  const generateTypologyMessage = (results) => {
    if (!results) return `Я понимаю, что каждый человек уникален в своем восприятии мира. `;
    
    let message = `\n\nАнализируя ваш психотип, я вижу, что `;
    
    const dominantType = results.dominant_type;
    
    switch (dominantType) {
      case 'sensitive':
        message += `вы очень чувствительный и ранимый человек. `;
        message += `Я буду общаться с вами особенно бережно, используя мягкие формулировки и подтверждая ваши чувства. `;
        break;
      case 'dysthymic':
        message += `вы склонны к самокритике и часто вините себя. `;
        message += `Я буду подчеркивать ваши достижения и давать маленькие, достижимые шаги для улучшения самочувствия. `;
        break;
      case 'demonstrative':
        message += `вы любите быть в центре внимания и производить впечатление. `;
        message += `Я буду давать вам пространство для того, чтобы поделиться своими успехами и достижениями. `;
        break;
      case 'excitable':
        message += `вы импульсивны и любите действовать быстро. `;
        message += `Я буду давать вам краткие, четкие инструкции и помогать с планированием действий. `;
        break;
      case 'cyclothymic':
        message += `у вас переменчивое настроение и активность. `;
        message += `Я буду адаптироваться к вашему текущему состоянию и предлагать гибкие планы. `;
        break;
      case 'stuck':
        message += `вы упорны и принципиальны. `;
        message += `Я буду уважать ваши принципы и помогать переводить упорство в конструктивное русло. `;
        break;
      case 'pedantic':
        message += `вы осторожны и любите порядок. `;
        message += `Я буду давать вам детальную информацию и создавать структурированные планы. `;
        break;
      case 'anxious':
        message += `вы склонны к беспокойству и мнительности. `;
        message += `Я буду создавать ощущение безопасности и давать четкие гарантии. `;
        break;
      case 'hyperthymic':
        message += `вы энергичны и оптимистичны. `;
        message += `Я буду поддерживать ваш энтузиазм и помогать направлять энергию в конструктивное русло. `;
        break;
      default:
        message += `каждый человек уникален в своем восприятии мира. `;
        message += `Я буду адаптировать стиль общения под ваши индивидуальные особенности. `;
    }
    
    return message;
  };

  const generateValuesMessage = (results) => {
    if (!results) return `Я понимаю, что ценности - это основа личности каждого человека. `;
    
    let message = `\n\nАнализируя вашу систему ценностей, я вижу, что `;
    
    const indices = results.indices || {};
    
    if (indices.life_satisfaction > 0.6) {
      message += `вы довольны своей жизнью и смотрите в будущее с оптимизмом. `;
      message += `Я буду поддерживать ваш позитивный настрой и помогать укреплять то, что уже работает хорошо. `;
    } else if (indices.life_satisfaction < 0.3) {
      message += `вы переживаете сложный период в жизни. `;
      message += `Я буду особенно внимательна к вашим чувствам и помогу найти источники радости и удовлетворения. `;
    }
    
    if (indices.future_orientation > 0.5) {
      message += `Вы ориентированы на будущее и ставите долгосрочные цели. `;
      message += `Я буду помогать вам планировать и достигать этих целей. `;
    } else {
      message += `Вы больше сосредоточены на настоящем моменте. `;
      message += `Я буду помогать вам находить баланс между текущими потребностями и долгосрочными планами. `;
    }
    
    if (indices.self_attitude > 0.6) {
      message += `У вас здоровое отношение к себе и высокая самооценка. `;
      message += `Я буду поддерживать вашу уверенность и помогать развивать сильные стороны. `;
    } else {
      message += `Вы иногда сомневаетесь в себе. `;
      message += `Я буду помогать вам видеть свои достоинства и развивать уверенность. `;
    }
    
    return message;
  };

  const getAgeText = (age) => {
    if (age < 18) return 'молодого';
    if (age < 30) return 'молодого';
    if (age < 50) return 'среднего';
    if (age < 65) return 'зрелого';
    return 'зрелого';
  };

  const calculateBMI = (weight, height) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  if (!isVisible || !demographics || !surveyType) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 mb-6">
      <div className="flex items-start space-x-4">
        {/* Аватар Татьяны */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <HeartIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Содержимое сообщения */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Татьяна</h3>
            <span className="text-sm text-gray-500">Ваш персональный агент</span>
          </div>

          {isTyping ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>Татьяна печатает...</span>
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

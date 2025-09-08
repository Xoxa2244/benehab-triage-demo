

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';

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
    
    // Simulate typing
    setTimeout(() => {
      const personalizedMessage = createPersonalizedMessage();
      setMessage(personalizedMessage);
      setIsTyping(false);
    }, 1500);
  };

  const createPersonalizedMessage = () => {
    const { name } = demographics;
    
    let baseMessage = `Hello, ${name}! 👋\n\n`;
    
    // Personalization based on survey type and results
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
        baseMessage += `I will be happy to help you with your questions. `;
    }

    // Final part with integration of all results
    baseMessage += generateIntegrationMessage();
    baseMessage += `\n\nNow I understand you much better and will communicate with you in the most appropriate style. `;
    baseMessage += `If you have questions or need support, I am here for you! 💙`;

    return baseMessage;
  };

  const generateAttitudeMessage = (results) => {
    if (!results || !results.scales) {
      return `I understand that attitude to illness is a very personal topic. `;
    }
    
    let message = `Based on your answers about attitude to illness, I see the following features:\n\n`;
    
    const scales = results.scales;
    const insights = [];
    
    // Analysis of main scales with specific recommendations
    if (scales.severity !== undefined) {
      if (scales.severity > 7) {
        insights.push({
          trait: "high assessment of disease severity",
          approach: "I will be especially attentive to your experiences, give clear structured information and create a sense of security"
        });
      } else if (scales.severity < 4) {
        insights.push({
          trait: "оптимистичный взгляд на состояние",
          approach: "поддержу ваш позитивный настрой, но также помогу не упустить важные детали для полноценного лечения"
        });
      }
    }
    
    if (scales.anxiety !== undefined && scales.anxiety > 5) {
      insights.push({
        trait: "склонность к тревожности",
        approach: "буду давать четкую, предсказуемую информацию, создавать ощущение стабильности и пошагово объяснять каждый этап"
      });
    }
    
    if (scales.secondary_gain !== undefined && scales.secondary_gain > 3) {
      insights.push({
        trait: "восприятие болезни как источника поддержки",
        approach: "буду поддерживать вас, но также помогу найти здоровые способы получения внимания и заботы от близких"
      });
    }
    
    if (scales.hide_resist !== undefined && scales.hide_resist > 5) {
      insights.push({
        trait: "стремление скрыть болезнь",
        approach: "буду особенно деликатна, создам безопасное пространство для откровенного разговора и помогу принять ситуацию"
      });
    }
    
    if (scales.work_escape !== undefined && scales.work_escape > 5) {
      insights.push({
        trait: "склонность уходить в работу",
        approach: "буду уважать вашу активность, но помогу найти баланс между работой и здоровьем, давая гибкие планы лечения"
      });
    }
    
    if (insights.length === 0) {
      message += "у вас сбалансированное отношение к здоровью. ";
      message += "Я буду поддерживать ваш рациональный подход и помогать принимать обоснованные решения. ";
    } else {
      insights.forEach((insight, index) => {
        message += `• ${insight.trait}: ${insight.approach}.\n`;
      });
    }
    
    return message;
  };

  const generateTypologyMessage = (results) => {
    if (!results || !results.dominant_type) {
      return `Я понимаю, что каждый человек уникален в своем восприятии мира. `;
    }
    
    let message = `Анализируя ваш психотип, я выявила следующие особенности:\n\n`;
    
    const dominantType = results.dominant_type;
    const typeInsights = {
      'sensitive': {
        trait: "вы очень чувствительный и ранимый человек",
        approach: "буду общаться особенно бережно, использовать мягкие формулировки, подтверждать ваши чувства и избегать резких формулировок"
      },
      'dysthymic': {
        trait: "вы склонны к самокритике и часто вините себя",
        approach: "буду подчеркивать ваши достижения, давать маленькие достижимые шаги и помогать видеть позитивные стороны ситуации"
      },
      'demonstrative': {
        trait: "вы любите быть в центре внимания и производить впечатление",
        approach: "буду давать вам пространство для того, чтобы поделиться своими успехами, признавать ваши достижения и создавать возможности для самовыражения"
      },
      'excitable': {
        trait: "вы импульсивны и любите действовать быстро",
        approach: "буду давать краткие четкие инструкции, помогать с планированием действий и создавать структурированные планы"
      },
      'cyclothymic': {
        trait: "у вас переменчивое настроение и активность",
        approach: "буду адаптироваться к вашему текущему состоянию, предлагать гибкие планы и поддерживать в периоды спада"
      },
      'stuck': {
        trait: "вы упорны и принципиальны",
        approach: "буду уважать ваши принципы, помогать переводить упорство в конструктивное русло и находить компромиссы"
      },
      'pedantic': {
        trait: "вы осторожны и любите порядок",
        approach: "буду давать детальную информацию, создавать структурированные планы и обеспечивать предсказуемость"
      },
      'anxious': {
        trait: "вы склонны к беспокойству и мнительности",
        approach: "буду создавать ощущение безопасности, давать четкие гарантии и пошагово объяснять каждый процесс"
      },
      'hyperthymic': {
        trait: "вы энергичны и оптимистичны",
        approach: "буду поддерживать ваш энтузиазм, помогать направлять энергию в конструктивное русло и создавать динамичные планы"
      }
    };
    
    const insight = typeInsights[dominantType];
    if (insight) {
      message += `• ${insight.trait}: ${insight.approach}.\n`;
    } else {
      message += "каждый человек уникален в своем восприятии мира. ";
      message += "Я буду адаптировать стиль общения под ваши индивидуальные особенности. ";
    }
    
    return message;
  };

  const generateValuesMessage = (results) => {
    if (!results || !results.indices) {
      return `Я понимаю, что ценности - это основа личности каждого человека. `;
    }
    
    let message = `Анализируя вашу систему ценностей, я выявила следующие особенности:\n\n`;
    
    const indices = results.indices;
    const insights = [];
    
    // Анализ ключевых индексов
    if (indices.life_satisfaction !== undefined) {
      if (indices.life_satisfaction > 0.6) {
        insights.push({
          trait: "вы довольны своей жизнью и смотрите в будущее с оптимизмом",
          approach: "буду поддерживать ваш позитивный настрой и помогать укреплять то, что уже работает хорошо"
        });
      } else if (indices.life_satisfaction < 0.3) {
        insights.push({
          trait: "вы переживаете сложный период в жизни",
          approach: "буду особенно внимательна к вашим чувствам, помогу найти источники радости и поддержки"
        });
      }
    }
    
    if (indices.future_orientation !== undefined) {
      if (indices.future_orientation > 0.5) {
        insights.push({
          trait: "вы ориентированы на будущее и ставите долгосрочные цели",
          approach: "буду помогать вам планировать и достигать этих целей, создавать долгосрочные стратегии"
        });
      } else {
        insights.push({
          trait: "вы больше сосредоточены на настоящем моменте",
          approach: "буду помогать находить баланс между текущими потребностями и долгосрочными планами"
        });
      }
    }
    
    if (indices.self_attitude !== undefined) {
      if (indices.self_attitude > 0.6) {
        insights.push({
          trait: "у вас здоровое отношение к себе и высокая самооценка",
          approach: "буду поддерживать вашу уверенность и помогать развивать сильные стороны"
        });
      } else {
        insights.push({
          trait: "вы иногда сомневаетесь в себе",
          approach: "буду помогать видеть свои достоинства, развивать уверенность и признавать достижения"
        });
      }
    }
    
    if (indices.treatment_attitude !== undefined) {
      if (indices.treatment_attitude > 0.5) {
        insights.push({
          trait: "вы позитивно относитесь к лечению и медицинской помощи",
          approach: "буду поддерживать ваше доверие к медицине и помогать принимать обоснованные решения"
        });
      } else {
        insights.push({
          trait: "у вас есть сомнения в отношении лечения",
          approach: "буду особенно подробно объяснять каждый этап, отвечать на все вопросы и создавать ощущение безопасности"
        });
      }
    }
    
    if (insights.length === 0) {
      message += "у вас сбалансированная система ценностей. ";
      message += "Я буду поддерживать ваш гармоничный подход к жизни и помогать в достижении целей. ";
    } else {
      insights.forEach((insight, index) => {
        message += `• ${insight.trait}: ${insight.approach}.\n`;
      });
    }
    
    return message;
  };

  const generateIntegrationMessage = () => {
    let message = `\n\nНа основе всех полученных данных, мой стиль общения с вами будет включать:\n`;
    
    // Интеграция всех результатов для создания комплексного подхода
    message += `• Адаптацию тона и темпа речи под ваши индивидуальные особенности\n`;
    message += `• Использование наиболее подходящих для вас формулировок и примеров\n`;
    message += `• Создание комфортной атмосферы для открытого диалога\n`;
    message += `• Персонализированный подход к объяснению медицинской информации\n`;
    
    return message;
  };

  if (!isVisible || !demographics || !surveyType) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 mb-6">
      <div className="flex items-start space-x-4">
        {/* Tatiana's avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <HeartIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Tatiana</h3>
            <span className="text-sm text-gray-500">Your personal agent</span>
          </div>

          {isTyping ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>Tatiana is analyzing your results...</span>
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

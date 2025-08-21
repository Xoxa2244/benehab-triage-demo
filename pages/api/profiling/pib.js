// pages/api/profiling/pib.js

import { generatePIB } from '../../../lib/pib';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { attitude_profile, typology_profile, values_profile, demographics, patient_meta = {} } = req.body;

    // Проверяем наличие хотя бы одного профиля
    if (!attitude_profile && !typology_profile && !values_profile) {
      return res.status(400).json({ 
        error: 'Необходим хотя бы один профиль для генерации PIB' 
      });
    }

    // Генерируем PIB
    const pib = generatePIB(attitude_profile, typology_profile, values_profile, demographics, patient_meta);

    res.status(200).json({
      success: true,
      pib,
      message: 'PIB успешно сгенерирован'
    });
  } catch (error) {
    console.error('Ошибка генерации PIB:', error);
    res.status(500).json({ 
      error: 'Ошибка генерации PIB',
      details: error.message 
    });
  }
}

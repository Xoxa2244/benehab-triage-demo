import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) throw error

      // Also get concepts for dropdowns
      const { data: concepts } = await supabaseAdmin
        .from('concepts')
        .select('id, name')
        .order('name')

      return res.status(200).json({ 
        success: true, 
        settings: data || {
          id: 1,
          self_concept_id: null,
          ideal_concept_id: null,
          positive_anchors: [],
          negative_anchors: []
        },
        concepts: concepts || []
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { self_concept_id, ideal_concept_id, positive_anchors, negative_anchors } = req.body

      // Validate required fields
      if (!self_concept_id || !ideal_concept_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Self concept ID and Ideal concept ID are required' 
        })
      }

      // Validate arrays
      const positiveArray = Array.isArray(positive_anchors) ? positive_anchors : []
      const negativeArray = Array.isArray(negative_anchors) ? negative_anchors : []

      const { data, error } = await supabaseAdmin
        .from('admin_settings')
        .update({
          self_concept_id,
          ideal_concept_id,
          positive_anchors: positiveArray,
          negative_anchors: negativeArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ success: true, settings: data })
    } catch (error) {
      console.error('Error updating settings:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}


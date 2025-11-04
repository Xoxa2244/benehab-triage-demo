import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('metrics')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ success: true, metrics: data || [] })
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  if (req.method === 'POST') {
    try {
      const { text } = req.body

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Metric text is required' 
        })
      }

      // Create new metric with default values
      const { data, error } = await supabaseAdmin
        .from('metrics')
        .insert([{ 
          text: text.trim(),
          status: 'draft',
          version: 1
        }])
        .select()
        .single()

      if (error) throw error

      // Initialize matrices with default values (0)
      // This will be done when first accessing the matrices
      // For now, we just return the metric

      return res.status(201).json({ success: true, metric: data })
    } catch (error) {
      console.error('Error creating metric:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}


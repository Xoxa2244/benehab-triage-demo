import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  // Simple authentication check (can be enhanced later)
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For MVP, allow without auth. In production, add proper auth check
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('concepts')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      return res.status(200).json({ success: true, concepts: data || [] })
    } catch (error) {
      console.error('Error fetching concepts:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name } = req.body

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Concept name is required' 
        })
      }

      const { data, error } = await supabaseAdmin
        .from('concepts')
        .insert([{ name: name.trim() }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(409).json({ 
            success: false, 
            error: 'Concept with this name already exists' 
          })
        }
        throw error
      }

      // Trigger will automatically add the concept to all metrics' matrices
      return res.status(201).json({ success: true, concept: data })
    } catch (error) {
      console.error('Error creating concept:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}


import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('rank_config')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) throw error

      return res.status(200).json({ success: true, rankConfig: data })
    } catch (error) {
      console.error('Error fetching rank config:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { M } = req.body

      if (!M || typeof M !== 'number' || M < 2) {
        return res.status(400).json({ 
          success: false, 
          error: 'M must be an integer >= 2' 
        })
      }

      // Update M - trigger will automatically handle matrix updates
      const { data, error } = await supabaseAdmin
        .from('rank_config')
        .update({ M: Math.floor(M) })
        .eq('id', 1)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ success: true, rankConfig: data })
    } catch (error) {
      console.error('Error updating rank config:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}


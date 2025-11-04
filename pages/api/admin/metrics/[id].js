import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'DELETE') {
    try {
      // Check if metric is published
      const { data: metric } = await supabaseAdmin
        .from('metrics')
        .select('status')
        .eq('id', id)
        .single()

      if (metric?.status === 'published') {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete published metric. Unpublish first or create a duplicate.' 
        })
      }

      // Delete metric - CASCADE will automatically delete related matrix entries
      const { error } = await supabaseAdmin
        .from('metrics')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting metric:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('metrics')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return res.status(200).json({ success: true, metric: data })
    } catch (error) {
      console.error('Error fetching metric:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { text, status } = req.body

      const updates = {}
      if (text !== undefined) {
        if (typeof text !== 'string' || text.trim().length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Metric text cannot be empty' 
          })
        }
        updates.text = text.trim()
      }
      if (status !== undefined) {
        if (!['draft', 'published'].includes(status)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid status. Must be draft or published' 
          })
        }
        updates.status = status
      }

      updates.updated_at = new Date().toISOString()

      const { data, error } = await supabaseAdmin
        .from('metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ success: true, metric: data })
    } catch (error) {
      console.error('Error updating metric:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}


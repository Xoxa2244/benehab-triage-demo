import { supabaseAdmin } from '../../../../lib/supabase/server'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'DELETE') {
    try {
      // Delete concept - CASCADE will automatically delete related matrix entries
      const { error } = await supabaseAdmin
        .from('concepts')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting concept:', error)
      
      // Check if concept is referenced in settings
      if (error.message?.includes('foreign key')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete concept: it is referenced in settings' 
        })
      }

      return res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}


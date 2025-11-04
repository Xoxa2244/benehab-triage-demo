import { supabaseAdmin } from '../../../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    // Get current metric
    const { data: metric, error: fetchError } = await supabaseAdmin
      .from('metrics')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (metric.status === 'published') {
      return res.status(400).json({ 
        success: false, 
        error: 'Metric is already published' 
      })
    }

    // Update to published status
    const { data: updatedMetric, error: updateError } = await supabaseAdmin
      .from('metrics')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Log to audit
    await supabaseAdmin.from('metric_audit').insert([{
      metric_id: id,
      actor: 'admin',
      change: {
        action: 'published',
        from: 'draft',
        to: 'published',
        version: metric.version
      }
    }])

    return res.status(200).json({ success: true, metric: updatedMetric })
  } catch (error) {
    console.error('Error publishing metric:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}


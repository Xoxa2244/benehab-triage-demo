import { supabaseAdmin } from '../../../lib/supabase/server'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test 1: Simple connection test - try to access concepts table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('concepts')
      .select('*')
      .limit(0)

    const connectionStatus = {
      connected: true,
      timestamp: new Date().toISOString(),
      tests: {
        databaseConnection: {
          success: !testError,
          error: testError?.message || null,
          note: testError?.message?.includes('does not exist') 
            ? 'Tables not created yet - this is expected if migrations not run'
            : null
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    }

    // If tables don't exist, that's okay - connection is working
    // Check for various error messages that indicate table doesn't exist
    const tableNotFoundErrors = [
      'does not exist',
      'Could not find the table',
      'relation',
      'not found'
    ]
    
    const isTableNotFound = testError && testError.message && 
      tableNotFoundErrors.some(msg => testError.message.includes(msg))

    if (isTableNotFound) {
      connectionStatus.message = '✅ Connection successful! Tables not created yet (run migrations first)'
      connectionStatus.status = 'success'
      connectionStatus.tests.databaseConnection.note = 'Tables not created yet - this is expected if migrations not run'
      return res.status(200).json(connectionStatus)
    }

    if (testError) {
      connectionStatus.status = 'error'
      connectionStatus.message = '❌ Connection failed'
      connectionStatus.error = testError.message
      return res.status(500).json(connectionStatus)
    }

    connectionStatus.status = 'success'
    connectionStatus.message = '✅ Connection successful! Database accessible.'
    return res.status(200).json(connectionStatus)

  } catch (error) {
    return res.status(500).json({
      connected: false,
      status: 'error',
      message: '❌ Connection test failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    })
  }
}


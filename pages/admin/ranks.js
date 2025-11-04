import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

export default function RanksPage() {
  const [M, setM] = useState(5)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadRankConfig()
  }, [])

  const loadRankConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/ranks')
      const data = await response.json()

      if (data.success) {
        setM(data.rankConfig?.M || 5)
      } else {
        setError(data.error || 'Failed to load rank config')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleIncrease = () => {
    setM(M + 1)
  }

  const handleDecrease = () => {
    if (M <= 2) {
      setError('M cannot be less than 2')
      return
    }
    setM(M - 1)
  }

  const handleSave = async () => {
    if (M < 2) {
      setError('M must be >= 2')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/ranks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ M })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`M updated to ${M}. Matrix rows will be automatically updated.`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to update M')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Manage Rank Length (M)</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Current Rank Length: {M}</h2>
            <p className="text-gray-600">
              M represents the number of ranks in the attractiveness scale (1 to M)
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <button
              onClick={handleDecrease}
              disabled={M <= 2}
              className="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MinusIcon className="h-6 w-6" />
            </button>

            <div className="text-6xl font-bold text-blue-600 min-w-[80px] text-center">
              {M}
            </div>

            <button
              onClick={handleIncrease}
              className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Save button */}
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={saving || M < 2}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changing M will automatically update all metric matrices:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Increasing M: adds new rows for all concepts (values = 0)</li>
                <li>Decreasing M: removes rows where rank &gt; M</li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


import { useState, useEffect } from 'react'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import BackButton from '../../components/admin/BackButton'
import Breadcrumbs from '../../components/admin/Breadcrumbs'

export default function RanksPage() {
  const [M, setM] = useState(5)
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingColors, setSavingColors] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadRankConfig()
    loadColors()
  }, [])

  useEffect(() => {
    // Reload colors when M changes
    if (M > 0) {
      loadColors()
    }
  }, [M])

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

  const loadColors = async () => {
    try {
      const response = await fetch('/api/admin/ranks/colors')
      const data = await response.json()

      if (data.success) {
        setColors(data.colors || [])
      }
    } catch (err) {
      console.error('Error loading colors:', err)
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
        // Reload colors after M changes
        await loadColors()
      } else {
        setError(data.error || 'Failed to update M')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleColorChange = (rank, hexColor, label) => {
    setColors(prev => prev.map(c => 
      c.rank === rank 
        ? { ...c, hex_color: hexColor, label: label || c.label }
        : c
    ))
  }

  const handleSaveColors = async () => {
    try {
      setSavingColors(true)
      setError(null)
      setSuccess(null)

      const updates = colors.map(c => ({
        rank: c.rank,
        hex_color: c.hex_color,
        label: c.label || `Rank ${c.rank}`
      }))

      const response = await fetch('/api/admin/ranks/colors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Colors saved successfully!`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to save colors')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingColors(false)
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
              <BackButton href="/admin?tab=values" label="Психосемантика" />
              <h1 className="text-2xl font-bold text-gray-900">Manage Rank Length (M)</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Психосемантика', href: '/admin?tab=values' },
            { label: 'Ranks (M)' }
          ]}
        />

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

        {/* Rank Colors Editor */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rank Colors</h2>
            <p className="text-gray-600">
              Configure colors for each rank. These colors will be displayed in the survey.
            </p>
          </div>

          {colors.length > 0 && (
            <div className="space-y-4">
              {colors.map((color) => (
                <div key={color.rank} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-20 text-sm font-medium text-gray-700">
                    Rank {color.rank}
                  </div>
                  
                  <div className="flex-1 flex items-center space-x-4">
                    {/* Color Preview */}
                    <div 
                      className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex_color }}
                    />
                    
                    {/* Color Picker */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hex Color
                      </label>
                      <input
                        type="color"
                        value={color.hex_color}
                        onChange={(e) => handleColorChange(color.rank, e.target.value, color.label)}
                        className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>

                    {/* Hex Input */}
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hex Code
                      </label>
                      <input
                        type="text"
                        value={color.hex_color}
                        onChange={(e) => handleColorChange(color.rank, e.target.value, color.label)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="#FFFFFF"
                      />
                    </div>

                    {/* Label */}
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={color.label || ''}
                        onChange={(e) => handleColorChange(color.rank, color.hex_color, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`Color ${color.rank}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save Colors Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSaveColors}
              disabled={savingColors || colors.length === 0}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {savingColors ? 'Saving Colors...' : 'Save Colors'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


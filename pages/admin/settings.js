import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import BackButton from '../../components/admin/BackButton'
import Breadcrumbs from '../../components/admin/Breadcrumbs'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    self_concept_id: null,
    ideal_concept_id: null,
    positive_anchors: [],
    negative_anchors: []
  })
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings || {
          self_concept_id: null,
          ideal_concept_id: null,
          positive_anchors: [],
          negative_anchors: []
        })
        setConcepts(data.concepts || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error(error.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings.self_concept_id || !settings.ideal_concept_id) {
      toast.error('Self concept and Ideal concept are required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setSettings(data.settings)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAnchor = (conceptId, type) => {
    const key = type === 'positive' ? 'positive_anchors' : 'negative_anchors'
    const current = settings[key] || []
    const index = current.indexOf(conceptId)

    if (index > -1) {
      setSettings(prev => ({
        ...prev,
        [key]: current.filter(id => id !== conceptId)
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: [...current, conceptId]
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton href="/admin?tab=values" label="Психосемантика" />
              <h1 className="text-2xl font-bold text-gray-900">Affinity Settings</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Психосемантика', href: '/admin?tab=values' },
            { label: 'Settings' }
          ]}
        />

        {/* Self Concept */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Self Concept</h2>
          <p className="text-sm text-gray-600 mb-4">
            The concept that represents the user's self-perception. Used in Affinity calculation.
          </p>
          <select
            value={settings.self_concept_id || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, self_concept_id: e.target.value || null }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a concept...</option>
            {concepts.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ideal Concept */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ideal Concept</h2>
          <p className="text-sm text-gray-600 mb-4">
            The concept that represents the user's ideal state. Used in Affinity calculation.
          </p>
          <select
            value={settings.ideal_concept_id || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, ideal_concept_id: e.target.value || null }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a concept...</option>
            {concepts.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Positive Anchors */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Positive Anchors</h2>
          <p className="text-sm text-gray-600 mb-4">
            Concepts that represent positive associations. Concepts in the same zone as these anchors will have higher Affinity.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {concepts.map((concept) => {
              const isSelected = (settings.positive_anchors || []).includes(concept.id)
              return (
                <button
                  key={concept.id}
                  onClick={() => handleToggleAnchor(concept.id, 'positive')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-left ${
                    isSelected
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{concept.name}</span>
                    {isSelected && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {(settings.positive_anchors || []).length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Selected: {(settings.positive_anchors || []).length} concept(s)
            </div>
          )}
        </div>

        {/* Negative Anchors */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Negative Anchors</h2>
          <p className="text-sm text-gray-600 mb-4">
            Concepts that represent negative associations. Concepts in the same zone as these anchors will have lower Affinity.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {concepts.map((concept) => {
              const isSelected = (settings.negative_anchors || []).includes(concept.id)
              return (
                <button
                  key={concept.id}
                  onClick={() => handleToggleAnchor(concept.id, 'negative')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-left ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{concept.name}</span>
                    {isSelected && (
                      <span className="text-red-600">✓</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {(settings.negative_anchors || []).length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Selected: {(settings.negative_anchors || []).length} concept(s)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { PlayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import BackButton from '../../components/admin/BackButton'
import Breadcrumbs from '../../components/admin/Breadcrumbs'
import DebugPairsView from '../../components/admin/DebugPairsView'
import DebugScoresView from '../../components/admin/DebugScoresView'
import DebugAffinityView from '../../components/admin/DebugAffinityView'
import DebugWarnings from '../../components/admin/DebugWarnings'

export default function DebugPage() {
  const [metrics, setMetrics] = useState([])
  const [selectedMetricId, setSelectedMetricId] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [surveyResult, setSurveyResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [computing, setComputing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pairs')
  const [results, setResults] = useState(null)
  const [recomputeOnEdit, setRecomputeOnEdit] = useState(false)

  // Test presets
  const testPresets = [
    {
      name: 'Format A - Simple',
      data: {
        zones: [
          { zone_id: 'z1', hex: '#F94144' },
          { zone_id: 'z2', hex: '#577590' },
          { zone_id: 'z3', hex: '#43AA8B' }
        ],
        rankOf: { z1: 1, z2: 2, z3: 3 },
        conceptZone: {
          'c_life': 'z1',
          'c_love': 'z1',
          'c_treatment': 'z3',
          'c_fear': 'z3',
          'c_family': 'z2'
        }
      }
    },
    {
      name: 'Format B - Palette',
      data: {
        palette: [
          { zone_id: 'z1' },
          { zone_id: 'z2' },
          { zone_id: 'z3' }
        ],
        conceptZone: {
          'c_life': 'z1',
          'c_love': 'z1',
          'c_treatment': 'z3',
          'c_fear': 'z3',
          'c_family': 'z2'
        }
      }
    }
  ]

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics')
      const data = await response.json()

      if (data.success) {
        // Filter to only published metrics
        const published = (data.metrics || []).filter(m => m.status === 'published')
        setMetrics(published)

        // Auto-select first published metric
        if (published.length > 0 && !selectedMetricId) {
          setSelectedMetricId(published[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading metrics:', err)
    }
  }

  const loadPreset = (preset) => {
    setJsonInput(JSON.stringify(preset.data, null, 2))
    setError(null)
  }

  const handleCompute = async () => {
    if (!selectedMetricId) {
      toast.error('Please select a metric')
      return
    }

    let parsedResult
    try {
      parsedResult = JSON.parse(jsonInput)
    } catch (err) {
      setError('Invalid JSON format')
      toast.error('Invalid JSON format')
      return
    }

    try {
      setComputing(true)
      setError(null)
      setResults(null)

      const response = await fetch('/api/admin/debug/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyResult: parsedResult,
          metricId: selectedMetricId
        })
      })

      const data = await response.json()

      if (data.success) {
        setSurveyResult(parsedResult)
        setResults(data)
        setActiveTab('pairs')
        toast.success('Computation successful!')
      } else {
        setError(data.error || 'Computation failed')
        toast.error(data.error || 'Computation failed')
      }
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setComputing(false)
    }
  }

  const tabs = [
    { id: 'pairs', label: 'Pairs' },
    { id: 'scores', label: 'Scores' },
    { id: 'affinity', label: 'Affinity' },
    { id: 'warnings', label: 'Warnings' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton href="/admin?tab=values" label="Психосемантика" />
              <h1 className="text-2xl font-bold text-gray-900">Debug Calculations</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Психосемантика', href: '/admin?tab=values' },
            { label: 'Debug' }
          ]}
        />

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Data</h2>

          {/* Test Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Presets (click to load)
            </label>
            <div className="flex flex-wrap gap-2">
              {testPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPreset(preset)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* JSON Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Result (JSON)
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"zones": [...], "rankOf": {...}, "conceptZone": {...}}'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={10}
            />
          </div>

          {/* Metric Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Metric (published only)
            </label>
            <select
              value={selectedMetricId}
              onChange={(e) => setSelectedMetricId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a metric...</option>
              {metrics.map((metric) => (
                <option key={metric.id} value={metric.id}>
                  {metric.text} (v{metric.version})
                </option>
              ))}
            </select>
          </div>

          {/* Compute Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleCompute}
              disabled={!selectedMetricId || !jsonInput.trim() || computing}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {computing ? 'Computing...' : 'Compute'}
            </button>

            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={recomputeOnEdit}
                onChange={(e) => setRecomputeOnEdit(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Recompute on edit (when editing matrices)</span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Results</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Metric: {results.metric?.text} (v{results.metric?.version})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    Score: {results.score?.totalScore?.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'pairs' && (
                <DebugPairsView
                  concepts={results.concepts || []}
                  pairs={results.score?.pairs || []}
                  zones={surveyResult?.zones || []}
                  conceptZone={surveyResult?.conceptZone || {}}
                />
              )}

              {activeTab === 'scores' && (
                <DebugScoresView
                  scoreResult={results.score || {}}
                />
              )}

              {activeTab === 'affinity' && (
                <DebugAffinityView
                  affinityResult={results.affinity || {}}
                />
              )}

              {activeTab === 'warnings' && (
                <DebugWarnings
                  warnings={results.warnings || []}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


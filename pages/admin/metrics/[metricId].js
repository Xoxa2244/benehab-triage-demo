import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import BackButton from '../../../components/admin/BackButton'
import Breadcrumbs from '../../../components/admin/Breadcrumbs'
import MatrixEditorNxN from '../../../components/admin/MatrixEditorNxN'
import MatrixEditorMxN from '../../../components/admin/MatrixEditorMxN'
import SummaryPanel from '../../../components/admin/SummaryPanel'

export default function MetricEditorPage() {
  const router = useRouter()
  const { metricId } = router.query

  const [metric, setMetric] = useState(null)
  const [concepts, setConcepts] = useState([])
  const [M, setM] = useState(5)
  const [sameMatrix, setSameMatrix] = useState({})
  const [diffMatrix, setDiffMatrix] = useState({})
  const [rankMatrix, setRankMatrix] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('same')

  useEffect(() => {
    if (metricId) {
      loadData()
    }
  }, [metricId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load metric
      const metricRes = await fetch(`/api/admin/metrics/${metricId}`)
      const metricData = await metricRes.json()
      if (!metricData.success) throw new Error(metricData.error)
      setMetric(metricData.metric)

      // Load concepts
      const conceptsRes = await fetch('/api/admin/concepts')
      const conceptsData = await conceptsRes.json()
      if (!conceptsData.success) throw new Error(conceptsData.error)
      setConcepts(conceptsData.concepts || [])

      // Load M
      const ranksRes = await fetch('/api/admin/ranks')
      const ranksData = await ranksRes.json()
      if (!ranksData.success) throw new Error(ranksData.error)
      setM(ranksData.M || 5)

      // Load matrices
      const sameRes = await fetch(`/api/admin/metrics/${metricId}/matrices/same`)
      const sameData = await sameRes.json()
      if (sameData.success) {
        setSameMatrix(sameData.matrix || {})
      }

      const diffRes = await fetch(`/api/admin/metrics/${metricId}/matrices/diff`)
      const diffData = await diffRes.json()
      if (diffData.success) {
        setDiffMatrix(diffData.matrix || {})
      }

      const rankRes = await fetch(`/api/admin/metrics/${metricId}/matrices/rank`)
      const rankData = await rankRes.json()
      if (rankData.success) {
        setRankMatrix(rankData.matrix || {})
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSameUpdate = async (updates) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/metrics/${metricId}/matrices/same`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Reload matrix to get updated values
      const res = await fetch(`/api/admin/metrics/${metricId}/matrices/same`)
      const result = await res.json()
      if (result.success) {
        setSameMatrix(result.matrix || {})
      }
    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleDiffUpdate = async (updates) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/metrics/${metricId}/matrices/diff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Reload matrix to get updated values
      const res = await fetch(`/api/admin/metrics/${metricId}/matrices/diff`)
      const result = await res.json()
      if (result.success) {
        setDiffMatrix(result.matrix || {})
      }
    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleRankUpdate = async (updates) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/metrics/${metricId}/matrices/rank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Reload matrix to get updated values
      const res = await fetch(`/api/admin/metrics/${metricId}/matrices/rank`)
      const result = await res.json()
      if (result.success) {
        setRankMatrix(result.matrix || {})
      }
    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this metric? Published metrics are used in production calculations.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/metrics/${metricId}/publish`, {
        method: 'POST'
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setMetric(data.metric)
      toast.success('Metric published successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to publish metric')
    }
  }

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this metric? It will no longer be available for production calculations.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/metrics/${metricId}/unpublish`, {
        method: 'POST'
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setMetric(data.metric)
      toast.success('Metric unpublished successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to unpublish metric')
    }
  }

  const handleUpdateText = async (newText) => {
    try {
      const response = await fetch(`/api/admin/metrics/${metricId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setMetric(data.metric)
      toast.success('Metric text updated')
    } catch (error) {
      toast.error(error.message || 'Failed to update metric text')
    }
  }

  const calculateSameSum = () => {
    return Object.values(sameMatrix).reduce((sum, val) => sum + (val || 0), 0)
  }

  const calculateDiffSum = () => {
    return Object.values(diffMatrix).reduce((sum, val) => sum + (val || 0), 0)
  }

  const calculateRankSum = () => {
    return Object.values(rankMatrix).reduce((sum, val) => sum + (val || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading metric editor...</p>
        </div>
      </div>
    )
  }

  if (!metric) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Metric not found</p>
          <Link href="/admin/metrics" className="text-blue-600 hover:underline">
            Back to Metrics
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'same', label: 'Same Zone Weights' },
    { id: 'diff', label: 'Different Zone Weights' },
    { id: 'rank', label: 'Rank × Concept Weights' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton href="/admin/metrics" label="Metrics" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{metric.text}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    metric.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {metric.status}
                  </span>
                  <span className="text-sm text-gray-500">v{metric.version}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {metric.status === 'published' ? (
                <button
                  onClick={handleUnpublish}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Психосемантика', href: '/admin?tab=values' },
            { label: 'Metrics', href: '/admin/metrics' },
            { label: metric?.text || 'Edit Metric' }
          ]}
        />

        {/* Summary Panel */}
        <div className="mb-6">
          <SummaryPanel
            sameSum={calculateSameSum()}
            diffSum={calculateDiffSum()}
            rankSum={calculateRankSum()}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
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
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'same' && (
            <MatrixEditorNxN
              title="Same Zone Weights (N×N)"
              concepts={concepts}
              matrix={sameMatrix}
              onUpdate={handleSameUpdate}
              loading={saving}
              summary={calculateSameSum()}
            />
          )}

          {activeTab === 'diff' && (
            <MatrixEditorNxN
              title="Different Zone Weights (N×N)"
              concepts={concepts}
              matrix={diffMatrix}
              onUpdate={handleDiffUpdate}
              loading={saving}
              summary={calculateDiffSum()}
            />
          )}

          {activeTab === 'rank' && (
            <MatrixEditorMxN
              title="Rank × Concept Weights (M×N)"
              M={M}
              concepts={concepts}
              matrix={rankMatrix}
              onUpdate={handleRankUpdate}
              loading={saving}
              summary={calculateRankSum()}
            />
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/admin/BackButton'
import Breadcrumbs from '../../../components/admin/Breadcrumbs'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newMetricText, setNewMetricText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/metrics')
      const data = await response.json()

      if (data.success) {
        setMetrics(data.metrics || [])
      } else {
        setError(data.error || 'Failed to load metrics')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newMetricText.trim()) {
      setError('Metric text cannot be empty')
      return
    }

    try {
      setIsAdding(true)
      setError(null)
      const response = await fetch('/api/admin/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMetricText.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setNewMetricText('')
        setShowAddForm(false)
        await loadMetrics()
      } else {
        setError(data.error || 'Failed to add metric')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id, text) => {
    if (!confirm(`Are you sure you want to delete "${text}"? This will also remove all related matrix data.`)) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/admin/metrics/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadMetrics()
      } else {
        setError(data.error || 'Failed to delete metric')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDuplicate = async (id) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/metrics/${id}/duplicate`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        await loadMetrics()
      } else {
        setError(data.error || 'Failed to duplicate metric')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePublish = async (id) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/metrics/${id}/publish`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        await loadMetrics()
      } else {
        setError(data.error || 'Failed to publish metric')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUnpublish = async (id) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/metrics/${id}/unpublish`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        await loadMetrics()
      } else {
        setError(data.error || 'Failed to unpublish metric')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton href="/admin?tab=values" label="Психосемантика" />
              <h1 className="text-2xl font-bold text-gray-900">Manage Metrics</h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {metrics.length} metrics
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Психосемантика', href: '/admin?tab=values' },
            { label: 'Metrics' }
          ]}
        />

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Add metric form */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Metric
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newMetricText}
                  onChange={(e) => setNewMetricText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Enter metric text..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newMetricText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewMetricText('')
                    setError(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metrics table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading metrics...</p>
            </div>
          ) : metrics.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No metrics yet. Add your first metric above.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-md">
                        {metric.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        metric.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {metric.status === 'published' ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <DocumentIcon className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        v{metric.version}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/metrics/${metric.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Open/Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(metric.id)}
                          className="text-purple-600 hover:text-purple-900 transition-colors"
                          title="Duplicate to draft"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                        {metric.status === 'published' ? (
                          <button
                            onClick={() => handleUnpublish(metric.id)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Unpublish"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublish(metric.id)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Publish"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(metric.id, metric.text)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}


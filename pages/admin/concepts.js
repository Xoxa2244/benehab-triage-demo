import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import BackButton from '../../components/admin/BackButton'
import Breadcrumbs from '../../components/admin/Breadcrumbs'

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newConceptName, setNewConceptName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoadingBulk, setIsLoadingBulk] = useState(false)

  useEffect(() => {
    loadConcepts()
  }, [])

  const loadConcepts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/concepts')
      const data = await response.json()

      if (data.success) {
        setConcepts(data.concepts || [])
      } else {
        setError(data.error || 'Failed to load concepts')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newConceptName.trim()) {
      setError('Concept name cannot be empty')
      return
    }

    try {
      setIsAdding(true)
      setError(null)
      const response = await fetch('/api/admin/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newConceptName.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setNewConceptName('')
        setShowAddForm(false)
        await loadConcepts() // Reload to show new concept
      } else {
        setError(data.error || 'Failed to add concept')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove all related matrix entries.`)) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/admin/concepts/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadConcepts() // Reload to reflect deletion
      } else {
        setError(data.error || 'Failed to delete concept')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBulkLoad = async () => {
    if (!confirm('This will load all 65 concepts from CSV file and update M (rank) to 11. Continue?')) {
      return
    }

    try {
      setIsLoadingBulk(true)
      setError(null)
      
      const response = await fetch('/api/admin/concepts/bulk-load', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        let message = `Successfully loaded ${data.summary.loaded} concepts. ${data.summary.skipped} already existed, ${data.summary.errors} errors.`
        
        if (data.rankConfig) {
          if (data.rankConfig.updated) {
            message += `\n\nM (rank) updated to 11.`
          } else if (data.rankConfig.error) {
            message += `\n\n⚠️ Warning: Failed to update M (rank): ${data.rankConfig.error}`
          }
        }
        
        alert(message)
        await loadConcepts() // Reload to show new concepts
      } else {
        setError(data.error || 'Failed to bulk load concepts')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingBulk(false)
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
              <h1 className="text-2xl font-bold text-gray-900">Manage Concepts</h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {concepts.length} concepts
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Психосемантика', href: '/admin?tab=values' },
            { label: 'Concepts' }
          ]}
        />

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Add concept form */}
        <div className="mb-6 flex items-center space-x-4">
          {!showAddForm ? (
            <>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Concept
              </button>
              <button
                onClick={handleBulkLoad}
                disabled={isLoadingBulk}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                {isLoadingBulk ? 'Loading...' : 'Load from CSV (65 concepts)'}
              </button>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newConceptName}
                  onChange={(e) => setNewConceptName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Enter concept name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newConceptName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewConceptName('')
                    setError(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Adding a concept will automatically create matrix entries for all existing metrics.
              </p>
            </div>
          )}
        </div>

        {/* Concepts table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading concepts...</p>
            </div>
          ) : concepts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No concepts yet. Add your first concept above.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {concepts.map((concept) => (
                  <tr key={concept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {concept.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(concept.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(concept.id, concept.name)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
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


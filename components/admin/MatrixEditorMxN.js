import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

export default function MatrixEditorMxN({ 
  title, 
  M, 
  concepts, 
  matrix, 
  onUpdate, 
  loading = false,
  summary = null 
}) {
  const [localMatrix, setLocalMatrix] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const scrollContainerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setLocalMatrix(matrix || {})
    setHasChanges(false)
  }, [matrix])

  // Right-click drag scrolling
  const handleMouseDown = useCallback((e) => {
    if (e.button === 2) { // Right mouse button
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      if (scrollContainerRef.current) {
        setScrollStart({
          x: scrollContainerRef.current.scrollLeft,
          y: scrollContainerRef.current.scrollTop
        })
      }
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (isDragging && scrollContainerRef.current) {
      e.preventDefault()
      const deltaX = dragStart.x - e.clientX
      const deltaY = dragStart.y - e.clientY
      scrollContainerRef.current.scrollLeft = scrollStart.x + deltaX
      scrollContainerRef.current.scrollTop = scrollStart.y + deltaY
    }
  }, [isDragging, dragStart, scrollStart])

  const handleMouseUp = useCallback((e) => {
    if (e.button === 2) {
      setIsDragging(false)
    }
  }, [])

  const handleContextMenu = useCallback((e) => {
    if (isDragging) {
      e.preventDefault()
    }
  }, [isDragging])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('contextmenu', handleContextMenu)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleContextMenu])

  const handleCellChange = (rank, concept, value) => {
    const numValue = parseFloat(value) || 0
    const clampedValue = Math.max(-1, Math.min(1, numValue))
    
    const key = `${rank}_${concept.id}`

    setLocalMatrix(prev => ({
      ...prev,
      [key]: clampedValue
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!hasChanges) return

    const updates = []
    Object.keys(localMatrix).forEach(key => {
      const [rank, conceptId] = key.split('_')
      updates.push({
        rank: parseInt(rank),
        concept_id: conceptId,
        value: localMatrix[key]
      })
    })

    try {
      await onUpdate(updates)
      setHasChanges(false)
      toast.success('Matrix updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update matrix')
    }
  }

  const getCellValue = (rank, concept) => {
    const key = `${rank}_${concept.id}`
    return localMatrix[key] || 0
  }

  const calculateSum = () => {
    return Object.values(localMatrix).reduce((sum, val) => sum + (val || 0), 0)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {summary && (
            <div className="text-right">
              <div className="text-sm text-purple-100">Sum</div>
              <div className="text-2xl font-bold text-white">{summary.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-[600px]"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 sticky left-0 z-10">
                Rank
              </th>
              {concepts.map((concept) => (
                <th
                  key={concept.id}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 min-w-[100px]"
                >
                  <div className="truncate max-w-[100px]" title={concept.name}>
                    {concept.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: M }, (_, i) => i + 1).map((rank) => (
              <tr key={rank} className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                  Rank {rank}
                </td>
                {concepts.map((concept) => {
                  const value = getCellValue(rank, concept)
                  
                  return (
                    <td
                      key={concept.id}
                      className="px-2 py-2 text-center bg-white hover:bg-purple-50"
                    >
                      <input
                        type="number"
                        step="0.01"
                        min="-1"
                        max="1"
                        value={value}
                        onChange={(e) => handleCellChange(rank, concept, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                        disabled={loading}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Sum: <span className="font-medium">{calculateSum().toFixed(2)}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  )
}

import { useMemo } from 'react'

export default function DebugPairsView({ concepts, pairs, zones, conceptZone }) {
  // Build heatmap data
  const heatmapData = useMemo(() => {
    const data = {}
    pairs.forEach(pair => {
      const key = `${pair.conceptI}_${pair.conceptJ}`
      data[key] = {
        ...pair,
        value: pair.weight
      }
    })
    return data
  }, [pairs])

  // Get zone color mapping
  const zoneColors = useMemo(() => {
    const colors = {}
    zones?.forEach(zone => {
      colors[zone.zone_id] = zone.hex || '#999999'
    })
    return colors
  }, [zones])

  const getCellColor = (pair) => {
    const value = pair.weight || 0
    if (value === 0) return 'bg-gray-100'
    if (value > 0) {
      const intensity = Math.min(Math.abs(value) * 255, 255)
      return `bg-green-${Math.max(100, Math.min(500, Math.round(intensity / 51) * 100))}`
    } else {
      const intensity = Math.min(Math.abs(value) * 255, 255)
      return `bg-red-${Math.max(100, Math.min(500, Math.round(intensity / 51) * 100))}`
    }
  }

  const getZoneColor = (zoneId) => {
    return zoneColors[zoneId] || '#cccccc'
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 sticky left-0 z-10">
                Concept i \ j
              </th>
              {concepts.map((concept) => (
                <th
                  key={concept.id}
                  className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 min-w-[100px]"
                >
                  <div className="flex flex-col items-center">
                    <span>{concept.name}</span>
                    {conceptZone && conceptZone[concept.id] && (
                      <div
                        className="w-4 h-4 rounded mt-1"
                        style={{ backgroundColor: getZoneColor(conceptZone[concept.id]) }}
                        title={`Zone: ${conceptZone[concept.id]}`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {concepts.map((conceptI, i) => (
              <tr key={conceptI.id}>
                <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 sticky left-0 z-10">
                  <div className="flex items-center space-x-2">
                    <span>{conceptI.name}</span>
                    {conceptZone && conceptZone[conceptI.id] && (
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getZoneColor(conceptZone[conceptI.id]) }}
                        title={`Zone: ${conceptZone[conceptI.id]}`}
                      />
                    )}
                  </div>
                </td>
                {concepts.map((conceptJ, j) => {
                  if (i === j) {
                    return (
                      <td
                        key={conceptJ.id}
                        className="border border-gray-300 bg-gray-200 text-center"
                      >
                        <span className="text-xs text-gray-400">-</span>
                      </td>
                    )
                  }

                  const pair = pairs.find(p =>
                    (p.conceptI === conceptI.name && p.conceptJ === conceptJ.name) ||
                    (p.conceptI === conceptJ.name && p.conceptJ === conceptI.name)
                  )

                  if (!pair) {
                    return (
                      <td
                        key={conceptJ.id}
                        className="border border-gray-300 bg-gray-100"
                      >
                        <span className="text-xs text-gray-400">N/A</span>
                      </td>
                    )
                  }

                  return (
                    <td
                      key={conceptJ.id}
                      className={`border border-gray-300 px-2 py-1 text-center ${getCellColor(pair)}`}
                      title={`${pair.conceptI} × ${pair.conceptJ}: ${pair.weight.toFixed(2)} (${pair.isSameZone ? 'same zone' : 'diff zone'})`}
                    >
                      <div className="text-xs font-medium">
                        {pair.weight.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {pair.isSameZone ? 'S' : 'D'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <span>Positive weight</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 rounded"></div>
          <span>Negative weight</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>S</span>
          <span>= Same zone</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>D</span>
          <span>= Different zones</span>
        </div>
      </div>
    </div>
  )
}


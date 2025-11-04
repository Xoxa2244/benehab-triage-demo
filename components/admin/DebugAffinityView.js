export default function DebugAffinityView({ affinityResult }) {
  const { affinities, top, bottom } = affinityResult

  // Sort for display
  const sortedAffinities = [...affinities].sort((a, b) => b.affinity - a.affinity)

  return (
    <div className="space-y-6">
      {/* Top/Bottom Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Affinities */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Top Affinities</h4>
          <div className="space-y-2">
            {top.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{item.concept}</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {item.affinity.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Affinities */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Bottom Affinities</h4>
          <div className="space-y-2">
            {bottom.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">#{sortedAffinities.length - index}</span>
                  <span className="text-sm font-medium text-gray-900">{item.concept}</span>
                </div>
                <div className="text-lg font-bold text-red-600">
                  {item.affinity.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Affinity Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <h4 className="text-md font-semibold text-gray-900 p-4 border-b">All Affinities (Breakdown)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Self</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ideal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positive</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Negative</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAffinities.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.concept}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.zone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.rank || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.breakdown.self.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.breakdown.ideal.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.breakdown.rank.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {item.breakdown.positive > 0 ? '+' : ''}{item.breakdown.positive.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {item.breakdown.negative.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {item.affinity.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


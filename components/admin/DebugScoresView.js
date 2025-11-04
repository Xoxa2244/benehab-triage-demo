export default function DebugScoresView({ scoreResult }) {
  const { sameSum, diffSum, rankSum, totalScore, pairs, rankContributions } = scoreResult

  // Top contributing pairs
  const topPairs = [...pairs]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 10)
    .filter(p => p.contribution !== 0)

  // Top contributing ranks
  const topRanks = [...rankContributions]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 10)
    .filter(r => r.contribution !== 0)

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Same Zone Pairs</div>
            <div className="text-2xl font-bold text-blue-600">{sameSum.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Different Zone Pairs</div>
            <div className="text-2xl font-bold text-purple-600">{diffSum.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Rank × Concept</div>
            <div className="text-2xl font-bold text-green-600">{rankSum.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-blue-500">
            <div className="text-xs text-gray-500 mb-1">Total Score</div>
            <div className="text-2xl font-bold text-gray-900">{totalScore.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Top Contributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pairs */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Top Contributing Pairs</h4>
          {topPairs.length === 0 ? (
            <p className="text-sm text-gray-500">No pairs with non-zero contributions</p>
          ) : (
            <div className="space-y-2">
              {topPairs.map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="text-sm">
                    <span className="font-medium">{pair.conceptI}</span>
                    <span className="text-gray-500"> × </span>
                    <span className="font-medium">{pair.conceptJ}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({pair.isSameZone ? 'same' : 'diff'})
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${
                    pair.contribution > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pair.contribution > 0 ? '+' : ''}{pair.contribution.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Ranks */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Top Contributing Ranks</h4>
          {topRanks.length === 0 ? (
            <p className="text-sm text-gray-500">No rank contributions</p>
          ) : (
            <div className="space-y-2">
              {topRanks.map((rank, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="text-sm">
                    <span className="font-medium">Rank {rank.rank}</span>
                    <span className="text-gray-500"> × </span>
                    <span className="font-medium">{rank.concept}</span>
                  </div>
                  <div className={`text-sm font-medium ${
                    rank.contribution > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {rank.contribution > 0 ? '+' : ''}{rank.contribution.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


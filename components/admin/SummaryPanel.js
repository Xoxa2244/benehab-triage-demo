export default function SummaryPanel({ 
  sameSum = 0, 
  diffSum = 0, 
  rankSum = 0 
}) {
  const total = sameSum + diffSum + rankSum

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Matrix Summary</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Same Zone Pairs</span>
          <span className="text-lg font-medium text-blue-600">{sameSum.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Different Zone Pairs</span>
          <span className="text-lg font-medium text-green-600">{diffSum.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rank × Concept</span>
          <span className="text-lg font-medium text-purple-600">{rankSum.toFixed(2)}</span>
        </div>
        
        <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">Total Score</span>
          <span className="text-2xl font-bold text-gray-900">{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

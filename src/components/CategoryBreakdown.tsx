import type { CategoryPerformance } from '@/lib/utils/scoring'

interface CategoryBreakdownProps {
  categories: CategoryPerformance[]
}

const ratingColor: Record<string, string> = {
  Exceptional: 'text-green-700',
  Strong: 'text-blue-700',
  Solid: 'text-yellow-700',
  Developing: 'text-orange-700',
  Emerging: 'text-gray-500',
}

const barColor: Record<string, string> = {
  Exceptional: 'bg-green-500',
  Strong: 'bg-blue-500',
  Solid: 'bg-yellow-400',
  Developing: 'bg-orange-400',
  Emerging: 'bg-gray-300',
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Category Performance
      </h2>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-200">
              <th className="px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-center">
                Score
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                Progress
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">
                Rating
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, idx) => (
              <tr
                key={cat.category}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 text-gray-800">{cat.category}</td>
                <td className="px-4 py-3 text-center text-gray-700 tabular-nums">
                  {cat.correct}/{cat.total}
                  <span className="text-gray-400 ml-1">
                    ({cat.percentage.toFixed(0)}%)
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColor[cat.rating]}`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium ${ratingColor[cat.rating]}`}
                >
                  {cat.rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

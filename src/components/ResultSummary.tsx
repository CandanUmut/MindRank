import { formatTime, getOrdinal, getPerformanceTier } from '@/lib/utils/scoring'

interface SessionData {
  score: number
  max_score: number
  percentage: number
  time_spent_seconds: number
  status: string
}

interface RankingData {
  my_score: number
  my_rank: number
  my_percentile: number
  total_participants: number
}

interface ResultSummaryProps {
  session: SessionData
  ranking: RankingData | null
}

const tierBadge: Record<string, string> = {
  Exceptional: 'bg-green-100 text-green-800',
  Strong: 'bg-blue-100 text-blue-800',
  Solid: 'bg-yellow-100 text-yellow-800',
  Developing: 'bg-orange-100 text-orange-800',
  Emerging: 'bg-gray-100 text-gray-700',
}

export default function ResultSummary({ session, ranking }: ResultSummaryProps) {
  const tier = ranking ? getPerformanceTier(Number(ranking.my_percentile)) : null

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
      {session.status === 'timed_out' && (
        <p className="text-sm text-red-600 mb-4 font-medium">
          Time expired — your answers up to that point were scored.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">
            {session.score}/{session.max_score}
          </p>
          <p className="text-xs text-gray-500 mt-1">Score</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-800">
            {Number(session.percentage).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Percentage</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-800">
            {formatTime(session.time_spent_seconds)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Time</p>
        </div>
        {ranking ? (
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">
              {getOrdinal(Number(ranking.my_rank))}
            </p>
            <p className="text-xs text-gray-500 mt-1">Rank</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-400">—</p>
            <p className="text-xs text-gray-500 mt-1">Rank</p>
          </div>
        )}
      </div>

      {ranking && (
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            {getOrdinal(Number(ranking.my_rank))} out of{' '}
            {Number(ranking.total_participants).toLocaleString()} participants
            &nbsp;·&nbsp;
            top {Math.max(1, Math.round(100 - Number(ranking.my_percentile)))}%
          </p>
          {tier && (
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${tierBadge[tier]}`}
            >
              {tier}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

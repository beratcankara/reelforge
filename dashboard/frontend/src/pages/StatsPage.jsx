import { useEffect, useState } from 'react';
import { statsAPI } from '../services/api';

function StatsPage() {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [costs, setCosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [overviewRes, performanceRes, costsRes] = await Promise.all([
        statsAPI.overview(),
        statsAPI.performance({ days: 7 }),
        statsAPI.costs(),
      ]);

      setOverview(overviewRes.data.data);
      setPerformance(performanceRes.data.data);
      setCosts(costsRes.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Stats */}
      <div>
        <h3 className="text-xl font-bold mb-4">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <p className="text-gray-400 text-sm">Total Videos Posted</p>
            <p className="text-4xl font-bold mt-2">{overview?.videos?.total || 0}</p>
            <p className="text-sm text-green-400 mt-1">
              {overview?.videos?.successRate || 0}% success rate
            </p>
          </div>

          <div className="card">
            <p className="text-gray-400 text-sm">Avg. Generation Time</p>
            <p className="text-4xl font-bold mt-2">
              {performance?.overall?.avgGenerationTime
                ? Math.round(performance.overall.avgGenerationTime / 60)
                : 0}
              <span className="text-lg text-gray-400">m</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">per video</p>
          </div>

          <div className="card">
            <p className="text-gray-400 text-sm">Estimated Cost (This Month)</p>
            <p className="text-4xl font-bold mt-2">${costs?.total || '0.00'}</p>
            <p className="text-sm text-gray-400 mt-1">API usage</p>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div>
        <h3 className="text-xl font-bold mb-4">Performance (Last 7 Days)</h3>
        <div className="card">
          {performance?.daily && performance.daily.length > 0 ? (
            <div className="space-y-4">
              {performance.daily.map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-400">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 h-8 bg-dark-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-lg"
                      style={{ width: `${(day.successful / Math.max(day.total, 1)) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm">
                    <span className="text-green-400">{day.successful}</span>
                    <span className="text-gray-400">/{day.total}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No performance data available</p>
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div>
        <h3 className="text-xl font-bold mb-4">Cost Breakdown</h3>
        <div className="card">
          {costs?.breakdown && costs.breakdown.length > 0 ? (
            <div className="space-y-4">
              {costs.breakdown.map((item) => (
                <div key={item.provider} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{item.provider}</p>
                    <p className="text-sm text-gray-400">{item.calls} videos</p>
                  </div>
                  <p className="text-xl font-bold">${item.cost}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-dark-600">
                <p className="font-medium">Total</p>
                <p className="text-2xl font-bold">${costs.total}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No cost data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;

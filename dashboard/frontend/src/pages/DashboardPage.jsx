import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI, approvalsAPI } from '../services/api';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        statsAPI.overview(),
        statsAPI.activity({ limit: 5 }),
      ]);

      setStats(statsRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Videos */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Videos</p>
              <p className="text-3xl font-bold mt-1">{stats?.videos?.total || 0}</p>
              <p className="text-sm text-gray-400 mt-1">
                {stats?.videos?.last30Days || 0} this month
              </p>
            </div>
            <div className="text-4xl">🎬</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold mt-1 text-green-400">
                {stats?.videos?.successRate || 0}%
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {stats?.videos?.successful || 0} / {stats?.videos?.total || 0} successful
              </p>
            </div>
            <div className="text-4xl">✓</div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Accounts</p>
              <p className="text-3xl font-bold mt-1">{stats?.accounts?.active || 0}</p>
              <p className="text-sm text-gray-400 mt-1">
                of {stats?.accounts?.total || 0} total
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1 text-yellow-400">
                {stats?.approvals?.pending || 0}
              </p>
              <p className="text-sm text-gray-400 mt-1">awaiting review</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/approvals"
              className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium">Review Approvals</p>
                  <p className="text-sm text-gray-400">
                    {stats?.approvals?.pending || 0} videos pending
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/accounts"
              className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium">Add Instagram Account</p>
                  <p className="text-sm text-gray-400">Connect a new account</p>
                </div>
              </div>
            </Link>

            <Link
              to="/stats"
              className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium">View Statistics</p>
                  <p className="text-sm text-gray-400">Performance & costs</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg"
                >
                  <span className="text-xl">
                    {activity.type === 'success' ? '✅' : activity.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

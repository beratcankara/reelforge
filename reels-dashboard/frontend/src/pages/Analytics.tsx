import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

export default function Analytics() {
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/overview');
      return response.data.snapshots;
    },
  });

  const totalMetrics = analyticsData?.reduce(
    (acc: any, snapshot: any) => ({
      reach: acc.reach + (snapshot.metrics.reach || 0),
      impressions: acc.impressions + (snapshot.metrics.impressions || 0),
      engagement: acc.engagement + (snapshot.metrics.engagement || 0),
    }),
    { reach: 0, impressions: 0, engagement: 0 }
  );

  const metrics = [
    {
      title: 'Total Reach',
      value: ((totalMetrics?.reach || 0) / 1000).toFixed(1) + 'K',
      change: '+12%',
      icon: Eye,
      gradient: 'from-blue-500 to-cyan-500',
      chartData: [40, 52, 48, 65, 58, 72, 68],
    },
    {
      title: 'Impressions',
      value: ((totalMetrics?.impressions || 0) / 1000).toFixed(1) + 'K',
      change: '+8%',
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500',
      chartData: [35, 45, 42, 58, 52, 65, 61],
    },
    {
      title: 'Engagement',
      value: ((totalMetrics?.engagement || 0) / 1000).toFixed(1) + 'K',
      change: '+15%',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-500',
      chartData: [30, 42, 38, 55, 48, 68, 72],
    },
    {
      title: 'Engagement Rate',
      value: '6.8%',
      change: '+2.1%',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      chartData: [4.2, 5.1, 4.8, 6.2, 5.8, 6.5, 6.8],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Performance metrics across all accounts 📊
        </p>
      </motion.div>

      {/* Main Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className={`absolute -inset-1 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity`} />
              
              <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
                {/* Icon */}
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <motion.div
                    className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {metric.change}
                  </motion.div>
                </div>

                {/* Value */}
                <div className="mb-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {metric.title}
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {metric.value}
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="flex items-end gap-1 h-12 mt-4">
                  {metric.chartData.map((value, i) => (
                    <motion.div
                      key={i}
                      className={`flex-1 bg-gradient-to-t ${metric.gradient} rounded-t`}
                      initial={{ height: 0 }}
                      animate={{ height: `${value}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      whileHover={{ opacity: 0.8 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance by Account */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            Performance by Account
          </h2>
          <div className="space-y-4">
            {analyticsData?.map((snapshot: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ x: 10 }}
                className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800/50 dark:to-purple-950/20 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Account #{snapshot.accountId}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {snapshot.period} snapshot
                    </div>
                  </div>
                  <motion.div
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold"
                    whileHover={{ scale: 1.1 }}
                  >
                    Live
                  </motion.div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {(snapshot.metrics.reach / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-slate-500">Reach</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {(snapshot.metrics.impressions / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-slate-500">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-600">
                      {(snapshot.metrics.engagement / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-slate-500">Engagement</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Engagement Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" />
            Engagement Breakdown
          </h2>
          
          <div className="space-y-6">
            {[
              { label: 'Likes', value: 85, icon: Heart, color: 'from-pink-500 to-rose-500' },
              { label: 'Comments', value: 62, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
              { label: 'Shares', value: 48, icon: Share2, color: 'from-purple-500 to-indigo-500' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${item.color} shadow-lg`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 1 + index * 0.1, duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-8 p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white"
            >
              <div className="text-sm opacity-90 mb-1">Average Engagement Rate</div>
              <div className="text-3xl font-bold">6.8%</div>
              <div className="text-xs opacity-75 mt-1">↑ 2.1% from last period</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

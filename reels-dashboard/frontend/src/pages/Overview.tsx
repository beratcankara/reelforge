import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Users, CheckCircle2, Clock } from 'lucide-react';

export default function Overview() {
  const { data: stats } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/approvals/stats/overview');
      return response.data.stats;
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await apiClient.get('/accounts');
      return response.data.accounts;
    },
  });

  const activeAccounts = accountsData?.filter((a: any) => a.isActive).length || 0;
  const totalReach = accountsData?.reduce((sum: number, a: any) => 
    sum + (a.metadata?.followersCount || 0), 0
  ) || 0;

  const statCards = [
    {
      title: 'Pending Approvals',
      value: stats?.pending || 0,
      subtitle: `${stats?.total || 0} total reels`,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Approved This Week',
      value: stats?.approved || 0,
      subtitle: `${stats?.rejected || 0} rejected`,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-500',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Total Followers',
      value: `${(totalReach / 1000).toFixed(1)}K`,
      subtitle: 'Across all accounts',
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Active Accounts',
      value: activeAccounts,
      subtitle: `${accountsData?.length || 0} total`,
      icon: Zap,
      gradient: 'from-blue-500 to-cyan-500',
      change: '0%',
      trend: 'neutral'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Welcome to your Instagram Reels management dashboard ✨
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                   style={{ background: `linear-gradient(to right, ${card.gradient.split(' ')[0].replace('from-', '')}, ${card.gradient.split(' ')[1].replace('to-', '')})` }} />
              
              <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
                {/* Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {card.title}
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {card.value}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {card.subtitle}
                    </div>
                    {card.trend === 'up' && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        {card.change}
                      </div>
                    )}
                  </div>
                </div>

                {/* Animated Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 overflow-hidden">
                  <motion.div
                    className={`w-full h-full bg-gradient-to-br ${card.gradient}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Instagram Accounts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">📱</span>
            Instagram Accounts
          </h2>
          <div className="space-y-4">
            {accountsData?.map((account: any, index: number) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ x: 10, scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <motion.img
                    src={account.metadata?.profilePictureUrl}
                    alt={account.username}
                    className="h-12 w-12 rounded-full ring-2 ring-purple-500/50"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      @{account.username}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {(account.metadata?.followersCount || 0).toLocaleString()} followers
                    </div>
                  </div>
                </div>
                <motion.div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    account.isActive 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {account.isActive ? '✓ Active' : 'Inactive'}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats with Animated Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Performance Metrics
          </h2>
          <div className="space-y-6">
            {/* Approval Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Approval Rate
                </span>
                <motion.span 
                  className="font-bold text-green-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {stats?.total ? Math.round((stats.approved / stats.total) * 100) : 0}%
                </motion.span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${stats?.total ? (stats.approved / stats.total) * 100 : 0}%` 
                  }}
                  transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Rejection Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Rejection Rate
                </span>
                <motion.span 
                  className="font-bold text-red-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  {stats?.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%
                </motion.span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-red-400 to-pink-500 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${stats?.total ? (stats.rejected / stats.total) * 100 : 0}%` 
                  }}
                  transition={{ delay: 1, duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Efficiency Score */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  System Efficiency
                </span>
                <motion.span 
                  className="font-bold text-purple-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  94%
                </motion.span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-500 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: '94%' }}
                  transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Quick Action Button */}
            <motion.button
              className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.98 }}
            >
              View Detailed Analytics →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { motion } from 'framer-motion';
import { Instagram, TrendingUp, Users, ToggleLeft, ToggleRight, Zap, Crown } from 'lucide-react';

export default function Accounts() {
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await apiClient.get('/accounts');
      return response.data.accounts;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/accounts/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const accountGradients = [
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Instagram Accounts
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your connected Instagram accounts 📱
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
          <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Instagram className="w-10 h-10 text-pink-500" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Crown className="w-6 h-6 text-yellow-500" />
              </motion.div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {accountsData?.length || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Accounts</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
          <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-10 h-10 text-green-500" />
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {accountsData?.filter((a: any) => a.isActive).length || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Active Accounts</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
          <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-purple-500" />
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {((accountsData?.reduce((sum: number, a: any) => sum + (a.metadata?.followersCount || 0), 0) || 0) / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Followers</div>
          </div>
        </motion.div>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent"
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accountsData?.map((account: any, index: number) => {
            const gradient = accountGradients[index % accountGradients.length];
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity`} />
                
                <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <img
                          src={account.metadata?.profilePictureUrl}
                          alt={account.username}
                          className={`h-16 w-16 rounded-full ring-4 ring-offset-2 ring-offset-transparent`}
                          style={{ 
                            boxShadow: `0 0 0 4px transparent, 0 0 0 6px ${account.isActive ? '#10B981' : '#9CA3AF'}` 
                          }}
                        />
                        {account.isActive && (
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Zap className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      
                      <div>
                        <motion.div 
                          className="font-bold text-lg text-slate-900 dark:text-white"
                          whileHover={{ x: 5 }}
                        >
                          @{account.username}
                        </motion.div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {account.metadata?.followersCount?.toLocaleString()} followers
                        </div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <motion.button
                      onClick={() => toggleMutation.mutate(account.id)}
                      disabled={toggleMutation.isPending}
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-3 rounded-xl transition-all ${
                        account.isActive 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      {account.isActive ? (
                        <ToggleRight className="h-6 w-6 text-white" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-500" />
                      )}
                    </motion.button>
                  </div>

                  {/* Biography */}
                  {account.metadata?.biography && (
                    <motion.p 
                      className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 px-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {account.metadata.biography}
                    </motion.p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
                    >
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {(account.metadata?.followersCount / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Followers</div>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className={`text-center p-3 rounded-xl ${
                        account.isActive 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      <div className={`text-2xl font-bold ${
                        account.isActive 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
                          : 'text-slate-500'
                      }`}>
                        {account.isActive ? '✓ Active' : 'Paused'}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Status</div>
                    </motion.div>
                  </div>

                  {/* Last Sync */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                    <span>Last synced</span>
                    <motion.span 
                      className="font-medium"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {new Date(account.lastSyncAt).toLocaleTimeString()}
                    </motion.span>
                  </div>

                  {/* Progress Ring - Decorative */}
                  <div className="absolute top-4 right-4 w-16 h-16 opacity-5">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        className={`${account.isActive ? 'text-green-500' : 'text-slate-300'}`}
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

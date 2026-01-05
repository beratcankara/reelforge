import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Info, AlertTriangle, Terminal, Filter } from 'lucide-react';

export default function Logs() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs', selectedLevel],
    queryFn: async () => {
      const response = await apiClient.get('/logs', {
        params: selectedLevel !== 'all' ? { level: selectedLevel } : {},
      });
      return response.data.logs;
    },
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'error':
        return {
          gradient: 'from-red-500 to-pink-500',
          bg: 'from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20',
          text: 'text-red-600',
          border: 'border-red-200 dark:border-red-800',
        };
      case 'warning':
        return {
          gradient: 'from-yellow-500 to-orange-500',
          bg: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
          text: 'text-yellow-600',
          border: 'border-yellow-200 dark:border-yellow-800',
        };
      default:
        return {
          gradient: 'from-blue-500 to-cyan-500',
          bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
          text: 'text-blue-600',
          border: 'border-blue-200 dark:border-blue-800',
        };
    }
  };

  const levelFilters = [
    { value: 'all', label: 'All Logs', gradient: 'from-purple-500 to-pink-500' },
    { value: 'info', label: 'Info', gradient: 'from-blue-500 to-cyan-500' },
    { value: 'warning', label: 'Warning', gradient: 'from-yellow-500 to-orange-500' },
    { value: 'error', label: 'Error', gradient: 'from-red-500 to-pink-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
            <Terminal className="w-10 h-10" style={{ color: '#9333EA' }} />
            System Logs
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor system activity and errors in real-time 📝
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          {levelFilters.map((filter, index) => (
            <motion.button
              key={filter.value}
              onClick={() => setSelectedLevel(filter.value)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all ${
                selectedLevel === filter.value
                  ? 'text-white shadow-lg'
                  : 'text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/70'
              }`}
            >
              {selectedLevel === filter.value && (
                <motion.div
                  layoutId="activeLogFilter"
                  className={`absolute inset-0 bg-gradient-to-r ${filter.gradient} rounded-xl`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{filter.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent"
          />
        </div>
      )}

      {/* Logs List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-3"
        >
          {logsData?.map((log: any, index: number) => {
            const config = getLevelConfig(log.level);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 10, scale: 1.01 }}
                className="relative group"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity`} />
                
                <div className={`relative rounded-2xl backdrop-blur-xl bg-gradient-to-r ${config.bg} border ${config.border} p-5 shadow-lg`}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      className={`mt-1 ${config.text}`}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {getLevelIcon(log.level)}
                    </motion.div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <motion.span
                          className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${config.gradient} text-white shadow-lg`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {log.level.toUpperCase()}
                        </motion.span>
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                          {log.source}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Message */}
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                        {log.message}
                      </p>
                      
                      {/* Details */}
                      {log.details && (
                        <details className="group/details">
                          <summary className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 select-none">
                            <Filter className="w-3 h-3" />
                            View technical details
                            <motion.span
                              className="inline-block"
                              animate={{ rotate: 0 }}
                              whileHover={{ rotate: 90 }}
                            >
                              →
                            </motion.span>
                          </summary>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3"
                          >
                            <pre className="text-xs bg-slate-900 dark:bg-black text-green-400 p-4 rounded-xl overflow-x-auto font-mono shadow-inner">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </motion.div>
                        </details>
                      )}
                    </div>

                    {/* Pulse Animation for Recent Logs */}
                    {index < 3 && (
                      <motion.div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient}`}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {logsData?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Terminal className="h-20 w-20 text-slate-300 mx-auto mb-4" />
          </motion.div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            No logs found for this filter
          </p>
        </motion.div>
      )}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { motion } from 'framer-motion';
import { Play, Pause, CheckCircle, XCircle, Clock, Zap, Activity } from 'lucide-react';

export default function Workflows() {
  const queryClient = useQueryClient();

  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await apiClient.get('/workflows');
      return response.data.workflows;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await apiClient.post(`/workflows/${workflowId}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const workflowGradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Workflow Automation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your n8n automation workflows ⚡
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Active Workflows', value: workflowsData?.filter((w: any) => w.isActive).length || 0, icon: Activity, color: 'from-green-500 to-emerald-500' },
          { label: 'Total Executions', value: workflowsData?.reduce((sum: number, w: any) => sum + (w.executions?.total || 0), 0) || 0, icon: Zap, color: 'from-blue-500 to-cyan-500' },
          { label: 'Success Rate', value: '95.8%', icon: CheckCircle, color: 'from-purple-500 to-pink-500' },
          { label: 'Running', value: workflowsData?.filter((w: any) => w.isActive).length || 0, icon: Play, color: 'from-orange-500 to-red-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className={`absolute -inset-1 bg-gradient-to-r ${stat.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity`} />
              <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
                <Icon className={`w-8 h-8 mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Workflows List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {workflowsData?.map((workflow: any, index: number) => {
            const gradient = workflowGradients[index % workflowGradients.length];
            const successRate = workflow.executions?.total 
              ? ((workflow.executions.successful / workflow.executions.total) * 100).toFixed(1)
              : 0;

            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 10, scale: 1.01 }}
                className="relative group"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity`} />
                
                <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    {/* Workflow Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Activity className="w-6 h-6 text-white" />
                        </motion.div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {workflow.name}
                            </h3>
                            <motion.span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                workflow.isActive
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                              animate={workflow.isActive ? { scale: [1, 1.05, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {workflow.isActive ? '● Active' : '○ Inactive'}
                            </motion.span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(workflow.lastRunStatus)}
                              <span className="font-medium">Last run: {workflow.lastRunStatus}</span>
                            </div>
                            <span className="text-xs opacity-75">
                              {new Date(workflow.lastRunAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                        >
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {workflow.executions?.total || 0}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
                        </motion.div>
                        
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                        >
                          <div className="text-2xl font-bold text-green-600">
                            {workflow.executions?.successful || 0}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Success</div>
                        </motion.div>
                        
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="text-center p-3 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20"
                        >
                          <div className="text-2xl font-bold text-red-600">
                            {workflow.executions?.failed || 0}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Failed</div>
                        </motion.div>

                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className={`text-center p-3 rounded-xl bg-gradient-to-br ${gradient}`}
                        >
                          <div className="text-2xl font-bold text-white">
                            {successRate}%
                          </div>
                          <div className="text-xs text-white/80">Rate</div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <motion.button
                      onClick={() => toggleMutation.mutate(workflow.workflowId)}
                      disabled={toggleMutation.isPending}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`ml-6 flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-white shadow-2xl transition-all ${
                        workflow.isActive
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      }`}
                    >
                      {workflow.isActive ? (
                        <>
                          <Pause className="h-5 w-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Activate
                        </>
                      )}
                    </motion.button>
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

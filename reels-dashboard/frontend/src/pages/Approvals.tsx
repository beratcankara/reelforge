import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Play, Calendar, Hash, X, Sparkles, Zap, Music } from 'lucide-react';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

export default function Approvals() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['approvals', selectedStatus],
    queryFn: async () => {
      const response = await apiClient.get('/approvals', {
        params: selectedStatus !== 'all' ? { status: selectedStatus } : {},
      });
      return response.data.approvals;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/approvals/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      setSelectedReel(null);
      toast.success('🎉 Reel approved successfully!', {
        style: {
          borderRadius: '12px',
          background: '#10B981',
          color: '#fff',
        },
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.post(`/approvals/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      setSelectedReel(null);
      toast.error('Reel rejected', {
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'from-yellow-400 to-orange-400';
      case 'approved':
        return 'from-green-400 to-emerald-400';
      case 'rejected':
        return 'from-red-400 to-pink-400';
      default:
        return 'from-gray-400 to-slate-400';
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All', icon: Sparkles, gradient: 'from-purple-500 to-pink-500' },
    { value: 'pending', label: 'Pending', icon: Clock, gradient: 'from-yellow-500 to-orange-500' },
    { value: 'approved', label: 'Approved', icon: CheckCircle, gradient: 'from-green-500 to-emerald-500' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, gradient: 'from-red-500 to-pink-500' },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Reel Approvals
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Review and approve AI-generated Instagram Reels 🎬
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3">
            {statusFilters.map((filter, index) => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    selectedStatus === filter.value
                      ? 'text-white shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/70'
                  }`}
                >
                  {selectedStatus === filter.value && (
                    <motion.div
                      layoutId="activeFilter"
                      className={`absolute inset-0 bg-gradient-to-r ${filter.gradient} rounded-xl`}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </span>
                </motion.button>
              );
            })}
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

        {/* Reels Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStatus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {approvalsData?.map((approval: any, index: number) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => setSelectedReel(approval)}
                className="group relative cursor-pointer"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${getStatusColor(approval.status)} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                
                <div className="relative rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/50 overflow-hidden shadow-xl">
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-slate-800 dark:to-slate-900">
                    <img
                      src={approval.thumbnailUrl}
                      alt="Reel thumbnail"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl"
                      >
                        <Play className="h-8 w-8 text-purple-600 ml-1" />
                      </motion.div>
                    </div>

                    {/* Status Badge */}
                    <motion.div 
                      className="absolute top-3 right-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold text-white bg-gradient-to-r ${getStatusColor(approval.status)} shadow-lg backdrop-blur-sm`}>
                        {approval.status === 'pending' && '⏳'}
                        {approval.status === 'approved' && '✓'}
                        {approval.status === 'rejected' && '✕'}
                        {' '}{approval.status}
                      </span>
                    </motion.div>

                    {/* Duration */}
                    <div className="absolute bottom-3 left-3 text-white text-xs font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                      {approval.metadata?.duration}s
                    </div>

                    {/* Priority Badge */}
                    {approval.priority > 0 && (
                      <motion.div 
                        className="absolute top-3 left-3"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <p className="text-sm line-clamp-2 text-slate-700 dark:text-slate-300 font-medium">
                      {approval.caption}
                    </p>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1.5">
                      {approval.hashtags?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg font-medium">
                          #{tag}
                        </span>
                      ))}
                      {approval.hashtags?.length > 3 && (
                        <span className="text-xs text-slate-500 px-2 py-1">
                          +{approval.hashtags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Music */}
                    {approval.musicTrack && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Music className="h-3 w-3" />
                        <span className="truncate">{approval.musicTrack}</span>
                      </div>
                    )}

                    {/* Scheduled Time */}
                    {approval.scheduledFor && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(approval.scheduledFor), 'MMM d, HH:mm')}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {approval.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(approval.id);
                          }}
                          disabled={approveMutation.isPending}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(approval.id);
                          }}
                          disabled={rejectMutation.isPending}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </motion.button>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {approval.status === 'rejected' && approval.rejectionReason && (
                      <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
                        <strong>Reason:</strong> {approval.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {approvalsData?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="h-20 w-20 text-slate-300 mx-auto mb-4" />
            </motion.div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No reels found for this status
            </p>
          </motion.div>
        )}

        {/* Video Preview Modal */}
        <AnimatePresence>
          {selectedReel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedReel(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="p-8 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Reel Preview
                    </h2>
                    <motion.button
                      onClick={() => setSelectedReel(null)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Video Player */}
                  <motion.video
                    src={selectedReel.videoUrl}
                    controls
                    autoPlay
                    className="w-full rounded-xl shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  />

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <h3 className="font-bold text-lg mb-2">Caption</h3>
                      <p className="text-slate-700 dark:text-slate-300">{selectedReel.caption}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-lg mb-3">Hashtags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedReel.hashtags?.map((tag: string) => (
                          <span key={tag} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedReel.musicTrack && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                          <Music className="w-5 h-5" />
                          Music Track
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300">{selectedReel.musicTrack}</p>
                      </div>
                    )}

                    {/* Action Buttons in Modal */}
                    {selectedReel.status === 'pending' && (
                      <div className="flex gap-4 pt-4">
                        <motion.button
                          onClick={() => handleApprove(selectedReel.id)}
                          disabled={approveMutation.isPending}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="h-6 w-6" />
                          Approve & Post
                        </motion.button>
                        <motion.button
                          onClick={() => handleReject(selectedReel.id)}
                          disabled={rejectMutation.isPending}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-6 w-6" />
                          Reject
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

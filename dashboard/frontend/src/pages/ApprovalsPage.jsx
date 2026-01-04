import { useEffect, useState } from 'react';
import { approvalsAPI, videoAPI } from '../services/api';

function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadApprovals();
  }, [filter]);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await approvalsAPI.list({ status: filter, limit: 50 });
      setApprovals(response.data.data);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setIsProcessing(true);
    try {
      await approvalsAPI.approve(id, 'admin');
      setApprovals(approvals.filter((a) => a.id !== id));
      setSelectedApproval(null);
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id, notes = '') => {
    setIsProcessing(true);
    try {
      await approvalsAPI.reject(id, 'admin', notes);
      setApprovals(approvals.filter((a) => a.id !== id));
      setSelectedApproval(null);
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approval Queue</h2>
          <p className="text-gray-400 mt-1">Review and approve videos before posting</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === status
                  ? 'bg-brand-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No {filter} approvals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {approvals.map((approval) => (
            <div key={approval.id} className="card">
              {/* Video Preview */}
              <div className="video-preview mb-4">
                <video
                  src={videoAPI.stream(approval.id)}
                  controls
                  className="w-full h-full"
                  poster={videoAPI.thumbnail(approval.id)}
                />
              </div>

              {/* Account Info */}
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-info">@{approval.account_username}</span>
                <span className="badge badge-warning capitalize">{approval.account_theme}</span>
              </div>

              {/* Caption */}
              <div className="mb-3">
                <p className="text-sm text-gray-300 line-clamp-3">{approval.caption}</p>
              </div>

              {/* Hashtags */}
              <div className="mb-4">
                <p className="text-xs text-brand-400">{approval.hashtags}</p>
              </div>

              {/* Actions */}
              {approval.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={isProcessing}
                    className="flex-1 btn btn-success disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Rejection reason (optional):');
                      if (notes !== null) handleReject(approval.id, notes);
                    }}
                    disabled={isProcessing}
                    className="flex-1 btn btn-danger disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-500 mt-3">
                {new Date(approval.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalsPage;

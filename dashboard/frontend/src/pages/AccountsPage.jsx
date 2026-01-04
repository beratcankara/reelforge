import { useEffect, useState } from 'react';
import { accountsAPI } from '../services/api';

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newAccount, setNewAccount] = useState({
    username: '',
    access_token: '',
    content_theme: 'entertainment',
    posting_timezone: 'America/New_York',
    optimal_posting_time: '09:00',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await accountsAPI.list();
      setAccounts(response.data.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await accountsAPI.create(newAccount);
      setShowAddModal(false);
      setNewAccount({
        username: '',
        access_token: '',
        content_theme: 'entertainment',
        posting_timezone: 'America/New_York',
        optimal_posting_time: '09:00',
      });
      loadAccounts();
    } catch (error) {
      alert('Failed to add account: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggle = async (id) => {
    try {
      await accountsAPI.toggle(id);
      loadAccounts();
    } catch (error) {
      alert('Failed to toggle account: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Are you sure you want to delete @${username}?`)) return;

    try {
      await accountsAPI.delete(id);
      loadAccounts();
    } catch (error) {
      alert('Failed to delete account: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instagram Accounts</h2>
          <p className="text-gray-400 mt-1">Manage connected Instagram accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + Add Account
        </button>
      </div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No Instagram accounts connected</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Account</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Theme</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Timezone</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Post Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-dark-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {account.username[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">@{account.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge badge-info capitalize">{account.content_theme}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{account.posting_timezone}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{account.optimal_posting_time}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(account.id)}
                      className="flex items-center gap-2"
                    >
                      <div className={`status-dot ${account.is_active ? 'active' : 'inactive'}`} />
                      <span className="text-sm">{account.is_active ? 'Active' : 'Paused'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(account.id, account.username)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add Instagram Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  className="input"
                  placeholder="@username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={newAccount.access_token}
                  onChange={(e) => setNewAccount({ ...newAccount, access_token: e.target.value })}
                  className="input"
                  placeholder="Instagram access token"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Theme
                </label>
                <select
                  value={newAccount.content_theme}
                  onChange={(e) => setNewAccount({ ...newAccount, content_theme: e.target.value })}
                  className="input"
                >
                  <option value="humor">Humor</option>
                  <option value="storytelling">Storytelling</option>
                  <option value="motivation">Motivation</option>
                  <option value="entertainment">Entertainment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={newAccount.posting_timezone}
                    onChange={(e) => setNewAccount({ ...newAccount, posting_timezone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Post Time
                  </label>
                  <input
                    type="time"
                    value={newAccount.optimal_posting_time}
                    onChange={(e) => setNewAccount({ ...newAccount, optimal_posting_time: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsPage;

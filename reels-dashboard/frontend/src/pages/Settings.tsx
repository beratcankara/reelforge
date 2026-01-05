import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Save, Clock, Bell, Workflow } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('posting');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings');
      return response.data.settings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const response = await apiClient.put(`/settings/${key}`, { value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const postingSettings = settingsData?.find((s: any) => s.key === 'posting_schedule');
  const workflowSettings = settingsData?.find((s: any) => s.key === 'auto_approval');
  const notificationSettings = settingsData?.find((s: any) => s.key === 'notifications');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure dashboard preferences</p>
      </div>

      <div className="flex gap-2 border-b">
        {[
          { id: 'posting', label: 'Posting', icon: Clock },
          { id: 'workflow', label: 'Workflow', icon: Workflow },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'posting' && postingSettings && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Posting Schedule</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Scheduled Posting</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically post approved reels at scheduled times
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={postingSettings.value.enabled}
                    className="w-5 h-5"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <input
                    type="text"
                    value={postingSettings.value.timezone}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Times</label>
                  <div className="flex gap-2">
                    {postingSettings.value.preferredTimes?.map((time: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-muted rounded">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && workflowSettings && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Workflow Automation</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Approval</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically approve reels above quality threshold
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={workflowSettings.value.enabled}
                    className="w-5 h-5"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Quality Score
                  </label>
                  <input
                    type="number"
                    value={workflowSettings.value.minQualityScore}
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    readOnly
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Current: {(workflowSettings.value.minQualityScore * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && notificationSettings && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              
              <div className="space-y-3">
                {Object.entries(notificationSettings.value).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      className="w-5 h-5"
                      readOnly
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium opacity-50 cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              Save Changes (Read-only in mock mode)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

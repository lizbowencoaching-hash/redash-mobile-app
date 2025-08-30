import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface NotificationSettingsProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

function NotificationSettings({ user, isOpen, onClose }: NotificationSettingsProps) {
  const [monthlyReminderEnabled, setMonthlyReminderEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadNotificationSettings();
    }
  }, [isOpen]);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const enabled = await notificationService.isMonthlyReminderEnabled();
      setMonthlyReminderEnabled(enabled);
    } catch (err) {
      console.error('Error loading notification settings:', err);
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReminderToggle = async (enabled: boolean) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (enabled) {
        await notificationService.scheduleMonthlyReminder(user.id);
        setSuccess('Monthly reminders enabled! You\'ll receive notifications on the 1st of each month.');
      } else {
        await notificationService.cancelMonthlyReminder();
        setSuccess('Monthly reminders disabled.');
      }

      setMonthlyReminderEnabled(enabled);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating monthly reminder:', err);
      setError('Failed to update notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Notification Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm flex items-center">
            <Check className="w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Monthly Reminder Setting */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  {monthlyReminderEnabled ? (
                    <Bell className="w-5 h-5 text-teal-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Monthly Reminders</h3>
                  <p className="text-sm text-gray-600">
                    Get reminded on the 1st of each month to update your transaction status
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleMonthlyReminderToggle(!monthlyReminderEnabled)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  monthlyReminderEnabled ? 'bg-teal-600' : 'bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    monthlyReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Information Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">About Notifications</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Monthly reminders help you stay on top of your goals</li>
                <li>• Notifications are sent at 9 AM on the 1st of each month</li>
                <li>• You can disable them anytime from this screen</li>
                <li>• Notifications work even when the app is closed</li>
              </ul>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationSettings;

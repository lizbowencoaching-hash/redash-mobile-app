import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Request permissions for local notifications
      const localPermission = await LocalNotifications.requestPermissions();
      console.log('Local notification permission:', localPermission);

      // Request permissions for push notifications
      const pushPermission = await PushNotifications.requestPermissions();
      console.log('Push notification permission:', pushPermission);

      if (pushPermission.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
      }

      // Set up push notification listeners
      this.setupPushNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  private setupPushNotificationListeners(): void {
    // Called when the app is opened via a push notification
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    // Called when a push notification is tapped
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
      // You could navigate to specific screens based on notification data
    });

    // Called when registration is successful
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      // Store the token for sending push notifications from your backend
      this.storePushToken(token.value);
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });
  }

  private async storePushToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_token',
        value: token
      });
      console.log('Push token stored successfully');
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  async scheduleMonthlyReminder(userId: string): Promise<void> {
    try {
      // Cancel any existing monthly reminders
      await this.cancelMonthlyReminder();

      // Calculate next month's notification date (1st of next month at 9 AM)
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
      
      console.log('Scheduling monthly reminder for:', nextMonth);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'REDash Reminder',
            body: 'Time to update your transaction status! Keep your goals on track.',
            id: 1001, // Unique ID for monthly reminder
            schedule: {
              at: nextMonth,
              repeats: true,
              every: 'month'
            },
            sound: 'default',
            actionTypeId: 'TRANSACTION_REMINDER',
            extra: {
              type: 'monthly_reminder',
              user_id: userId
            }
          }
        ]
      });

      // Store the reminder preference
      await Preferences.set({
        key: 'monthly_reminder_enabled',
        value: 'true'
      });

      console.log('Monthly reminder scheduled successfully');
    } catch (error) {
      console.error('Error scheduling monthly reminder:', error);
      throw error;
    }
  }

  async cancelMonthlyReminder(): Promise<void> {
    try {
      // Cancel the specific monthly reminder notification
      await LocalNotifications.cancel({
        notifications: [{ id: 1001 }]
      });

      // Update preference
      await Preferences.set({
        key: 'monthly_reminder_enabled',
        value: 'false'
      });

      console.log('Monthly reminder cancelled');
    } catch (error) {
      console.error('Error cancelling monthly reminder:', error);
    }
  }

  async isMonthlyReminderEnabled(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: 'monthly_reminder_enabled' });
      return value === 'true';
    } catch (error) {
      console.error('Error checking monthly reminder status:', error);
      return false;
    }
  }

  async scheduleTransactionStatusReminder(transactionId: string, address: string, daysFromNow: number = 7): Promise<void> {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + daysFromNow);
      reminderDate.setHours(10, 0, 0, 0); // 10 AM

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Transaction Status Update',
            body: `Don't forget to check the status of ${address}`,
            id: parseInt(transactionId.replace(/\D/g, '').slice(-8)) || Math.floor(Math.random() * 1000000), // Convert UUID to number
            schedule: {
              at: reminderDate
            },
            sound: 'default',
            actionTypeId: 'TRANSACTION_STATUS_UPDATE',
            extra: {
              type: 'transaction_reminder',
              transaction_id: transactionId,
              address: address
            }
          }
        ]
      });

      console.log(`Transaction reminder scheduled for ${address} on ${reminderDate}`);
    } catch (error) {
      console.error('Error scheduling transaction reminder:', error);
    }
  }

  async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();

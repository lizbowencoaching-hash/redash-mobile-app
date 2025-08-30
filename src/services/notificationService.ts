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
      console.log('Notification service initialized (notifications disabled for iOS build compatibility)');

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  private setupPushNotificationListeners(): void {
    console.log('Push notification listeners disabled for iOS build compatibility');
  }

  private async storePushToken(token: string): Promise<void> {
    try {
      console.log('Push token storage disabled for iOS build compatibility');
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  async scheduleMonthlyReminder(userId: string): Promise<void> {
    try {
      console.log('Monthly reminders disabled for iOS build compatibility');
      return { success: true, message: 'Notifications are not available in this build' };
    } catch (error) {
      console.error('Error scheduling monthly reminder:', error);
      throw error;
    }
  }

  async cancelMonthlyReminder(): Promise<void> {
    try {
      console.log('Monthly reminder cancellation disabled for iOS build compatibility');
    } catch (error) {
      console.error('Error cancelling monthly reminder:', error);
    }
  }

  async isMonthlyReminderEnabled(): Promise<boolean> {
    try {
      return false; // Notifications disabled for iOS build compatibility
    } catch (error) {
      console.error('Error checking monthly reminder status:', error);
      return false;
    }
  }

  async scheduleTransactionStatusReminder(transactionId: string, address: string, daysFromNow: number = 7): Promise<void> {
    try {
      console.log('Transaction reminders disabled for iOS build compatibility');
    } catch (error) {
      console.error('Error scheduling transaction reminder:', error);
    }
  }

  async getPendingNotifications(): Promise<any[]> {
    try {
      return []; // No notifications available in this build
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();

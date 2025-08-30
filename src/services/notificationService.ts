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
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Notification service initialized (web version - no native notifications)');
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  async scheduleMonthlyReminder(userId: string): Promise<void> {
    try {
      console.log('Monthly reminders not available in web version');
      // Store preference in localStorage for web compatibility
      localStorage.setItem('monthlyReminderEnabled', 'true');
    } catch (error) {
      console.error('Error scheduling monthly reminder:', error);
      throw error;
    }
  }

  async cancelMonthlyReminder(): Promise<void> {
    try {
      console.log('Cancelling monthly reminder (web version)');
      localStorage.setItem('monthlyReminderEnabled', 'false');
    } catch (error) {
      console.error('Error cancelling monthly reminder:', error);
    }
  }

  async isMonthlyReminderEnabled(): Promise<boolean> {
    try {
      const enabled = localStorage.getItem('monthlyReminderEnabled') === 'true';
      return enabled;
    } catch (error) {
      console.error('Error checking monthly reminder status:', error);
      return false;
    }
  }

  async scheduleTransactionStatusReminder(transactionId: string, address: string, daysFromNow: number = 7): Promise<void> {
    try {
      console.log('Transaction reminders not available in web version');
    } catch (error) {
      console.error('Error scheduling transaction reminder:', error);
    }
  }

  async getPendingNotifications(): Promise<any[]> {
    try {
      return []; // No notifications available in web version
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();

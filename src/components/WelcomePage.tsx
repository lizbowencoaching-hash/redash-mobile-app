import React from 'react';
import { Target, FileText, Bell } from 'lucide-react';
import NotificationSettings from './NotificationSettings';

interface WelcomePageProps {
  userName: string;
  userFullName?: string;
  goalsCreated: boolean;
  hasTransactions?: boolean;
  onGoalsClick: () => void;
  onAddGoals: () => void;
  onTransactionsClick: () => void;
  onAddTransaction: () => void;
  onLogOut: () => void;
  onShowImageCleaner?: () => void;
  user?: any;
}

function WelcomePage({ userName, userFullName, goalsCreated, hasTransactions = false, onGoalsClick, onAddGoals, onTransactionsClick, onAddTransaction, onLogOut, onShowImageCleaner, user }: WelcomePageProps) {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  return (
    <>
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div></div>
        <div className="flex space-x-6">
          <button 
            onClick={onTransactionsClick}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Transactions
          </button>
          <button 
            onClick={onGoalsClick}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Goals
          </button>
          <button 
            onClick={() => setShowNotificationSettings(true)}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
        <div>
          <button 
            onClick={onLogOut}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* User Profile Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Let's Get Tracking
          </h1>
        </div>

        {/* Steps Section */}
        <div className="space-y-6">
          {/* Step 1 - Goals */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Step 1 - Set up your annual goals
              </h3>
            </div>
            <button
              onClick={onAddGoals}
              className={`${goalsCreated ? 'bg-gray-600 hover:bg-gray-700' : 'bg-teal-600 hover:bg-teal-700'} text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2`}
            >
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </button>
          </div>

          {/* Step 2 - Transactions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Step 2 - Enter your transactions
              </h3>
              <p className="text-sm text-gray-600">
                If you don't have any active, under contract or closed transactions for this year, skip this step.
              </p>
            </div>
            <button
              onClick={onAddTransaction}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Transactions</span>
            </button>
          </div>

          {/* Step 3 - Completion */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Step 3 - Set up complete!
              </h3>
              <p className="text-sm text-gray-600">
                You're all set! Use the links at the top of this page to navigate to your Transactions or Goals Dashboards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notification Settings Modal */}
    <NotificationSettings
      user={user}
      isOpen={showNotificationSettings}
      onClose={() => setShowNotificationSettings(false)}
    />
    </>
  );
}

export default WelcomePage;

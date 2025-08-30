import React, { useState, useEffect } from 'react';
import { Home, Search, Menu, TrendingUp, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { notificationService } from './services/notificationService';
import WelcomePage from './components/WelcomePage';
import GoalEntryModal from './components/GoalEntryModal';
import TransactionEntryModal from './components/TransactionEntryModal';
import TransactionsScreen from './components/TransactionsScreen';
import GoalsScreen from './components/GoalsScreen';
import ImageUrlCleaner from './components/ImageUrlCleaner';
import { Goal } from './lib/supabase';

const ENCOURAGING_MESSAGES = [
  "Starting your journey to success!",
  "You're making great progress!",
  "You're almost there!"
];

function App() {
  const [progress, setProgress] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [currentEncouragingMessage, setCurrentEncouragingMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [userName, setUserName] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [goalsCreated, setGoalsCreated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [loginRetryAttempt, setLoginRetryAttempt] = useState(0);
  const [showImageCleaner, setShowImageCleaner] = useState(false);
  const [selectedGoalYear, setSelectedGoalYear] = useState<number>(new Date().getFullYear());
  const [transactionListRefreshKey, setTransactionListRefreshKey] = useState(0);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loginFormData, setLoginFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Check for existing session on app load
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
        setUserFullName(session.user.user_metadata?.full_name || '');
        
        // Initialize notification service for authenticated users
        try {
          await notificationService.initialize();
        } catch (error) {
          console.error('Error initializing notifications:', error);
        }
        
        // Check if user has transactions to determine which page to show
        checkUserTransactions(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, 'justSignedUp:', justSignedUp);
        setUser(session?.user ?? null);
        if (session?.user) {
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
          setUserFullName(session.user.user_metadata?.full_name || '');
          
          // Initialize notification service for authenticated users
          try {
            await notificationService.initialize();
          } catch (error) {
            console.error('Error initializing notifications:', error);
          }
          
          if (event === 'SIGNED_UP') {
            console.log('SIGNED_UP event - directing to welcome page');
            setJustSignedUp(true);
            checkUserTransactions(session.user.id);
          } else if (event === 'SIGNED_IN') {
            // Only go to goals dashboard if this is a regular login (not after signup)
            if (!justSignedUp) {
              console.log('SIGNED_IN event (regular login) - directing to goals dashboard');
              setCurrentPage('goals');
            } else {
              console.log('SIGNED_IN event (after signup) - staying on welcome page');
            }
          }
          
          // Reset the justSignedUp flag after handling the auth event
          if (justSignedUp) {
            setTimeout(() => {
              console.log('Resetting justSignedUp flag');
              setJustSignedUp(false);
            }, 1000); // Small delay to ensure all auth events are processed
          }
        } else {
          setCurrentPage('home');
          setUserName('');
          setUserFullName('');
          setGoalsCreated(false);
          setHasTransactions(false);
          setJustSignedUp(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check if user has transactions
  const checkUserTransactions = async (userId: string) => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!error) {
        const hasTransactionsData = transactions && transactions.length > 0;
        setHasTransactions(hasTransactionsData);
        setCurrentPage('welcome');
      } else {
        setCurrentPage('welcome'); // Default to welcome if error
      }
    } catch (error) {
      console.error('Error checking transactions:', error);
      setCurrentPage('welcome'); // Default to welcome if error
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true);
      setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[0]);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animationStarted) {
      // First step: 1/3 progress after 1 second
      const timer1 = setTimeout(() => {
        setProgress(33.33);
      }, 1000);

      // Second step: 2/3 progress after 2 seconds
      const timer2 = setTimeout(() => {
        setProgress(66.66);
        setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[1]);
      }, 2000);

      // Third step: 85% progress (in green section) after 3 seconds
      const timer3 = setTimeout(() => {
        setProgress(85);
        setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[2]);
      }, 3000);

      // Reset and loop after 6 seconds
      const timer4 = setTimeout(() => {
        setProgress(0);
        setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[0]);
        
        // Start the cycle again after a brief pause
        const loopTimer = setTimeout(() => {
          // Restart the animation cycle
          const loop1 = setTimeout(() => {
            setProgress(33.33);
          }, 1000);

          const loop2 = setTimeout(() => {
            setProgress(66.66);
            setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[1]);
          }, 2000);

          const loop3 = setTimeout(() => {
            setProgress(85);
            setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[2]);
          }, 3000);

          // Continue the loop
          const continueLoop = () => {
            setTimeout(() => {
              setProgress(0);
              setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[0]);
              
              setTimeout(() => {
                const nextLoop1 = setTimeout(() => setProgress(33.33), 1000);
                const nextLoop2 = setTimeout(() => {
                  setProgress(66.66);
                  setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[1]);
                }, 2000);
                const nextLoop3 = setTimeout(() => {
                  setProgress(85);
                  setCurrentEncouragingMessage(ENCOURAGING_MESSAGES[2]);
                }, 3000);
                
                setTimeout(continueLoop, 6000);
              }, 500);
            }, 3000);
          };
          
          setTimeout(continueLoop, 6000);
        }, 500);
      }, 6000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [animationStarted]);

  const handleStartTracking = () => {
    setShowModal(true);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', email: '', password: '' });
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setLoginError('');
    setLoginFormData({ name: '', email: '', password: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });

      if (error) {
        alert(`Signup error: ${error.message}`);
        return;
      }

      if (data.user) {
        alert('Account created successfully! You are now logged in.');
        setJustSignedUp(true);
        setUserName(formData.name);
        setUserFullName(formData.name);
        setCurrentPage('welcome');
        handleCloseModal();
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred during signup. Please try again.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginRetryAttempt(0);
    
    // Utility function to retry Supabase operations
    const retrySupabaseOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 500) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setLoginRetryAttempt(attempt);
        try {
          console.log(`Login attempt ${attempt}/${maxRetries}`);
          const result = await operation();
          
          if (!result.error) {
            console.log(`Login succeeded on attempt ${attempt}`);
            setLoginRetryAttempt(0);
            return result;
          }
          
          // Log detailed error information
          console.error(`Login attempt ${attempt} failed:`, {
            error: result.error,
            message: result.error?.message,
            details: result.error?.details,
            hint: result.error?.hint,
            code: result.error?.code
          });
          
          // Check if it's a retryable error
          const isRetryable = isRetryableError(result.error);
          if (!isRetryable || attempt === maxRetries) {
            setLoginRetryAttempt(0);
            return result;
          }
          
          // Wait before retrying
          if (attempt < maxRetries) {
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (networkError) {
          console.error(`Network error on login attempt ${attempt}:`, networkError);
          
          if (attempt === maxRetries) {
            setLoginRetryAttempt(0);
            return { error: { message: `Network error after ${maxRetries} attempts: ${networkError.message}` } };
          }
          
          // Wait before retrying network errors
          if (attempt < maxRetries) {
            console.log(`Network error - waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    };

    // Check if an error is retryable
    const isRetryableError = (error: any) => {
      if (!error) return false;
      
      const retryableMessages = [
        'load failed',
        'network',
        'timeout',
        'connection',
        'fetch',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND'
      ];
      
      const errorMessage = error.message?.toLowerCase() || '';
      return retryableMessages.some(msg => errorMessage.includes(msg));
    };

    try {
      const result = await retrySupabaseOperation(async () => {
        return await supabase.auth.signInWithPassword({
          email: loginFormData.email,
          password: loginFormData.password,
        });
      });

      if (result.error) {
        console.error('Final login error after all retries:', result.error);
        
        if (result.error.message === 'Invalid login credentials') {
          setLoginError('Invalid email or password. Please check your credentials and try again, or sign up if you don\'t have an account.');
        } else if (result.error.message?.toLowerCase().includes('load failed')) {
          setLoginError('Network connection failed. Please check your internet connection and try again. If the problem persists, try switching between WiFi and cellular data.');
        } else {
          setLoginError(`Login error: ${result.error.message}. Please check your internet connection and try again.`);
        }
        return;
      }

      if (result.data.user) {
        setUserName(result.data.user.user_metadata?.full_name || loginFormData.name || result.data.user.email?.split('@')[0] || 'User');
        setUserFullName(result.data.user.user_metadata?.full_name || loginFormData.name || '');
        setCurrentPage('goals'); // Ensure login goes to goals dashboard
        handleCloseLoginModal();
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLoginError(`Unexpected error: ${errorMessage}. Please check your internet connection and try again.`);
    } finally {
      setLoginRetryAttempt(0);
    }
  };

  const handleGoalsClick = () => {
    setCurrentPage('goals');
  };

  const handleTransactionsClick = () => {
    setCurrentPage('transactions');
  };

  const handleLogOut = async () => {
    const retrySupabaseOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 500) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Logout attempt ${attempt}/${maxRetries}`);
          const result = await operation();
          
          if (!result.error) {
            console.log(`Logout succeeded on attempt ${attempt}`);
            return result;
          }
          
          // Log detailed error information
          console.error(`Logout attempt ${attempt} failed:`, {
            error: result.error,
            message: result.error?.message,
            details: result.error?.details,
            hint: result.error?.hint,
            code: result.error?.code
          });
          
          // Check if it's a retryable error
          const isRetryable = isRetryableError(result.error);
          if (!isRetryable || attempt === maxRetries) {
            return result;
          }
          
          // Wait before retrying
          if (attempt < maxRetries) {
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (networkError) {
          console.error(`Network error on logout attempt ${attempt}:`, networkError);
          
          if (attempt === maxRetries) {
            return { error: { message: `Network error after ${maxRetries} attempts: ${networkError.message}` } };
          }
          
          // Wait before retrying network errors
          if (attempt < maxRetries) {
            console.log(`Network error - waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    };

    // Check if an error is retryable
    const isRetryableError = (error: any) => {
      if (!error) return false;
      
      const retryableMessages = [
        'load failed',
        'network',
        'timeout',
        'connection',
        'fetch',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND'
      ];
      
      const errorMessage = error.message?.toLowerCase() || '';
      return retryableMessages.some(msg => errorMessage.includes(msg));
    };

    try {
      const result = await retrySupabaseOperation(async () => {
        return await supabase.auth.signOut();
      });

      if (result.error) {
        console.error('Final logout error after all retries:', result.error);
        
        if (result.error.message?.toLowerCase().includes('load failed')) {
          alert('Logout failed due to network connection. Please check your internet connection and try again. If the problem persists, try switching between WiFi and cellular data.');
        } else {
          alert(`Logout error: ${result.error.message}. Please check your internet connection and try again.`);
        }
        return;
      }
      
      setCurrentPage('home');
      setUserName('');
      setUserFullName('');
      setGoalsCreated(false);
      setFormData({ name: '', email: '', password: '' });
      setLoginFormData({ name: '', email: '', password: '' });
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Unexpected logout error: ${errorMessage}. Please check your internet connection and try again.`);
    }
  };

  const handleDashboardClick = () => {
    setCurrentPage('welcome');
  };

  const handleAddTransactionClick = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransactionClick = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleGoalSubmit = (goalData: any) => {
    console.log('Goal data submitted:', goalData);
    setGoalsCreated(true);
    setShowGoalModal(false);
    // Force Goals screen to refresh by incrementing the key
    setGoalsRefreshKey(prev => prev + 1);
  };

  const handleTransactionSubmit = (transactionData: any) => {
    console.log('Transaction data submitted:', transactionData);
    if (editingTransaction) {
      console.log('Updating existing transaction');
    } else {
      console.log('Creating new transaction');
      setHasTransactions(true);
    }
    setShowTransactionModal(false);
    setEditingTransaction(null);
    // Force TransactionsScreen to refresh by incrementing the key
    setTransactionListRefreshKey(prev => prev + 1);
  };

  const handleAddGoalsClick = () => {
    setEditingGoal(null);
    // When adding goals from GoalsScreen, use the selected year from that screen
    setShowGoalModal(true);
  };

  const handleEditGoalsClick = (goal: Goal) => {
    setEditingGoal(goal);
    // When editing, extract year from the goal being edited
    if (goal.year) {
      const goalYear = parseInt(goal.year.substring(0, 4));
      setSelectedGoalYear(goalYear);
    }
    setShowGoalModal(true);
  };

  const handleShowImageCleaner = () => {
    setShowImageCleaner(true);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Transactions screen
  if (currentPage === 'transactions') {
    return (
      <>
        {showImageCleaner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative">
              <button
                onClick={() => setShowImageCleaner(false)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
              <ImageUrlCleaner />
            </div>
          </div>
        )}
        <TransactionsScreen
          key={transactionListRefreshKey}
          userName={userName}
          user={user}
          onGoalsClick={handleGoalsClick}
          onDashboardClick={handleDashboardClick}
          onLogOut={handleLogOut}
          onAddTransaction={handleAddTransactionClick}
         onEditTransaction={handleEditTransactionClick}
          onShowImageCleaner={handleShowImageCleaner}
        />
        
        {/* Transaction Entry Modal */}
        <TransactionEntryModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={handleTransactionSubmit}
         editingTransaction={editingTransaction}
          user={user}
        />
      </>
    );
  }

  // Show Goals screen
  if (currentPage === 'goals') {
    return (
      <>
        {showImageCleaner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative">
              <button
                onClick={() => setShowImageCleaner(false)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
              <ImageUrlCleaner />
            </div>
          </div>
        )}
        <GoalsScreen
          key={goalsRefreshKey}
          userName={userName}
          user={user}
          onTransactionsClick={handleTransactionsClick}
          onDashboardClick={handleDashboardClick}
          onLogOut={handleLogOut}
          onAddGoals={handleAddGoalsClick}
          onEditGoals={handleEditGoalsClick}
          onShowImageCleaner={handleShowImageCleaner}
        />
        
        {/* Goal Entry Modal */}
        <GoalEntryModal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
          onSubmit={handleGoalSubmit}
          editingGoal={editingGoal}
          user={user}
          selectedYear={selectedGoalYear}
        />
      </>
    );
  }

  // Show Welcome page if user has signed up
  if (currentPage === 'welcome') {
    return (
      <>
        {showImageCleaner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative">
              <button
                onClick={() => setShowImageCleaner(false)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
              <ImageUrlCleaner />
            </div>
          </div>
        )}
        <WelcomePage
          userName={userName}
          userFullName={userFullName}
          user={user}
          goalsCreated={goalsCreated}
          hasTransactions={hasTransactions}
          onGoalsClick={handleGoalsClick}
          onAddGoals={handleAddGoalsClick}
          onTransactionsClick={handleTransactionsClick}
          onAddTransaction={handleAddTransactionClick}
          onLogOut={handleLogOut}
          onShowImageCleaner={handleShowImageCleaner}
        />
        
        {/* Goal Entry Modal */}
        <GoalEntryModal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
          onSubmit={handleGoalSubmit}
          editingGoal={editingGoal}
          user={user}
          selectedYear={selectedGoalYear}
        />
        
        {/* Transaction Entry Modal */}
        <TransactionEntryModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={handleTransactionSubmit}
         editingTransaction={editingTransaction}
          user={user}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <Home className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-gray-800">REDash</span>
        </div>
        <div></div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Hero Banner */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl text-gray-800 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>
            Know Your
          </h1>
          <h1 className="text-4xl md:text-5xl text-gray-800 mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
            Numbers
          </h1>
          
          {/* Action Buttons */}
          <div className="space-y-4 max-w-sm mx-auto">
            <button 
              onClick={handleStartTracking}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start tracking here
            </button>
            <button 
              onClick={handleLoginClick}
              className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold py-4 px-6 rounded-lg transition-all duration-200"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Closed Transactions</h2>
          
          {/* Animated Bar Graph */}
          <div className="relative mb-6">
            {/* Background gradient bar */}
            <div className="h-12 rounded-full overflow-hidden shadow-inner" 
                 style={{
                   background: 'linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)'
                 }}>
              {/* Animated progress line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-gray-900 transition-all duration-2000 ease-out shadow-lg"
                style={{ 
                  left: `${progress}%`,
                  transition: 'left 1s ease-out',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
            
            {/* Progress labels */}
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>24</span>
            </div>
          </div>

          {/* Encouraging Message */}
          <div className="text-center">
            <p className="text-gray-700 font-medium text-lg animate-pulse">
              {currentEncouragingMessage}
            </p>
          </div>

          {/* Stats Display */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-600">Current Progress</span>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800">
                {Math.round(progress)}%
              </span>
              <p className="text-sm text-gray-500 mt-1">of your monthly goal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Get Started</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter your password (min 6 characters)"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Start Tracking
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    setShowLoginModal(true);
                  }}
                  className="text-teal-600 hover:text-teal-700 font-medium underline"
                >
                  Click here to Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <button
                onClick={handleCloseLoginModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginFormData.email}
                  onChange={handleLoginInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={loginFormData.password}
                  onChange={handleLoginInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseLoginModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginRetryAttempt > 0}
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium ${
                    loginRetryAttempt > 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {loginRetryAttempt > 0 
                    ? `Logging in... (Attempt ${loginRetryAttempt})`
                    : 'Log In'
                  }
                </button>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseLoginModal();
                      setShowModal(true);
                    }}
                    className="text-teal-600 hover:text-teal-700 font-medium underline"
                  >
                    Click here to create one
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-center space-x-12">
          <button className="flex flex-col items-center space-y-1 text-teal-600">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-600">
            <Search className="w-6 h-6" />
            <span className="text-xs font-medium">Search</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-600">
            <Menu className="w-6 h-6" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
}

export default App;

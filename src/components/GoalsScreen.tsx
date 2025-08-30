import React, { useState, useEffect } from 'react';
import { User, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { supabase, Goal } from '../lib/supabase';
import NotificationSettings from './NotificationSettings';

interface GoalsScreenProps {
  userName: string;
  user: any;
  onTransactionsClick: () => void;
  onDashboardClick: () => void;
  onLogOut: () => void;
  onAddGoals: () => void;
  onEditGoals: (goal: Goal) => void;
  onShowImageCleaner?: () => void;
}

function GoalsScreen({ 
  userName, 
  user,
  onTransactionsClick, 
  onDashboardClick, 
  onLogOut,
  onAddGoals,
  onEditGoals,
  onShowImageCleaner
}: GoalsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'Total' | 'Buyers' | 'Sellers'>('Total');
  const [goalsData, setGoalsData] = useState<any>(null);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Extract fetchGoalsData as a separate function so it can be called from event listener
  const fetchGoalsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const yearString = `${selectedYear}-01-01`;
      
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }
      
      console.log('=== GOALS ACTUAL VALUES DEBUG ===');
      console.log('Fetching goals for user:', user.id);
      console.log('Year:', yearString);
      
      const { data: goalsArray, error } = await supabase
        .from('Goals')
        .select('*')
        .eq('year', yearString)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });


      if (error) {
        throw error;
      }

      const goals = goalsArray && goalsArray.length > 0 ? goalsArray[0] : null;
      
      if (goals) {
        console.log('Raw goals data from database:');
        console.log('- actual_total_transactions_closed:', goals.actual_total_transactions_closed);
        console.log('- actual_buyer_transactions_closed:', goals.actual_buyer_transactions_closed);
        console.log('- actual_seller_transactions_closed:', goals.actual_seller_transactions_closed);
        console.log('- actual_total_sales_volume:', goals.actual_total_sales_volume);
        console.log('- actual_total_commission_income:', goals.actual_total_commission_income);
        
        // Let's also check what transactions exist in the database
        const { data: transactionsData, error: transError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'Closed');
          
        if (!transError && transactionsData) {
          console.log('Closed transactions in database:', transactionsData.length);
          console.log('Breakdown by client type:');
          const buyers = transactionsData.filter(t => t.client_type === 'Buyer').length;
          const sellers = transactionsData.filter(t => t.client_type === 'Seller').length;
          console.log('- Buyers:', buyers);
          console.log('- Sellers:', sellers);
          console.log('Transaction details:', transactionsData.map(t => ({
            id: t.id,
            client_type: t.client_type,
            status: t.status,
            sales_price: t.sales_price,
            gross_commission_income: t.gross_commission_income,
            closing_date: t.closing_date
          })));
        }
        
        setCurrentGoal(goals);
        
        // Map Supabase data to component format
        const mappedData = {
          closedTransactions: {
            current: goals.actual_total_transactions_closed || 0,
            goal: goals.total_transactions_closed || 0,
            buyers: { 
              current: goals.actual_buyer_transactions_closed || 0,
              goal: goals.buyer_transactions_closed || 0 
            },
            sellers: { 
              current: goals.actual_seller_transactions_closed || 0,
              goal: goals.seller_transactions_closed || 0 
            }
          },
          grossIncome: {
            current: goals.actual_total_commission_income || 0,
            goal: goals.total_commission_income || 0,
            buyers: { 
              current: goals.actual_commission_income_buyers || 0,
              goal: goals.commission_income_buyers || 0 
            },
            sellers: { 
              current: goals.actual_commission_income_sellers || 0,
              goal: goals.commission_income_sellers || 0 
            }
          },
          closedVolume: {
            current: goals.actual_total_sales_volume || 0,
            goal: goals.total_sales_volume || 0,
            buyers: { 
              current: goals.actual_sales_volume_buyers || 0,
              goal: goals.sales_volume_buyers || 0 
            },
            sellers: { 
              current: goals.actual_sales_volume_sellers || 0,
              goal: goals.sales_volume_sellers || 0 
            }
          }
        };
        console.log('Mapped data for display:', mappedData);
        console.log('=== END GOALS ACTUAL VALUES DEBUG ===');
        setGoalsData(mappedData);
      } else {
        // No goals found for current year
        setGoalsData(null);
        setCurrentGoal(null);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals data');
    } finally {
      setLoading(false);
    }
  };

  // Listen for transaction updates that should refresh goals
  useEffect(() => {
    const handleGoalsRefresh = () => {
      fetchGoalsData();
    };

    window.addEventListener('goalsNeedRefresh', handleGoalsRefresh);
    return () => window.removeEventListener('goalsNeedRefresh', handleGoalsRefresh);
  }, []);

  useEffect(() => {
    fetchGoalsData();
  }, [user?.id, selectedYear]); // Re-fetch when user or selected year changes

  const getCurrentData = () => {
    if (!goalsData) return null;
    
    switch (activeFilter) {
      case 'Buyers':
        return {
          closedTransactions: goalsData.closedTransactions.buyers,
          grossIncome: goalsData.grossIncome.buyers,
          closedVolume: goalsData.closedVolume.buyers
        };
      case 'Sellers':
        return {
          closedTransactions: goalsData.closedTransactions.sellers,
          grossIncome: goalsData.grossIncome.sellers,
          closedVolume: goalsData.closedVolume.sellers
        };
      default:
        return {
          closedTransactions: { current: goalsData.closedTransactions.current, goal: goalsData.closedTransactions.goal },
          grossIncome: { current: goalsData.grossIncome.current, goal: goalsData.grossIncome.goal },
          closedVolume: { current: goalsData.closedVolume.current, goal: goalsData.closedVolume.goal }
        };
    }
  };

  const currentData = getCurrentData();

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatVolume = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return formatCurrency(amount);
  };

  const getProgressBarColor = (progress: number) => {
    if (progress <= 33.33) return 'bg-red-400';
    if (progress <= 66.66) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getProgressMessage = (progress: number) => {
    if (progress <= 33.33) return 'Keep Going!';
    if (progress <= 66.66) return 'Getting Closer!';
    if (progress < 100) return 'Almost There!';
    return 'Goal Achieved!';
  };

  const handleCreateNextYearGoals = () => {
    onAddGoals();
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!goalsData) {
    return (
      <div className="min-h-screen bg-white">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div></div>
          <div className="flex space-x-6">
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
        <div className="px-6 py-4">
          {/* User Profile Section */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {userName}'s Goals Dashboard
            </h1>
          </div>

          {/* Year Selection */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => handleYearChange('prev')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 min-w-[100px] text-center">
              {selectedYear}
            </h2>
            <button
              onClick={() => handleYearChange('next')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* No Goals Message */}
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">No Goals Set</h2>
            <p className="text-gray-600 mb-6">You haven't set any goals for {selectedYear} yet.</p>
            <button
              onClick={onAddGoals}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Create Your Goals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div></div>
        <div>
          <button 
            onClick={onTransactionsClick}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Transactions
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
      <div className="px-6 py-4">
        {/* User Profile Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {userName}'s Goals Dashboard
          </h1>
        </div>

        {/* Year Selection */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => handleYearChange('prev')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 min-w-[100px] text-center">
            {selectedYear}
          </h2>
          <button
            onClick={() => handleYearChange('next')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setActiveFilter('Total')}
            className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
              activeFilter === 'Total'
                ? 'bg-teal-600 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setActiveFilter('Buyers')}
            className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
              activeFilter === 'Buyers'
                ? 'bg-teal-600 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Buyers
          </button>
          <button
            onClick={() => setActiveFilter('Sellers')}
            className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
              activeFilter === 'Sellers'
                ? 'bg-teal-600 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Sellers
          </button>
        </div>

        {/* Progress Sections */}
        <div className="space-y-6">
          {/* Closed Transactions */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">
              Closed Transactions: <span className="text-teal-600">{currentData.closedTransactions.current}</span>
            </h3>
            <div className="relative">
              <div className="h-12 rounded-lg overflow-hidden relative shadow-inner" 
                   style={{
                     background: 'linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)'
                   }}>
                {/* Black progress indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-2 bg-black transition-all duration-500"
                  style={{ 
                    left: `${calculateProgress(currentData.closedTransactions.current, currentData.closedTransactions.goal)}%`,
                    transform: 'translateX(-50%)',
                    top: '-4px',
                    bottom: '-4px'
                  }}
                />
                {/* Inspirational message */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {getProgressMessage(calculateProgress(currentData.closedTransactions.current, currentData.closedTransactions.goal))}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>0</span>
                <span>{Math.round((currentData.closedTransactions.goal || 0) / 3)}</span>
                <span>{Math.round(((currentData.closedTransactions.goal || 0) * 2) / 3)}</span>
                <span>Goal: {currentData.closedTransactions.goal || 0}</span>
              </div>
            </div>
          </div>

          {/* Gross Income */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">
              Gross Income: <span className="text-teal-600">{formatCurrency(currentData.grossIncome.current)}</span>
            </h3>
            <div className="relative">
              <div className="h-12 rounded-lg overflow-hidden relative shadow-inner" 
                   style={{
                     background: 'linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)'
                   }}>
                {/* Black progress indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-2 bg-black transition-all duration-500"
                  style={{ 
                    left: `${calculateProgress(currentData.grossIncome.current, currentData.grossIncome.goal)}%`,
                    transform: 'translateX(-50%)',
                    top: '-4px',
                    bottom: '-4px'
                  }}
                />
                {/* Inspirational message */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {getProgressMessage(calculateProgress(currentData.grossIncome.current, currentData.grossIncome.goal))}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>$0</span>
                <span>{formatCurrency(Math.round((currentData.grossIncome.goal || 0) / 3))}</span>
                <span>{formatCurrency(Math.round(((currentData.grossIncome.goal || 0) * 2) / 3))}</span>
                <span>Goal: {formatCurrency(currentData.grossIncome.goal || 0)}</span>
              </div>
            </div>
          </div>

          {/* Closed Volume */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">
              Closed Volume: <span className="text-teal-600">{formatVolume(currentData.closedVolume.current)}</span>
            </h3>
            <div className="relative">
              <div className="h-12 rounded-lg overflow-hidden relative shadow-inner" 
                   style={{
                     background: 'linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)'
                   }}>
                {/* Black progress indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-2 bg-black transition-all duration-500"
                  style={{ 
                    left: `${calculateProgress(currentData.closedVolume.current, currentData.closedVolume.goal)}%`,
                    transform: 'translateX(-50%)',
                    top: '-4px',
                    bottom: '-4px'
                  }}
                />
                {/* Inspirational message */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {getProgressMessage(calculateProgress(currentData.closedVolume.current, currentData.closedVolume.goal))}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>$0</span>
                <span>{formatVolume(Math.round((currentData.closedVolume.goal || 0) / 3))}</span>
                <span>{formatVolume(Math.round(((currentData.closedVolume.goal || 0) * 2) / 3))}</span>
                <span>Goal: {formatVolume(currentData.closedVolume.goal || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-8">
          {selectedYear === new Date().getFullYear() + 1 ? (
            <button
              onClick={handleCreateNextYearGoals}
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              Create {selectedYear} Goals
            </button>
          ) : selectedYear === new Date().getFullYear() ? (
            <>
              <button
                onClick={() => currentGoal && onEditGoals(currentGoal)}
                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
              >
                Edit This Year's Goals
              </button>
              <button
                onClick={handleCreateNextYearGoals}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Create Next Year's Goals
              </button>
            </>
          ) : (
            <button
              onClick={() => currentGoal && onEditGoals(currentGoal)}
              className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
            >
              Edit {selectedYear} Goals
            </button>
          )}
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

export default GoalsScreen;

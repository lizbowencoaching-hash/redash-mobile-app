import React, { useState } from 'react';
import { User, Plus, Bell } from 'lucide-react';
import TransactionDetailsModal from './TransactionDetailsModal';
import ConfirmationModal from './ConfirmationModal';
import NotificationSettings from './NotificationSettings';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  address: string;
  client: string;
  salesPrice: string;
  closingDate: string;
  status: 'Active' | 'Under Contract' | 'Closed';
  clientType: 'Buyer' | 'Seller';
  underContractDate?: string;
  commissionIncome?: string;
  uploadedImage?: string;
}

interface TransactionsScreenProps {
  userName: string;
  onGoalsClick: () => void;
  onDashboardClick: () => void;
  onLogOut: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onShowImageCleaner?: () => void;
  user?: any;
}

// Helper function to format dates to MM/DD/YY
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

function TransactionsScreen({ 
  userName, 
  user,
  onGoalsClick, 
  onDashboardClick, 
  onLogOut, 
  onAddTransaction,
  onEditTransaction,
  onShowImageCleaner
}: TransactionsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'Active' | 'Under Contract' | 'Closed'>('Active');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Fetch transactions from Supabase
  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: transactionsData, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Map Supabase data to component format
        const mappedTransactions: Transaction[] = (transactionsData || []).map(transaction => ({
          id: transaction.id,
          address: transaction.address,
          client: transaction.client_last_name,
          salesPrice: transaction.sales_price ? `$${transaction.sales_price.toLocaleString()}` : 'N/A',
          closingDate: transaction.closing_date || '',
          status: transaction.status as 'Active' | 'Under Contract' | 'Closed',
          clientType: transaction.client_type as 'Buyer' | 'Seller',
          underContractDate: transaction.under_contract_date || '',
          commissionIncome: transaction.gross_commission_income ? `$${transaction.gross_commission_income.toLocaleString()}` : 'N/A',
          uploadedImage: transaction.image_url || undefined
        }));

        setTransactions(mappedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(transaction => 
    transaction.status === activeFilter
  ).sort((a, b) => {
    const dateA = new Date(a.closingDate);
    const dateB = new Date(b.closingDate);
    
    // For Active and Under Contract: sort by earliest closing date first (next to close at top)
    if (activeFilter === 'Active' || activeFilter === 'Under Contract') {
      return dateA.getTime() - dateB.getTime();
    }
    
    // For Closed: sort by newest closing date first
    return dateB.getTime() - dateA.getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-teal-600';
      case 'Under Contract':
        return 'bg-blue-600';
      case 'Closed':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const handleDetailsClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
  };

  const refreshTransactions = async () => {
    try {
      const { data: transactionsData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Map Supabase data to component format
      const mappedTransactions: Transaction[] = (transactionsData || []).map(transaction => ({
        id: transaction.id,
        address: transaction.address,
        client: transaction.client_last_name,
        salesPrice: transaction.sales_price ? `$${transaction.sales_price.toLocaleString()}` : 'N/A',
        closingDate: transaction.closing_date || '',
        status: transaction.status as 'Active' | 'Under Contract' | 'Closed',
        clientType: transaction.client_type as 'Buyer' | 'Seller',
        underContractDate: transaction.under_contract_date || '',
        commissionIncome: transaction.gross_commission_income ? `$${transaction.gross_commission_income.toLocaleString()}` : 'N/A',
        uploadedImage: transaction.image_url || undefined
      }));

      setTransactions(mappedTransactions);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
    }
  };
  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div></div>
        <div>
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
      <div className="px-6 py-4 flex-1 flex flex-col">
        {/* User Profile Section */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {userName}'s Transactions Dashboard
          </h1>
        </div>

        {/* Page Title */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
        </div>

        {/* Filter by Status */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveFilter('Active')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'Active'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('Under Contract')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'Under Contract'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Under Contract
            </button>
            <button
              onClick={() => setActiveFilter('Closed')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'Closed'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Transaction Cards */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex-shrink-0">
                <div className="flex items-start space-x-3">
                  {/* Image or status indicator on far left */}
                  <div className="flex-shrink-0">
                    {transaction.uploadedImage && transaction.uploadedImage.trim() !== '' ? (
                      <img 
                        src={transaction.uploadedImage} 
                        alt="Transaction property" 
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onLoad={() => {
                          // Image loaded successfully - no action needed
                        }}
                        onError={(e) => {
                          // Silently handle image load failure by hiding the image
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show fallback message
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.image-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center image-fallback';
                            fallback.innerHTML = '<span class="text-xs text-gray-500 text-center px-1">No Image</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 text-center px-1">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Transaction information */}
                  <div className="flex-1 min-w-0">
                    {/* Top row with address and client type */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 flex-1">{transaction.address}</div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ml-2 flex-shrink-0 ${
                        transaction.clientType === 'Buyer' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transaction.clientType}
                      </span>
                    </div>
                    
                    {/* Transaction details */}
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-600">Client: {transaction.client}</div>
                      <div className="text-gray-600">Sales Price: {transaction.salesPrice}</div>
                      <div className="text-gray-600">Closing Date: {formatDate(transaction.closingDate)}</div>
                      <div className="flex items-center justify-end mt-2">
                        <button 
                          onClick={() => handleDetailsClick(transaction)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No {activeFilter.toLowerCase()} transactions found.
            </div>
          )}
        </div>

        {/* Add New Transaction Button */}
        <div className="text-center">
          <button
            onClick={onAddTransaction}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add a New Transaction</span>
          </button>
        </div>
      </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        transaction={selectedTransaction}
        onEdit={(transaction) => {
          onEditTransaction(transaction);
          handleCloseDetailsModal();
          // Refresh transactions after edit
          setTimeout(refreshTransactions, 1000);
        }}
        onDelete={(transactionId) => {
          setTransactionToDelete(transactionId);
          setShowDeleteConfirm(true);
        }}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          if (transactionToDelete) {
            try {
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionToDelete);

              if (error) {
                console.error('Error deleting transaction:', error);
                alert('Error deleting transaction. Please try again.');
                return;
              }

              console.log('Transaction deleted successfully');
              // Refresh transactions after delete
              refreshTransactions();
              
              // Force Goals screen refresh by dispatching a custom event
              window.dispatchEvent(new CustomEvent('goalsNeedRefresh'));
              
              handleCloseDetailsModal();
            } catch (err) {
              console.error('Unexpected error deleting transaction:', err);
              alert('Unexpected error deleting transaction. Please try again.');
            }
          }
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
        }}
      />
      
      {/* Notification Settings Modal */}
      <NotificationSettings
        user={user}
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </>
  );
}

export default TransactionsScreen;

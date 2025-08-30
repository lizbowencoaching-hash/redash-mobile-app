import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase, Goal } from '../lib/supabase';

interface GoalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: GoalData) => void;
  user: any;
  editingGoal?: Goal | null;
  selectedYear?: number;
}

interface GoalData {
  goalYear: string;
  buyerTransactionsClosed: string;
  sellerTransactionsClosed: string;
  totalTransactionsClosed: string;
  salesVolumeBuyers: string;
  salesVolumeSellers: string;
  totalSalesVolume: string;
  commissionIncomeBuyers: string;
  commissionIncomeSellers: string;
  totalCommissionIncome: string;
}

function GoalEntryModal({ isOpen, onClose, onSubmit, user, editingGoal, selectedYear }: GoalEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [submitError, setSubmitError] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string>('');
  const [formData, setFormData] = useState<GoalData>({
    goalYear: (selectedYear || new Date().getFullYear()).toString(),
    buyerTransactionsClosed: '',
    sellerTransactionsClosed: '',
    totalTransactionsClosed: '',
    salesVolumeBuyers: '',
    salesVolumeSellers: '',
    totalSalesVolume: '',
    commissionIncomeBuyers: '',
    commissionIncomeSellers: '',
    totalCommissionIncome: ''
  });

  // Helper function to format numeric value to currency display
  const formatToCurrency = (value: string) => {
    if (!value || value === '') return '';
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';
    return '$' + numericValue.toLocaleString();
  };

  // Pre-populate form when editing a goal
  React.useEffect(() => {
    if (editingGoal) {
      const goalYear = editingGoal.year ? editingGoal.year.substring(0, 4) : new Date().getFullYear().toString();
      
      setFormData({
        goalYear,
        buyerTransactionsClosed: editingGoal.buyer_transactions_closed?.toString() || '',
        sellerTransactionsClosed: editingGoal.seller_transactions_closed?.toString() || '',
        totalTransactionsClosed: editingGoal.total_transactions_closed?.toString() || '',
        salesVolumeBuyers: editingGoal.sales_volume_buyers?.toString() || '',
        salesVolumeSellers: editingGoal.sales_volume_sellers?.toString() || '',
        totalSalesVolume: editingGoal.total_sales_volume?.toString() || '',
        commissionIncomeBuyers: editingGoal.commission_income_buyers?.toString() || '',
        commissionIncomeSellers: editingGoal.commission_income_sellers?.toString() || '',
        totalCommissionIncome: editingGoal.total_commission_income?.toString() || ''
      });
    } else {
      // Reset form when not editing
      setFormData({
        goalYear: (selectedYear || new Date().getFullYear()).toString(),
        buyerTransactionsClosed: '',
        sellerTransactionsClosed: '',
        totalTransactionsClosed: '',
        salesVolumeBuyers: '',
        salesVolumeSellers: '',
        totalSalesVolume: '',
        commissionIncomeBuyers: '',
        commissionIncomeSellers: '',
        totalCommissionIncome: ''
      });
    }
  }, [editingGoal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Remove all non-numeric characters except decimal point
    let numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocusedField(e.target.name);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFocusedField('');
    
    // Clean up the value - remove trailing decimal points
    let cleanValue = value;
    if (cleanValue.endsWith('.')) {
      cleanValue = cleanValue.slice(0, -1);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));
  };

  // Utility function to retry Supabase operations
  const retrySupabaseOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 500) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setRetryAttempt(attempt);
      try {
        console.log(`Goal operation attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        
        if (!result.error) {
          console.log(`Goal operation succeeded on attempt ${attempt}`);
          setRetryAttempt(0);
          return result;
        }
        
        // Log detailed error information
        console.error(`Goal operation attempt ${attempt} failed:`, {
          error: result.error,
          message: result.error?.message,
          details: result.error?.details,
          hint: result.error?.hint,
          code: result.error?.code
        });
        
        // Check if it's a retryable error
        const isRetryable = isRetryableError(result.error);
        if (!isRetryable || attempt === maxRetries) {
          setRetryAttempt(0);
          return result;
        }
        
        // Wait before retrying
        if (attempt < maxRetries) {
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (networkError) {
        console.error(`Network error on goal operation attempt ${attempt}:`, networkError);
        
        if (attempt === maxRetries) {
          setRetryAttempt(0);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validateForm = () => {
      const errors: string[] = [];
      
      // Validate goal year
      const yearNum = parseInt(formData.goalYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < (currentYear - 5) || yearNum > (currentYear + 10)) {
        errors.push('Goal year must be a valid year between ' + (currentYear - 5) + ' and ' + (currentYear + 10));
      }
      
      // Validate numeric fields - transactions
      if (formData.buyerTransactionsClosed && (isNaN(parseInt(formData.buyerTransactionsClosed)) || parseInt(formData.buyerTransactionsClosed) < 0)) {
        errors.push('Buyer transactions closed must be a non-negative number');
      }
      if (formData.sellerTransactionsClosed && (isNaN(parseInt(formData.sellerTransactionsClosed)) || parseInt(formData.sellerTransactionsClosed) < 0)) {
        errors.push('Seller transactions closed must be a non-negative number');
      }
      if (formData.totalTransactionsClosed && (isNaN(parseInt(formData.totalTransactionsClosed)) || parseInt(formData.totalTransactionsClosed) < 0)) {
        errors.push('Total transactions closed must be a non-negative number');
      }
      
      // Validate numeric fields - sales volume
      if (formData.salesVolumeBuyers) {
        const cleanValue = formData.salesVolumeBuyers.replace(/[^0-9.]/g, '');
        if (isNaN(parseFloat(cleanValue)) || parseFloat(cleanValue) < 0) {
          errors.push('Sales volume buyers must be a non-negative number');
        }
      }
      if (formData.salesVolumeSellers) {
        const cleanValue = formData.salesVolumeSellers.replace(/[^0-9.]/g, '');
        if (isNaN(parseFloat(cleanValue)) || parseFloat(cleanValue) < 0) {
          errors.push('Sales volume sellers must be a non-negative number');
        }
      }
      if (formData.totalSalesVolume) {
        const cleanValue = formData.totalSalesVolume.replace(/[^0-9.]/g, '');
        if (isNaN(parseFloat(cleanValue)) || parseFloat(cleanValue) < 0) {
          errors.push('Total sales volume must be a non-negative number');
        }
      }
      
      // Validate numeric fields - commission income
      if (formData.commissionIncomeBuyers) {
        const cleanValue = formData.commissionIncomeBuyers.replace(/[^0-9.]/g, '');
        if (isNaN(parseFloat(cleanValue)) || parseFloat(cleanValue) < 0) {
          errors.push('Commission income from buyers must be a non-negative number');
        }
      }
      if (formData.commissionIncomeSellers) {
        const cleanValue = formData.commissionIncomeSellers.replace(/[^0-9.]/g, '');
        if (isNaN(parseFloat(cleanValue)) || parseFloat(cleanValue) < 0) {
          errors.push('Commission income from sellers must be a non-negative number');
        }
      }
      if (formData.totalCommissionIncome) {
        const cleanValue = formData.totalCommissionIncome.replace(/[^0-9.]/g, '');
        if (isNaN(parseFloat(cleanValue)) || parseFloat(cleanValue) < 0) {
          errors.push('Total commission income must be a non-negative number');
        }
      }
      
      return errors;
    };
    
    const submitGoal = async () => {
      try {
        // Check if user is authenticated
        if (!user) {
          console.error('User not authenticated');
          setSubmitError('You must be logged in to create goals.');
          return;
        }

        // Validate form data
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
          setSubmitError(validationErrors.join('. '));
          return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        const goalData = {
          year: `${formData.goalYear}-01-01`,
          user_id: user.id, // Add user_id to associate goal with current user
          buyer_transactions_closed: parseInt(formData.buyerTransactionsClosed) || null,
          seller_transactions_closed: parseInt(formData.sellerTransactionsClosed) || null,
          total_transactions_closed: parseInt(formData.totalTransactionsClosed) || null,
          sales_volume_buyers: parseFloat(formData.salesVolumeBuyers.replace(/[$,]/g, '')) || null,
          sales_volume_sellers: parseFloat(formData.salesVolumeSellers.replace(/[$,]/g, '')) || null,
          total_sales_volume: parseFloat(formData.totalSalesVolume.replace(/[$,]/g, '')) || null,
          commission_income_buyers: parseFloat(formData.commissionIncomeBuyers) || null,
          commission_income_sellers: parseFloat(formData.commissionIncomeSellers) || null,
          total_commission_income: parseFloat(formData.totalCommissionIncome) || null,
        };

        let result;
        if (editingGoal?.id) {
          // Update existing goal
          result = await retrySupabaseOperation(async () => {
            return await supabase
              .from('Goals')
              .update(goalData)
              .eq('id', editingGoal.id)
              .select();
          });
        } else {
          // Create new goal
          result = await retrySupabaseOperation(async () => {
            return await supabase
              .from('Goals')
              .insert([goalData])
              .select();
          });
        }

        if (result.error) {
          console.error('Final error after all retries:', result.error);
          // Provide user-friendly error message without exposing system details
          setSubmitError(`Failed to ${editingGoal ? 'update' : 'create'} goal. Please check your internet connection and try again.`);
          setIsSubmitting(false);
          return;
        }

        console.log(`Goal ${editingGoal ? 'updated' : 'created'} successfully:`, result.data);

        // Show success state on button
        setShowSuccess(true);
        
        // Hide success state after 2 seconds and close modal
        setTimeout(() => {
          setShowSuccess(false);
          onSubmit(formData);
          onClose();
          
          // Reset form
          setFormData({
            goalYear: (selectedYear || new Date().getFullYear()).toString(),
            buyerTransactionsClosed: '',
            sellerTransactionsClosed: '',
            totalTransactionsClosed: '',
            salesVolumeBuyers: '',
            salesVolumeSellers: '',
            totalSalesVolume: '',
            commissionIncomeBuyers: '',
            commissionIncomeSellers: '',
            totalCommissionIncome: ''
          });
          setIsSubmitting(false);
          setSubmitError('');
        }, 2000);

      } catch (error) {
        console.error('Error submitting goal:', error);
        setSubmitError('An unexpected error occurred. Please try again.');
        setIsSubmitting(false);
        setShowSuccess(false);
      }
    };

    submitGoal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {editingGoal ? 'Edit This Year\'s Goals' : 'Add Your Goals'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Error Message */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Year
            </label>
            <input
              type="number"
              name="goalYear"
              value={formData.goalYear}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="2020"
              max="2030"
              step="1"
            />
          </div>

          {/* Buyer Transactions Closed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buyer Transactions Closed
            </label>
            <input
              type="number"
              name="buyerTransactionsClosed"
              value={formData.buyerTransactionsClosed}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              step="1"
            />
          </div>

          {/* Seller Transactions Closed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seller Transactions Closed
            </label>
            <input
              type="number"
              name="sellerTransactionsClosed"
              value={formData.sellerTransactionsClosed}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              step="1"
            />
          </div>

          {/* Total Transactions Closed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Transactions Closed
            </label>
            <input
              type="number"
              name="totalTransactionsClosed"
              value={formData.totalTransactionsClosed}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              step="1"
            />
          </div>

          {/* Sales Volume Buyers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales Volume Buyers
            </label>
            <input
              type="text"
              name="salesVolumeBuyers"
              value={focusedField === 'salesVolumeBuyers' ? formData.salesVolumeBuyers : formatToCurrency(formData.salesVolumeBuyers)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
            />
          </div>

          {/* Sales Volume Sellers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales Volume Sellers
            </label>
            <input
              type="text"
              name="salesVolumeSellers"
              value={focusedField === 'salesVolumeSellers' ? formData.salesVolumeSellers : formatToCurrency(formData.salesVolumeSellers)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
            />
          </div>

          {/* Total Sales Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Sales Volume
            </label>
            <input
              type="text"
              name="totalSalesVolume"
              value={focusedField === 'totalSalesVolume' ? formData.totalSalesVolume : formatToCurrency(formData.totalSalesVolume)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
            />
          </div>

          {/* Commission Income from Buyers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Income from Buyers
            </label>
            <input
              type="text"
              name="commissionIncomeBuyers"
              value={focusedField === 'commissionIncomeBuyers' ? formData.commissionIncomeBuyers : formatToCurrency(formData.commissionIncomeBuyers)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
            />
          </div>

          {/* Commission Income from Sellers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Income from Sellers
            </label>
            <input
              type="text"
              name="commissionIncomeSellers"
              value={focusedField === 'commissionIncomeSellers' ? formData.commissionIncomeSellers : formatToCurrency(formData.commissionIncomeSellers)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
            />
          </div>

          {/* Total Commission Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Commission Income
            </label>
            <input
              type="text"
              name="totalCommissionIncome"
              value={focusedField === 'totalCommissionIncome' ? formData.totalCommissionIncome : formatToCurrency(formData.totalCommissionIncome)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || showSuccess}
              className={`w-full px-4 py-3 text-white rounded-lg transition-colors font-medium ${
                showSuccess 
                  ? 'bg-green-500' 
                  : isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-400 hover:bg-orange-500'
              }`}
            >
              {showSuccess
                ? 'Goals Updated Successfully'
                : isSubmitting 
                  ? retryAttempt > 0 
                    ? `${editingGoal ? 'Updating' : 'Creating'}... (Attempt ${retryAttempt})`
                    : (editingGoal ? 'Updating...' : 'Creating...')
                  : (editingGoal ? 'Update Goals' : 'Create Goals')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoalEntryModal;

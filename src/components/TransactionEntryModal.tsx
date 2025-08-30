import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TransactionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: TransactionData) => void;
  editingTransaction?: TransactionData | null;
  user?: any;
}

interface TransactionData {
  address: string;
  clientLastName: string;
  clientType: 'buyer' | 'seller';
  status: 'Active' | 'Under Contract' | 'Closed';
  underContractDate: string;
  salePrice: string;
  closingDate: string;
  grossCommissionIncome: string;
  uploadedImage?: File;
  id?: string; // Add id for editing
}

function TransactionEntryModal({ isOpen, onClose, onSubmit, editingTransaction, user }: TransactionEntryModalProps) {
  const [formData, setFormData] = useState<TransactionData>({
    address: '',
    clientLastName: '',
    clientType: 'buyer',
    status: 'Active',
    underContractDate: '',
    salePrice: '',
    closingDate: '',
    grossCommissionIncome: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [focusedField, setFocusedField] = useState<string>('');

  // Helper function to format numeric value to currency display
  const formatToCurrency = (value: string) => {
    if (!value || value === '') return '';
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';
    return '$' + numericValue.toLocaleString();
  };

  // Update form data when editing transaction
  React.useEffect(() => {
    if (editingTransaction) {
      // Helper function to extract numeric value from currency string
      const extractNumericValue = (value: string | undefined) => {
        if (!value) return '';
        // Remove currency symbols and commas, keep numbers and decimal
        const cleaned = value.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = cleaned.split('.');
        if (parts.length > 2) {
          return parts[0] + '.' + parts.slice(1).join('');
        }
        return cleaned;
      };

      setFormData({
        address: editingTransaction.address,
        clientLastName: editingTransaction.client_last_name || editingTransaction.client || editingTransaction.clientLastName,
        clientType: (editingTransaction.clientType?.toLowerCase() as 'buyer' | 'seller') || 'buyer',
        status: editingTransaction.status || 'Active',
        underContractDate: editingTransaction.underContractDate || '',
        salePrice: extractNumericValue(editingTransaction.salesPrice || editingTransaction.salePrice),
        closingDate: editingTransaction.closingDate || '',
        grossCommissionIncome: extractNumericValue(editingTransaction.commissionIncome || editingTransaction.grossCommissionIncome),
      });
      
      // Set existing image URL if available
      if (editingTransaction.uploadedImage) {
        setExistingImageUrl(editingTransaction.uploadedImage);
      } else {
        setExistingImageUrl('');
      }
      setImagePreview('');
      setUploadedFile(null);
      setUploadError('');
    } else {
      // Reset form when not editing
      setFormData({
        address: '',
        clientLastName: '',
        clientType: 'buyer',
        status: 'Active',
        underContractDate: '',
        salePrice: '',
        closingDate: '',
        grossCommissionIncome: '',
      });
      setExistingImageUrl('');
      setImagePreview('');
      setUploadedFile(null);
      setUploadError('');
      setFocusedField('');
    }
  }, [editingTransaction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientTypeChange = (type: 'buyer' | 'seller') => {
    setFormData(prev => ({
      ...prev,
      clientType: type
    }));
  };

  const handleStatusChange = (status: 'Active' | 'Under Contract' | 'Closed') => {
    setFormData(prev => ({
      ...prev,
      status: status
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError('');
      setIsProcessingImage(true);
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        setIsProcessingImage(false);
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setUploadError('Image file is too large. Please choose an image smaller than 5MB.');
        setIsProcessingImage(false);
        return;
      }
      
      try {
        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreview(event.target.result as string);
            setUploadedFile(file);
            setExistingImageUrl(''); // Clear existing image when new one is selected
            setIsProcessingImage(false);
          }
        };
        reader.onerror = () => {
          setUploadError('Error reading the image file. Please try again.');
          setIsProcessingImage(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        setUploadError('Error processing the image. Please try again.');
        setIsProcessingImage(false);
      }
    }
  };

  const removeImage = () => {
    setUploadedFile(null);
    setImagePreview('');
    setExistingImageUrl('');
    setUploadError('');
    // Reset the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validateForm = () => {
      const errors: string[] = [];
      
      // Required fields validation
      if (!formData.clientLastName.trim()) {
        errors.push('Client last name is required');
      }
      
      // Address validation (required unless it's an Active buyer transaction)
      if (!formData.address.trim() && !(formData.clientType === 'buyer' && formData.status === 'Active')) {
        errors.push('Address is required');
      }
      
      // Status-based conditional validation
      if (formData.status !== 'Active') {
        if (!formData.underContractDate) {
          errors.push('Under contract date is required for ' + formData.status.toLowerCase() + ' transactions');
        }
        if (!formData.salePrice) {
          errors.push('Sales price is required for ' + formData.status.toLowerCase() + ' transactions');
        }
        if (!formData.closingDate) {
          errors.push('Closing date is required for ' + formData.status.toLowerCase() + ' transactions');
        }
      }
      
      if (formData.status === 'Closed' && !formData.grossCommissionIncome) {
        errors.push('Gross commission income is required for closed transactions');
      }
      
      // Numeric validation
      if (formData.salePrice) {
        const cleanPrice = formData.salePrice.toString().replace(/[^0-9.-]/g, '');
        const priceNum = parseFloat(cleanPrice);
        if (isNaN(priceNum) || priceNum < 0) {
          errors.push('Sales price must be a valid non-negative number');
        }
      }
      
      if (formData.grossCommissionIncome) {
        const cleanCommission = formData.grossCommissionIncome.toString().replace(/[^0-9.-]/g, '');
        const commissionNum = parseFloat(cleanCommission);
        if (isNaN(commissionNum) || commissionNum < 0) {
          errors.push('Gross commission income must be a valid non-negative number');
        }
      }
      
      // Date validation
      if (formData.underContractDate && formData.closingDate) {
        const underContractDate = new Date(formData.underContractDate);
        const closingDate = new Date(formData.closingDate);
        
        if (closingDate < underContractDate) {
          errors.push('Closing date cannot be before under contract date');
        }
      }
      
      // Date range validation (reasonable dates)
      const currentDate = new Date();
      const fiveYearsAgo = new Date(currentDate.getFullYear() - 5, 0, 1);
      const twoYearsFromNow = new Date(currentDate.getFullYear() + 2, 11, 31);
      
      if (formData.underContractDate) {
        const underContractDate = new Date(formData.underContractDate);
        if (underContractDate < fiveYearsAgo || underContractDate > twoYearsFromNow) {
          errors.push('Under contract date must be within a reasonable range');
        }
      }
      
      if (formData.closingDate) {
        const closingDate = new Date(formData.closingDate);
        if (closingDate < fiveYearsAgo || closingDate > twoYearsFromNow) {
          errors.push('Closing date must be within a reasonable range');
        }
      }
      
      return errors;
    };
    
    const submitTransaction = async () => {
      if (!user) {
        setUploadError('You must be logged in to create or edit transactions.');
        return;
      }

      // Validate form data
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setUploadError(validationErrors.join('. '));
        return;
      }

      setIsSubmitting(true);
      setUploadError('');

      try {
        let imageUrl = existingImageUrl;

        // Handle image upload if there's a new file
        if (uploadedFile) {
          try {
            const fileExt = uploadedFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            
            console.log('Attempting to upload file:', fileName);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('transaction-images')
              .upload(fileName, uploadedFile, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              // Check if the bucket exists, if not provide helpful error
              if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket does not exist') || uploadError.message.includes('The resource was not found')) {
                setUploadError('Image upload is currently unavailable. Please try again later or contact support.');
              } else if (uploadError.message.includes('policies') || uploadError.message.includes('policy') || uploadError.message.includes('permission')) {
                setUploadError('Image upload is currently unavailable. Please try again later or contact support.');
              } else if (uploadError.message.includes('413') || uploadError.message.includes('too large')) {
                setUploadError('File is too large for storage. Please choose a smaller image.');
              } else {
                setUploadError('Image upload failed. Please try again or continue without an image.');
              }
              // Continue without image if upload fails
              console.log('Continuing transaction creation without image...');
              imageUrl = null;
            } else {
              // Get the public URL for the uploaded image
              const { data: { publicUrl } } = supabase.storage
                .from('transaction-images')
                .getPublicUrl(fileName);
              
              console.log('Image uploaded successfully. Public URL:', publicUrl);
              imageUrl = publicUrl;
            }
          } catch (uploadErr) {
            console.error('Unexpected error during image upload:', uploadErr);
            setUploadError('Image upload failed. Continuing without image.');
            imageUrl = null;
          }
        }

        // Prepare transaction data for database
        console.log('Preparing transaction data for database...');
        
        const transactionData = {
          user_id: user.id,
          address: formData.address,
          client_last_name: formData.clientLastName,
          status: formData.status,
          client_type: formData.clientType.charAt(0).toUpperCase() + formData.clientType.slice(1), // Capitalize first letter
          under_contract_date: formData.underContractDate || null,
          sales_price: formData.salePrice ? parseFloat(formData.salePrice.toString().replace(/[^0-9.-]/g, '')) : null,
          closing_date: formData.closingDate || null,
          gross_commission_income: formData.grossCommissionIncome ? parseFloat(formData.grossCommissionIncome) : null,
          image_url: imageUrl || null,
        };

        console.log('Transaction data to be saved:', transactionData);

        let result;
        if (editingTransaction?.id) {
          // Update existing transaction
          console.log('Updating existing transaction with ID:', editingTransaction.id);
          
          result = await retrySupabaseOperation(async () => {
            return await supabase
              .from('transactions')
              .update(transactionData)
              .eq('id', editingTransaction.id)
              .select();
          });
          
          console.log('Final update result:', result);
        } else {
          // Create new transaction
          console.log('Creating new transaction...');
          
          result = await retrySupabaseOperation(async () => {
            return await supabase
              .from('transactions')
              .insert([transactionData])
              .select();
          });
          
          console.log('Final insert result:', result);
        }

        if (result.error) {
          console.error('Final error after all retries:', {
            error: result.error,
            message: result.error?.message,
            details: result.error?.details,
            hint: result.error?.hint,
            code: result.error?.code,
            stack: result.error?.stack
          });
          
          // Provide user-friendly error message without exposing system details
          setUploadError(`Failed to save transaction. Please check your internet connection and try again.`);
          setIsSubmitting(false);
          return;
        }

        console.log('Transaction saved successfully!', result.data);
        
        // Show success state on button
        setShowSuccess(true);
        
        // Goals are now automatically updated by database trigger
        // Force Goals screen refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('goalsNeedRefresh'));
        
        // Hide success state after 2 seconds and close modal
        setTimeout(() => {
          setShowSuccess(false);
          
          // Call the parent's onSubmit callback
          onSubmit({
            ...formData,
            uploadedImage: uploadedFile || undefined
          });
          
          onClose();
          
          // Reset form
          setFormData({
            address: '',
            clientLastName: '',
            clientType: 'buyer',
            status: 'Active',
            underContractDate: '',
            salePrice: '',
            closingDate: '',
            grossCommissionIncome: '',
          });
          setUploadedFile(null);
          setImagePreview('');
          setExistingImageUrl('');
          setUploadError('');
          setIsSubmitting(false);
          setFocusedField('');
        }, 2000);
        
      } catch (error) {
        console.error('Error submitting transaction:', error);
        setUploadError('An unexpected error occurred while saving the transaction. Please try again.');
        setIsSubmitting(false);
        setShowSuccess(false);
      }
    };

    submitTransaction();
  };

  // Utility function to retry Supabase operations
  const retrySupabaseOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 500) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setRetryAttempt(attempt);
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for Supabase operation`);
        const result = await operation();
        
        if (!result.error) {
          console.log(`Supabase operation succeeded on attempt ${attempt}`);
          setRetryAttempt(0);
          return result;
        }
        
        // Log detailed error information
        console.error(`Attempt ${attempt} failed:`, {
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
        console.error(`Network error on attempt ${attempt}:`, networkError);
        
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {editingTransaction ? 'Edit Transaction' : 'Add a Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Error Message */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {uploadError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="Enter property address"
              required={!(formData.clientType === 'buyer' && formData.status === 'Active')}
            />
          </div>

          {/* Client Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Last Name
            </label>
            <input
              type="text"
              name="clientLastName"
              value={formData.clientLastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="Enter client's last name"
              required
            />
          </div>

          {/* Client Type - Buyer/Seller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="clientType"
                  value="buyer"
                  checked={formData.clientType === 'buyer'}
                  onChange={() => handleClientTypeChange('buyer')}
                  className="mr-2 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Buyer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="clientType"
                  value="seller"
                  checked={formData.clientType === 'seller'}
                  onChange={() => handleClientTypeChange('seller')}
                  className="mr-2 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Seller</span>
              </label>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleStatusChange('Active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.status === 'Active'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Under Contract')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.status === 'Under Contract'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Under Contract
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Closed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.status === 'Closed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Closed
              </button>
            </div>
          </div>

          {/* Under Contract Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Under Contract Date {formData.status !== 'Active' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              name="underContractDate"
              value={formData.underContractDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              required={formData.status !== 'Active'}
            />
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales Price {formData.status !== 'Active' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="salePrice"
              value={focusedField === 'salePrice' ? formData.salePrice : formatToCurrency(formData.salePrice)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
              required={formData.status !== 'Active'}
            />
          </div>

          {/* Closing Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closing Date {formData.status !== 'Active' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              name="closingDate"
              value={formData.closingDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              required={formData.status !== 'Active'}
            />
          </div>

          {/* Gross Commission Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gross Commission Income {formData.status === 'Closed' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="grossCommissionIncome"
              value={focusedField === 'grossCommissionIncome' ? formData.grossCommissionIncome : formatToCurrency(formData.grossCommissionIncome)}
              onChange={handleCurrencyInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-teal-600 text-white font-medium"
              placeholder="$0"
              required={formData.status === 'Closed'}
            />
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            
            {/* Show image preview or existing image */}
            {(imagePreview || (existingImageUrl && !uploadedFile)) && (
              <div className="mb-3">
                <img 
                  src={imagePreview || existingImageUrl} 
                  alt={imagePreview ? "Image preview" : "Current transaction image"} 
                  className="w-32 h-24 object-cover rounded-lg border border-gray-300"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {imagePreview ? "New image selected" : "Current image"}
                  </p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            
            {/* Upload area */}
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isProcessingImage 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300 hover:border-teal-500'
            }`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
                disabled={isProcessingImage}
              />
              <label
                htmlFor="image-upload"
                className={`${isProcessingImage ? 'cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center space-y-2`}
              >
                {isProcessingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">
                  {isProcessingImage 
                    ? 'Processing image...' 
                    : uploadedFile 
                      ? uploadedFile.name 
                      : existingImageUrl 
                        ? 'Click to replace image' 
                        : 'Click to upload image (max 5MB)'
                  }
                </span>
              </label>
            </div>
            
            {/* File size and type info */}
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, GIF, WebP. Maximum file size: 5MB.
            </p>
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
                ? 'Transaction Updated Successfully'
                : isSubmitting 
                  ? retryAttempt > 0 
                    ? `${editingTransaction ? 'Updating' : 'Creating'}... (Attempt ${retryAttempt})`
                    : (editingTransaction ? 'Updating...' : 'Creating...')
                  : (editingTransaction ? 'Update Transaction' : 'Create Transaction')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionEntryModal;

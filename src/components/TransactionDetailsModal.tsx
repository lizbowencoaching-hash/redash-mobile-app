import React from 'react';
import { X } from 'lucide-react';

// Helper function to format dates to MM/DD/YY
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

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

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

function TransactionDetailsModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onEdit, 
  onDelete 
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

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

  const handleEdit = () => {
    if (onEdit && transaction) {
      onEdit(transaction);
    }
  };

  const handleDelete = () => {
    if (onDelete && transaction) {
      onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-base font-medium text-gray-800 mb-4">Transaction Details</h3>
          </div>

          {/* Image or Status Rectangle */}
          <div className="flex justify-center mb-4">
            {transaction.uploadedImage ? (
              <img 
                src={transaction.uploadedImage} 
                alt="Transaction property" 
                className="w-32 h-20 object-cover rounded"
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
                    fallback.className = 'w-32 h-20 bg-gray-200 rounded flex items-center justify-center image-fallback';
                    fallback.innerHTML = '<span class="text-xs text-gray-500 text-center px-1">Image Unavailable</span>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : null}
          </div>

          {/* Address */}
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-700">{transaction.address}</span>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-gray-800">{transaction.status}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Client:</span>
              <span className="text-gray-800">{transaction.client}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Client Type:</span>
              <span className="text-gray-800">{transaction.clientType}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Sales Price:</span>
              <span className="text-gray-800">{transaction.salesPrice}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Under Contract Date:</span>
              <span className="text-gray-800">{formatDate(transaction.underContractDate || '')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Closing Date:</span>
              <span className="text-gray-800">{formatDate(transaction.closingDate)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Commission Income:</span>
              <span className="text-gray-800">{transaction.commissionIncome || 'N/A'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors font-medium text-sm"
            >
              Delete
            </button>
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors font-medium text-sm"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;

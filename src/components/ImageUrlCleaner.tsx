import React, { useState } from 'react';
import { clearAllImageUrls, verifyImageUrlsCleared } from '../utils/clearImageUrls.js';

function ImageUrlCleaner() {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState(null);
  const [verification, setVerification] = useState(null);

  const handleClearUrls = async () => {
    setIsClearing(true);
    setResult(null);
    setVerification(null);
    
    try {
      const clearResult = await clearAllImageUrls();
      setResult(clearResult);
      
      if (clearResult.success) {
        // Verify the clearing worked
        const verifyResult = await verifyImageUrlsCleared();
        setVerification(verifyResult);
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Image URL Cleaner</h2>
      <p className="text-sm text-gray-600 mb-4">
        This utility will clear all image URLs from your transactions table. 
        Use this before deleting and recreating your Supabase storage bucket.
      </p>
      
      <button
        onClick={handleClearUrls}
        disabled={isClearing}
        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
          isClearing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700'
        } text-white`}
      >
        {isClearing ? 'Clearing URLs...' : 'Clear All Image URLs'}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded-lg ${
          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result.success ? result.message : `Error: ${result.error}`}
        </div>
      )}
      
      {verification && (
        <div className={`mt-2 p-3 rounded-lg ${
          verification.success && verification.remainingUrls === 0 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {verification.success 
            ? `Verification: ${verification.remainingUrls} image URLs remaining`
            : `Verification failed: ${verification.error}`
          }
        </div>
      )}
      
      {result?.success && verification?.success && verification.remainingUrls === 0 && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <ol className="text-sm space-y-1">
            <li>1. Go to your Supabase dashboard</li>
            <li>2. Navigate to Storage section</li>
            <li>3. Delete the existing "transaction-images" bucket</li>
            <li>4. Create a new "transaction-images" bucket (make it public)</li>
            <li>5. Test uploading a new image in your app</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default ImageUrlCleaner;

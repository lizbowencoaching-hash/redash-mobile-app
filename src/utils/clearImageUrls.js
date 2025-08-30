import { supabase } from '../lib/supabase.ts';

/**
 * Utility function to clear all image URLs from the transactions table
 * This should be run before deleting and recreating the storage bucket
 */
export async function clearAllImageUrls() {
  try {
    console.log('Starting to clear all image URLs from transactions...');
    
    // Update all transactions to set image_url to null
    const { data, error } = await supabase
      .from('transactions')
      .update({ image_url: null })
      .not('image_url', 'is', null); // Only update rows that currently have image URLs
    
    if (error) {
      console.error('Error clearing image URLs:', error);
      throw error;
    }
    
    console.log('Successfully cleared image URLs from all transactions');
    console.log('Updated records:', data);
    
    return { success: true, message: 'All image URLs cleared successfully' };
  } catch (error) {
    console.error('Failed to clear image URLs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Function to verify that all image URLs have been cleared
 */
export async function verifyImageUrlsCleared() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, image_url')
      .not('image_url', 'is', null);
    
    if (error) {
      console.error('Error verifying image URLs:', error);
      throw error;
    }
    
    console.log('Transactions with remaining image URLs:', data);
    return { success: true, remainingUrls: data?.length || 0 };
  } catch (error) {
    console.error('Failed to verify image URLs:', error);
    return { success: false, error: error.message };
  }
}

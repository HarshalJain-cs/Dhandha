import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Supabase Client for Cloud Sync
 * Connects to Supabase cloud database for multi-branch synchronization
 */

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export const initializeSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠ Supabase credentials not configured. Multi-branch sync disabled.');
    console.warn('  Configure SUPABASE_URL and SUPABASE_KEY in .env to enable cloud sync.');
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Desktop app doesn't need session persistence
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'jewellery-erp-desktop',
        },
      },
    });

    console.log('✓ Supabase client initialized successfully');
    return supabaseClient;
  } catch (error: any) {
    console.error('✗ Failed to initialize Supabase client:', error.message);
    return null;
  }
};

/**
 * Get Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseClient) {
    return initializeSupabaseClient();
  }
  return supabaseClient;
};

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = (): boolean => {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;
};

/**
 * Test Supabase connection
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      message: 'Supabase not configured',
    };
  }

  try {
    // Test connection by querying a simple table
    const { error } = await client
      .from('sync_status')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Supabase connection successful',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection error: ${error.message}`,
    };
  }
};

/**
 * Close Supabase connection
 */
export const closeSupabaseConnection = async (): Promise<void> => {
  if (supabaseClient) {
    // Supabase client doesn't have explicit close method
    // Just nullify the instance
    supabaseClient = null;
    console.log('✓ Supabase client connection closed');
  }
};

export default {
  initializeSupabaseClient,
  getSupabaseClient,
  isSupabaseConfigured,
  testSupabaseConnection,
  closeSupabaseConnection,
};

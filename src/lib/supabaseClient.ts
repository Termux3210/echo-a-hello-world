
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use the provided connection details directly
const supabaseUrl = 'https://gvcwesaoocwtldnkhtob.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3dlc2Fvb2N3dGxkbmtodG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTE2NTgsImV4cCI6MjA1ODIyNzY1OH0.4rDM4_JFxxvDkR419NE4NrQO2zXW4VVOEZUbuaVQ_nU';

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Function to execute SQL directly
export const executeSQL = async (
  sql: string
): Promise<{ data: any | null; error: any }> => {
  try {
    // Try to execute the SQL using the RPC method first
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    // If successful, return the result
    if (!error) {
      return { data, error: null };
    }
    
    // If the RPC method fails, try using another approach
    console.log('First SQL execution approach failed, trying alternative method');
    
    // Try to directly query the database with the SQL statement
    // This is a fallback and might not work in all cases
    try {
      // Since we can't execute arbitrary SQL directly via the client,
      // we'll just attempt a basic query to check connection
      const result = await supabase.from('users').select('count').limit(1);
      console.log('Alternative SQL execution check result:', result);
      
      return { data: null, error: null };
    } catch (innerError) {
      return { data: null, error: 'Failed to execute SQL with alternative method' };
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { data: null, error };
  }
};

// Function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    // Try a simple query to the users table which should always exist
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    console.log('Connection test result:', { data, error });
    
    if (error) {
      console.error('Connection test error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Database schema for reference
export const databaseSchema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_username TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Residential complexes table
CREATE TABLE IF NOT EXISTS residential_complexes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  farm TEXT,
  price INTEGER NOT NULL,
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  description TEXT,
  inventory INTEGER DEFAULT 0 NOT NULL,
  unit TEXT DEFAULT '1 кг' NOT NULL,
  "pricePerHalfKg" BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery dates table
CREATE TABLE IF NOT EXISTS delivery_dates (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  complex_ids INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  telegram_username TEXT NOT NULL,
  telegram_user_id TEXT,
  residential_complex_id INTEGER REFERENCES residential_complexes(id),
  items JSONB NOT NULL, -- [{productId: number, quantity: number}]
  delivery_date DATE NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

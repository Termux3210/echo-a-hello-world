
import { supabase } from './supabaseClient';

/**
 * Ensures all required database tables exist and have the correct structure
 */
export async function ensureDatabaseTables() {
  console.log("Ensuring database tables exist...");
  
  try {
    // Прямая проверка таблиц (без чтения sql файла)
    await checkTableExistence();
  } catch (error) {
    console.error("Error ensuring database tables:", error);
  }
}

async function checkTableExistence() {
  try {
    console.log("Checking if required tables exist...");
    
    // Check if orders table exists with telegram_user_id column
    const { error: orderTableError } = await supabase
      .from('orders')
      .select('telegram_user_id')
      .limit(1);
    
    if (orderTableError && orderTableError.code === '42P01') {
      console.error("Orders table doesn't exist:", orderTableError);
      await createOrdersTable();
    } else {
      console.log("Orders table exists and includes telegram_user_id column");
    }
    
    // Check if settings table exists
    const { error: settingsTableError } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    if (settingsTableError && settingsTableError.code === '42P01') {
      console.error("Settings table doesn't exist:", settingsTableError);
      await createSettingsTable();
    } else {
      console.log("Settings table exists");
    }
    
    // Check if users table exists
    const { error: usersTableError } = await supabase
      .from('users')
      .select('telegram_username')
      .limit(1);
    
    if (usersTableError && usersTableError.code === '42P01') {
      console.error("Users table doesn't exist:", usersTableError);
      await createUsersTable();
    } else {
      console.log("Users table exists");
    }
  } catch (error) {
    console.error("Error checking table existence:", error);
  }
}

// Create tables if they don't exist
async function createOrdersTable() {
  try {
    console.log("Creating orders table...");
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          customer_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          telegram_username TEXT NOT NULL,
          telegram_user_id TEXT,
          residential_complex_id INTEGER REFERENCES residential_complexes(id),
          items JSONB NOT NULL,
          delivery_date DATE NOT NULL,
          address TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (error) {
      console.error("Failed to create orders table:", error);
    } else {
      console.log("Orders table created successfully");
    }
  } catch (error) {
    console.error("Error creating orders table:", error);
  }
}

async function createSettingsTable() {
  try {
    console.log("Creating settings table...");
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (error) {
      console.error("Failed to create settings table:", error);
    } else {
      console.log("Settings table created successfully");
    }
  } catch (error) {
    console.error("Error creating settings table:", error);
  }
}

async function createUsersTable() {
  try {
    console.log("Creating users table...");
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          telegram_username TEXT NOT NULL UNIQUE,
          name TEXT,
          phone TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (error) {
      console.error("Failed to create users table:", error);
    } else {
      console.log("Users table created successfully");
    }
  } catch (error) {
    console.error("Error creating users table:", error);
  }
}

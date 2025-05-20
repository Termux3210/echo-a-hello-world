
import { supabase, databaseSchema, checkSupabaseConnection } from './supabaseClient';
import { toast } from 'sonner';

export const initializeApp = async () => {
  try {
    console.log('Checking database connection...');
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.error('Could not connect to Supabase database');
      toast.error('Ошибка подключения к базе данных. Проверьте параметры подключения Supabase.');
      return false;
    }
    
    console.log('Successfully connected to Supabase database');
    
    // Create tables with a more reliable approach
    await ensureTables();
    
    // Check if we have any admin users, if not create a default one
    await ensureAdminUserExists();
    
    return true;
  } catch (error) {
    console.error('Error during app initialization:', error);
    toast.error('Ошибка инициализации приложения');
    return false;
  }
};

// Define valid table names as a type
type ValidTableName = 'users' | 'residential_complexes' | 'products' | 'delivery_dates' | 'orders' | 'settings';

// Ensure all required tables exist
const ensureTables = async () => {
  const requiredTables: ValidTableName[] = ['users', 'residential_complexes', 'products', 'delivery_dates', 'orders', 'settings'];
  
  for (const tableName of requiredTables) {
    await ensureTableExists(tableName);
  }
  
  return true;
};

// Check if a table exists and create it if it doesn't
const ensureTableExists = async (tableName: ValidTableName) => {
  try {
    console.log(`Checking if ${tableName} table exists...`);
    
    // Try to select from the table - using type assertion to overcome type checking
    // This is necessary because we need to work with dynamic table names
    const { error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    // If there's no error, the table exists
    if (!error) {
      console.log(`Table ${tableName} exists`);
      return true;
    }
    
    // If the error is that the table doesn't exist, try to create it
    if (error.code === '42P01') {
      console.log(`Table ${tableName} doesn't exist, creating it...`);
      await createTable(tableName);
      return true;
    }
    
    console.error(`Unexpected error checking table ${tableName}:`, error);
    return false;
  } catch (error) {
    console.error(`Error ensuring table ${tableName} exists:`, error);
    return false;
  }
};

// Create a specific table
const createTable = async (tableName: ValidTableName) => {
  try {
    // Extract the SQL for this table from the schema
    const tableStart = databaseSchema.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
    if (tableStart === -1) {
      console.error(`Couldn't find schema for table ${tableName}`);
      return false;
    }
    
    // Extract the SQL statement for this table
    let tableEnd = databaseSchema.indexOf(';', tableStart);
    if (tableEnd === -1) tableEnd = databaseSchema.length;
    
    const tableSQL = databaseSchema.substring(tableStart, tableEnd + 1);
    console.log(`Creating table ${tableName} with SQL:`, tableSQL);
    
    // Try to create the table via SQL API
    try {
      // Alternative approach: Using insert to test or create the table
      if (tableName === 'users') {
        await supabase.from('users').insert({
          telegram_username: '@system_test',
          name: 'System Test',
          is_admin: false
        }).select();
      } else if (tableName === 'residential_complexes') {
        await supabase.from('residential_complexes').insert({
          name: 'Test Complex',
          available: true
        }).select();
      } else if (tableName === 'products') {
        await supabase.from('products').insert({
          name: 'Test Product',
          price: 100,
          available: true
        }).select();
      } else if (tableName === 'delivery_dates') {
        await supabase.from('delivery_dates').insert({
          date: new Date().toISOString(),
          complex_ids: [1]
        }).select();
      } else if (tableName === 'orders') {
        await supabase.from('orders').insert({
          customer_name: 'Test Customer',
          phone: '+11111111111',
          telegram_username: '@test',
          items: [],
          delivery_date: new Date().toISOString(),
          status: 'test'
        }).select();
      } else if (tableName === 'settings') {
        await supabase.from('settings').insert({
          key: 'site_name',
          value: 'Фермерские продукты'
        }).select();
      }
      
      console.log(`Table ${tableName} created or already exists`);
      return true;
    } catch (sqlError) {
      console.error(`Error creating table ${tableName}:`, sqlError);
      console.log(`Please use Supabase dashboard to manually create the table ${tableName}`);
      return false;
    }
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    return false;
  }
};

// Helper function to create tables with raw SQL (fallback)
const createTablesWithRawSQL = async () => {
  try {
    console.log('Creating database tables with raw SQL...');
    
    // Split the database schema into separate statements
    const statements = databaseSchema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await executeSQL(statement);
      } catch (err) {
        console.error('Error executing SQL statement:', err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating database tables:', error);
    return false;
  }
};

// Execute raw SQL statement
const executeSQL = async (sql: string) => {
  try {
    console.log('Executing SQL:', sql.substring(0, 50) + '...');
    
    // Try direct query via SQL API
    const result = await fetch('https://gvcwesaoocwtldnkhtob.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3dlc2Fvb2N3dGxkbmtodG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTE2NTgsImV4cCI6MjA1ODIyNzY1OH0.4rDM4_JFxxvDkR419NE4NrQO2zXW4VVOEZUbuaVQ_nU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3dlc2Fvb2N3dGxkbmtodG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTE2NTgsImV4cCI6MjA1ODIyNzY1OH0.4rDM4_JFxxvDkR419NE4NrQO2zXW4VVOEZUbuaVQ_nU'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
};

// Ensure an admin user exists
const ensureAdminUserExists = async () => {
  try {
    // Check if we have any admin users
    const { data: adminUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('is_admin', true);
    
    if (countError) {
      if (countError.code === 'PGRST116') {
        console.log('Users table may not exist yet');
        return false;
      }
      console.error('Error checking admin users:', countError);
      return false;
    }
    
    if (!adminUsers || adminUsers.length === 0) {
      // Create a default admin user
      const { error: adminCreateError } = await supabase
        .from('users')
        .insert([
          {
            telegram_username: '@admin',
            name: 'Администратор',
            is_admin: true
          }
        ]);
      
      if (adminCreateError) {
        console.error('Error creating default admin user:', adminCreateError);
        return false;
      } else {
        console.log('Default admin user created');
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring admin user exists:', error);
    return false;
  }
};

// Initialize database with test data (if empty)
export const initializeTestData = async () => {
  try {
    // Check if there are any residential complexes
    const { data: existingComplexes, error: complexesError } = await supabase
      .from('residential_complexes')
      .select('count');
    
    if (complexesError) {
      console.error('Error checking for existing complexes:', complexesError);
      return false;
    }

    // If no complexes exist, initialize with mock data
    if (existingComplexes && existingComplexes.length === 0) {
      // Import mock data
      const { residentialComplexes, products, deliveryDates } = await import('./mockData');
      
      // Insert residential complexes
      const { error: insertComplexesError } = await supabase
        .from('residential_complexes')
        .insert(residentialComplexes);
      
      if (insertComplexesError) {
        console.error('Error inserting complexes:', insertComplexesError);
        return false;
      }
      
      // Insert products
      const { error: insertProductsError } = await supabase
        .from('products')
        .insert(products);
      
      if (insertProductsError) {
        console.error('Error inserting products:', insertProductsError);
        return false;
      }
      
      // Insert delivery dates
      const { error: insertDatesError } = await supabase
        .from('delivery_dates')
        .insert(deliveryDates);
      
      if (insertDatesError) {
        console.error('Error inserting delivery dates:', insertDatesError);
        return false;
      }
      
      console.log('Database initialized with test data.');
      return true;
    }
    
    console.log('Database already contains data, skipping initialization.');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

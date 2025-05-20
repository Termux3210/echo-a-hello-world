
-- Ensure users table exists
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_username TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure orders table exists
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

-- Ensure telegram_user_id column exists in orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'telegram_user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN telegram_user_id TEXT;
  END IF;
END $$;

-- Ensure products table exists with all needed columns
DO $$
BEGIN
  -- Add inventory column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'inventory'
  ) THEN
    ALTER TABLE products ADD COLUMN inventory INTEGER DEFAULT 0 NOT NULL;
  ELSE
    -- Update existing column to NOT NULL with default
    ALTER TABLE products ALTER COLUMN inventory SET DEFAULT 0;
    ALTER TABLE products ALTER COLUMN inventory SET NOT NULL;
  END IF;
  
  -- Add unit column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit TEXT DEFAULT '1 кг' NOT NULL;
  ELSE
    -- Update existing column to NOT NULL with default
    ALTER TABLE products ALTER COLUMN unit SET DEFAULT '1 кг';
    ALTER TABLE products ALTER COLUMN unit SET NOT NULL;
  END IF;
  
  -- Add pricePerHalfKg column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'pricePerHalfKg'
  ) THEN
    ALTER TABLE products ADD COLUMN "pricePerHalfKg" BOOLEAN DEFAULT FALSE NOT NULL;
  ELSE
    -- Update existing column to NOT NULL with default
    ALTER TABLE products ALTER COLUMN "pricePerHalfKg" SET DEFAULT FALSE;
    ALTER TABLE products ALTER COLUMN "pricePerHalfKg" SET NOT NULL;
  END IF;
END $$;

-- Make sure existing inventory values are not NULL
UPDATE products SET inventory = 0 WHERE inventory IS NULL;
UPDATE products SET unit = '1 кг' WHERE unit IS NULL;
UPDATE products SET "pricePerHalfKg" = FALSE WHERE "pricePerHalfKg" IS NULL;

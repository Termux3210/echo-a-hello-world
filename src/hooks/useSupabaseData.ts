
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/lib/database.types';
import { executeSQL } from '@/lib/supabaseClient';

// Define base product type from database
type DbProduct = Database['public']['Tables']['products']['Row'];

// Define the extended product type to include required properties
export interface ExtendedProduct extends DbProduct {
  inventory: number;
  unit: string;
  pricePerHalfKg: boolean;
}

export const useComplexes = () => {
  return useQuery({
    queryKey: ['complexes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residential_complexes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAvailableComplexes = () => {
  return useQuery({
    queryKey: ['complexes', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residential_complexes')
        .select('*')
        .eq('available', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Ensure schema is ready before querying products
      await ensureProductSchema();
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform data to ensure all products have the required fields
      return (data || []).map(product => ({
        ...product,
        inventory: product.inventory !== undefined ? product.inventory : 0,
        pricePerHalfKg: product.pricePerHalfKg !== undefined ? product.pricePerHalfKg : false,
        unit: product.unit || '1 кг'
      })) as ExtendedProduct[];
    }
  });
};

export const useAvailableProducts = () => {
  return useQuery({
    queryKey: ['products', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('name');
      
      if (error) throw error;
      
      // Transform data to ensure all products have the required fields
      return (data || []).map(product => ({
        ...product,
        inventory: product.inventory !== undefined ? product.inventory : 0,
        pricePerHalfKg: product.pricePerHalfKg !== undefined ? product.pricePerHalfKg : false,
        unit: product.unit || '1 кг'
      })) as ExtendedProduct[];
    }
  });
};

export const useProductById = (productId: number | string) => {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', typeof productId === 'string' ? parseInt(productId, 10) : productId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          inventory: data.inventory !== undefined ? data.inventory : 0,
          pricePerHalfKg: data.pricePerHalfKg !== undefined ? data.pricePerHalfKg : false,
          unit: data.unit || '1 кг'
        } as ExtendedProduct;
      }
      
      return null;
    },
    enabled: !!productId
  });
};

export const useDeliveryDates = () => {
  return useQuery({
    queryKey: ['delivery_dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_dates')
        .select('*')
        .order('date');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useNextDeliveryDate = () => {
  return useQuery({
    queryKey: ['delivery_dates', 'next'],
    queryFn: async () => {
      const today = new Date();
      // Set to previous day to include today's deliveries
      today.setDate(today.getDate() - 1); 
      
      const { data, error } = await supabase
        .from('delivery_dates')
        .select('*')
        .gte('date', today.toISOString())
        .order('date')
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    }
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAdmins = () => {
  return useQuery({
    queryKey: ['users', 'admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_admin', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useUserByTelegramUsername = (username: string | null) => {
  return useQuery({
    queryKey: ['users', 'by-telegram', username],
    queryFn: async () => {
      if (!username) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_username', username)
        .maybeSingle();
      
      if (error) {
        if (error.code === 'PGRST116') { // Resource not found
          return null;
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!username
  });
};

export const addAdmin = async (telegramUsername: string, name: string) => {
  // Format username to always start with @
  const formattedUsername = telegramUsername.startsWith('@') 
    ? telegramUsername 
    : `@${telegramUsername}`;

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_username', formattedUsername)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      // Update existing user to admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_admin: true,
          name: name || existingUser.name
        })
        .eq('telegram_username', formattedUsername);

      if (updateError) throw updateError;
    } else {
      // Create new admin user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_username: formattedUsername,
          name: name,
          is_admin: true
        });

      if (insertError) throw insertError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding admin:', error);
    return { success: false, error };
  }
};

export const removeAdmin = async (userId: number) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_admin: false })
      .eq('id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing admin:', error);
    return { success: false, error };
  }
};

export const ensureProductSchema = async () => {
  console.log("Ensuring product schema is up to date...");
  
  try {
    // First try a simple check if columns already exist
    try {
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('inventory, unit, "pricePerHalfKg"')
        .limit(1);
      
      if (!testError) {
        console.log("Product schema already includes all required fields");
        return true;
      } else {
        console.log("Need to update product schema:", testError);
      }
    } catch (e) {
      console.log("Error checking schema, will attempt to update:", e);
    }
    
    // Direct SQL approach using executeSQL helper
    try {
      const sqlQuery = `
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS inventory INTEGER DEFAULT 0;
        
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '1 кг';
        
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS "pricePerHalfKg" BOOLEAN DEFAULT FALSE;
        
        -- Ensure existing rows have values
        UPDATE products SET inventory = 0 WHERE inventory IS NULL;
        UPDATE products SET unit = '1 кг' WHERE unit IS NULL;
        UPDATE products SET "pricePerHalfKg" = FALSE WHERE "pricePerHalfKg" IS NULL;
      `;
      
      const { error: sqlError } = await executeSQL(sqlQuery);
      
      if (!sqlError) {
        console.log("Successfully updated schema using executeSQL helper");
        
        // Force schema refresh by making a dummy query
        try {
          await supabase.rpc('exec_sql', { query: 'SELECT 1 as version' });
        } catch (e) {
          console.log("Error refreshing schema cache:", e);
        }
        
        // Wait a bit for schema cache to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
      } else {
        console.error("SQL execution error:", sqlError);
      }
    } catch (sqlException) {
      console.error("Exception during executeSQL method:", sqlException);
    }
    
    // Fallback method: Try updating a product directly
    try {
      console.log("Trying fallback method to update schema...");
      
      // Get first product
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (products && products.length > 0) {
        // Attempt a direct upsert to force column creation
        const { error: upsertError } = await supabase.rpc('exec_sql', {
          query: `
            UPDATE products 
            SET 
              inventory = 0,
              unit = '1 кг',
              "pricePerHalfKg" = FALSE
            WHERE id = ${products[0].id};
          `
        });
        
        if (!upsertError) {
          console.log("Schema updated using direct SQL update");
          return true;
        }
      }
    } catch (fallbackException) {
      console.error("Exception during fallback method:", fallbackException);
    }
    
    // Final check to see if our efforts worked
    try {
      const { error: finalCheckError } = await supabase
        .from('products')
        .select('inventory, unit, "pricePerHalfKg"')
        .limit(1);
      
      if (!finalCheckError) {
        console.log("Final check shows schema is now working properly");
        return true;
      } else {
        console.error("Schema still not updated after all attempts:", finalCheckError);
      }
    } catch (finalCheckException) {
      console.error("Exception during final schema check:", finalCheckException);
    }
    
    console.error("All schema update methods failed");
    return false;
  } catch (error) {
    console.error('Error ensuring product schema:', error);
    return false;
  }
};


import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  complexId: number;
  deliveryDate: string;
  pricePerHalfKg?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (value.length > 100000) {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey !== 'cart' && storageKey !== 'selectedComplex' && 
              !storageKey.startsWith('sb-')) {
            localStorage.removeItem(storageKey);
          }
        }
      }
      
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      if (key === 'cart') {
        try {
          const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
          const reducedCart = currentCart.slice(-5);
          localStorage.setItem('cart', JSON.stringify(reducedCart));
          console.log('Reduced cart size to prevent storage errors');
          return true;
        } catch (e) {
          console.error('Failed to reduce cart size:', e);
          return false;
        }
      }
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = safeLocalStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        safeLocalStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      try {
        const itemsToSave = items.length > 20 ? items.slice(-20) : items;
        const success = safeLocalStorage.setItem('cart', JSON.stringify(itemsToSave));
        
        if (!success && items.length > 5) {
          setItems(prev => prev.slice(-5));
          toast.error('Корзина уменьшена из-за ограничений хранилища');
        }
      } catch (error) {
        console.error('Error storing cart in localStorage:', error);
      }
    } else {
      safeLocalStorage.removeItem('cart');
    }
  }, [items]);

  const updateProductInventory = async (productId: number, quantityDelta: number) => {
    try {
      // Получаем текущее состояние товара
      const { data: product, error: getError } = await supabase
        .from('products')
        .select('inventory, pricePerHalfKg')
        .eq('id', productId)
        .single();
      
      if (getError) {
        console.error('Ошибка получения инвентаря:', getError);
        return false;
      }
      
      console.log(`Текущий инвентарь для товара ${productId}:`, product);
      
      // Корректируем количество для товаров, продаваемых на вес (по 0.5 кг)
      const adjustedDelta = product.pricePerHalfKg ? quantityDelta * 0.5 : quantityDelta;
      
      // Рассчитываем новое количество, предотвращая отрицательные значения
      const currentInventory = typeof product.inventory === 'number' ? product.inventory : 0;
      const newInventory = Math.max(0, currentInventory - adjustedDelta);
      
      console.log(`Обновляем инвентарь для товара ${productId}: ${currentInventory} → ${newInventory} (изменение: ${adjustedDelta})`);
      
      // Обновляем инвентарь в базе данных
      const { error: updateError } = await supabase
        .from('products')
        .update({ inventory: newInventory })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Ошибка обновления инвентаря:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка в updateProductInventory:', error);
      return false;
    }
  };

  const addToCart = (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === newItem.productId
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const oldQuantity = updatedItems[existingItemIndex].quantity;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: oldQuantity + newItem.quantity
        };
        
        updateProductInventory(newItem.productId, newItem.quantity);
        
        return updatedItems;
      } else {
        if (prevItems.length >= 20) {
          toast.warning('Корзина слишком большая. Самые старые товары будут удалены.');
          
          updateProductInventory(newItem.productId, newItem.quantity);
          
          return [...prevItems.slice(-19), newItem];
        } else {
          updateProductInventory(newItem.productId, newItem.quantity);
          
          return [...prevItems, newItem];
        }
      }
    });
  };

  const removeFromCart = (productId: number) => {
    const item = items.find(item => item.productId === productId);
    
    if (item) {
      updateProductInventory(productId, -item.quantity);
    }
    
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast.success('Товар удален из корзины');
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems => {
      const item = prevItems.find(item => item.productId === productId);
      
      if (item) {
        const quantityDelta = quantity - item.quantity;
        
        if (quantityDelta !== 0) {
          updateProductInventory(productId, quantityDelta);
        }
      }
      
      return prevItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    items.forEach(item => {
      updateProductInventory(item.productId, -item.quantity);
    });
    
    setItems([]);
    safeLocalStorage.removeItem('cart');
    toast.success('Корзина очищена');
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

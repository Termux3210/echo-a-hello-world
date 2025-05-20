
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, X, Settings, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { useNextDeliveryDate } from "@/hooks/useSupabaseData";
import { useCart } from "@/hooks/useCart";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showMenu?: boolean;
}

export function Header({ title, showSearch = true, showMenu = true }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { data: nextDelivery, isLoading } = useNextDeliveryDate();
  const { getCartItemCount } = useCart();
  const cartItemCount = getCartItemCount();
  
  // Format date for display
  const formatDeliveryDate = (dateString: string | null) => {
    if (!dateString) return "ближайшую дату";
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    
    const formattedDate = date.toLocaleDateString('ru-RU', options);
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };
  
  return (
    <header className="w-full bg-white">
      {/* Attention Banner with improved contrast */}
      {nextDelivery && (
        <div className="w-full bg-purple-100 py-4 text-center animate-fade-in border-b border-purple-200">
          <p className="text-primary font-semibold text-lg mb-1">Внимание!</p>
          <p className="text-gray-900 font-medium">
            Сбор заказов на <span className="text-primary underline decoration-dotted">{formatDeliveryDate(nextDelivery?.date || null)}</span>
          </p>
        </div>
      )}
      
      {/* Main Header with improved contrast */}
      <div className="w-full px-4 py-3 flex items-center justify-between bg-white shadow-md">
        {isSearchOpen ? (
          <div className="w-full flex items-center gap-2 animate-fade-in">
            <input
              type="text"
              placeholder="Я ищу..."
              className="w-full px-4 py-2 rounded-full bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsSearchOpen(false)}
            >
              <X className="h-5 w-5 text-gray-900" />
            </Button>
          </div>
        ) : (
          <>
            {/* Left side */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5 text-gray-900" />
              </Button>
            )}
            
            {/* Center - Title or Logo */}
            <div className="flex-1 text-center">
              {title ? (
                <h1 className="text-lg font-medium text-gray-900">{title}</h1>
              ) : null}
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-2">
              <Link to="/cart" className="relative mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <ShoppingCart className="h-5 w-5 text-gray-900" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
            
              {showMenu && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu className="h-5 w-5 text-gray-900" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Menu Panel with improved contrast */}
      {isMenuOpen && (
        <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 animate-slide-in">
          <div className="flex justify-between items-center p-4 border-b bg-secondary/50">
            <h2 className="font-medium text-gray-900">Меню</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
              <X className="h-5 w-5 text-gray-900" />
            </Button>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {/* Show delivery date prominently in the menu */}
              {nextDelivery && (
                <li className="p-3 mb-3 bg-purple-50 rounded-md border border-purple-100">
                  <p className="text-sm font-medium text-gray-700">Ближайшая доставка:</p>
                  <p className="text-primary font-semibold">{formatDeliveryDate(nextDelivery?.date || null)}</p>
                </li>
              )}
              
              <li>
                <Link 
                  to="/" 
                  className="block p-2 rounded-md hover:bg-secondary transition-colors text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Главная
                </Link>
              </li>
              <li>
                <Link 
                  to="/cart" 
                  className="block p-2 rounded-md hover:bg-secondary transition-colors text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Корзина
                </Link>
              </li>
              {isAdmin && (
                <>
                  <li className="pt-2 border-t">
                    <Link 
                      to="/admin" 
                      className="block p-2 rounded-md hover:bg-secondary transition-colors text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Админ панель
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/crm" 
                      className="block p-2 rounded-md hover:bg-secondary transition-colors text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      CRM
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/settings-admin" 
                      className="block p-2 rounded-md hover:bg-secondary transition-colors text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-gray-900" />
                        <span>Настройки</span>
                      </div>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
      
      {/* Overlay for menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}

export default Header;


import { MapPin } from "lucide-react";
import { useAvailableComplexes } from "@/hooks/useSupabaseData";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComplexContext } from "@/hooks/useComplex";

interface ComplexSelectorProps {
  selectedComplex: number | null;
}

export default function ComplexSelector({ selectedComplex }: ComplexSelectorProps) {
  const { data: complexes } = useAvailableComplexes();
  const { isAdmin } = useAdmin();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const { selectedComplex: contextComplex } = useComplexContext();
  
  const getSelectedComplexName = () => {
    if (!selectedComplex || !complexes) return "Не выбран";
    const complex = complexes.find(c => c.id === selectedComplex);
    return complex ? complex.name : "Не выбран";
  };
  
  const goToCart = () => {
    navigate("/cart");
  };
  
  const goToAdmin = () => {
    navigate("/admin");
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap justify-between items-center gap-4 border border-gray-100">
      <div className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-lg">
        <MapPin className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-gray-700">Ваш ЖК:</p>
          <p className="font-medium text-gray-900">{getSelectedComplexName()}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={goToAdmin} className="flex items-center gap-1">
            <Store className="h-4 w-4" />
            <span>Админ</span>
          </Button>
        )}
        
        <Button onClick={goToCart} variant="default" className="flex items-center gap-1 relative">
          <ShoppingCart className="h-4 w-4" />
          <span>Корзина</span>
          {getCartItemCount() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground">
              {getCartItemCount()}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}

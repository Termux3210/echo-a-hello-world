import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useComplexContext } from "@/hooks/useComplex";
import { useCart } from "@/hooks/useCart";
import { ExtendedProduct } from "@/hooks/useSupabaseData";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ProductQuantityInput } from "./ProductQuantityInput";
import { useState } from "react";

interface ProductCardProps {
  product: ExtendedProduct;
  deliveryDate: string;
}

const ProductCard = ({ product, deliveryDate }: ProductCardProps) => {
  const { selectedComplex } = useComplexContext();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    if (!selectedComplex) {
      toast.error("Выберите жилой комплекс перед добавлением товаров в корзину");
      return;
    }
    
    if (!deliveryDate) {
      toast.error("Выберите дату доставки перед добавлением товаров в корзину");
      return;
    }
    
    const availableQuantity = product.pricePerHalfKg ? product.inventory * 2 : product.inventory;
    if (availableQuantity < 1) {
      toast.error("Товар закончился");
      return;
    }
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      complexId: selectedComplex.id,
      deliveryDate: deliveryDate,
      pricePerHalfKg: product.pricePerHalfKg
    });
    
    toast.success(`"${product.name}" добавлен в корзину`);
    
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'available'] });
    }, 500);
  };
  
  const navigateToDetails = () => {
    navigate(`/product/${product.id}`);
  };
  
  const formatPrice = () => {
    return `${product.price} ₽ ${product.pricePerHalfKg ? '/ 0.5 кг' : `/ ${product.unit}`}`;
  };
  
  const displayInventory = () => {
    if (typeof product.inventory !== 'number' || product.inventory === 0) {
      return <Badge variant="destructive" className="absolute top-2 right-2">Нет в наличии</Badge>;
    }
    
    const displayValue = product.pricePerHalfKg 
      ? `${product.inventory * 2} шт`
      : `${product.inventory} ${product.unit}`;
      
    return (
      <Badge 
        variant="secondary" 
        className="absolute top-2 right-2 bg-white/80 text-gray-900 border border-gray-200 shadow-sm"
      >
        Осталось: {displayValue}
      </Badge>
    );
  };
  
  const isProductAvailable = product.available && product.inventory > 0;

  if (!product) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card 
      className={cn(
        "w-full overflow-hidden", 
        !isProductAvailable && "opacity-50 pointer-events-none"
      )}
    >
      <div 
        className="w-full aspect-square bg-muted cursor-pointer relative" 
        onClick={navigateToDetails}
      >
        <img 
          src={product.image || "/placeholder.svg"} 
          alt={product.name}
          className={cn(
            "w-full h-full object-cover", 
            !isProductAvailable && "grayscale"
          )}
        />
        {!isProductAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="text-white bg-black/50 px-4 py-2 rounded-lg">
              Нет в наличии
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          {displayInventory()}
        </div>
      </div>
      
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg cursor-pointer" onClick={navigateToDetails}>
          {product.name}
        </CardTitle>
        <CardDescription>
          {product.farm}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 pt-2 pb-0">
        <div className="font-bold text-xl">
          {formatPrice()}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 flex flex-col gap-3">
        <ProductQuantityInput
          quantity={quantity}
          onChange={setQuantity}
          max={product.inventory}
        />
        <Button 
          className="w-full" 
          onClick={handleAddToCart}
          disabled={!isProductAvailable}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          В корзину
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

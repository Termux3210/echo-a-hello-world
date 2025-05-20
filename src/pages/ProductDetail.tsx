import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShoppingCart, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useProductById } from "@/hooks/useSupabaseData";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  farm: string | null;
  price: number;
  image: string | null;
  description: string | null;
  available: boolean;
  created_at: string;
  inventory: number;
  unit?: string;
  pricePerHalfKg?: boolean;
}

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, items } = useCart();
  
  const { 
    data: product, 
    isLoading,
    error
  } = useProductById(productId || '');
  
  const isInCart = items.some(item => product && item.productId === product.id);
  
  useEffect(() => {
    if (error) {
      toast.error('Ошибка при загрузке товара');
      console.error('Error fetching product:', error);
    }
  }, [error]);

  useEffect(() => {
    if (!isLoading && product && (!product.available || (product.inventory <= 0))) {
      toast.error('Этот товар недоступен для заказа');
      navigate('/');
    }
  }, [isLoading, product, navigate]);
  
  const [quantity, setQuantity] = useState(1);
  
  const increaseQuantity = () => {
    if (product && quantity < product.inventory) {
      setQuantity(prev => prev + 1);
    } else {
      toast.error('Недостаточно товара в наличии');
    }
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  const goBack = () => {
    navigate(-1);
  };

  const handleCartAction = () => {
    if (!product) return;
    
    if (isInCart) {
      removeFromCart(product.id);
      toast.success(`${product.name} удален из корзины`);
    } else {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        complexId: 0,
        deliveryDate: '',
        pricePerHalfKg: product.pricePerHalfKg
      });
      
      toast.success(`${quantity} ${product.name} добавлен в корзину`);
    }
  };
  
  const isProductAvailable = product && product.available && product.inventory > 0;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4 pl-0" 
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !product ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Товар не найден</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square bg-secondary">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">Изображение отсутствует</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                
                {product.farm && (
                  <p className="text-muted-foreground mt-1">Ферма: {product.farm}</p>
                )}
                
                <div className="mt-4 mb-6">
                  <p className="text-3xl font-semibold text-primary">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.pricePerHalfKg ? "за 0.5 кг" : `за ${product.unit || "1 кг"}`}
                  </p>
                </div>
                
                {product.description && (
                  <div className="mt-2 mb-6">
                    <h2 className="font-semibold text-lg mb-2">Описание</h2>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                )}
                
                <div className="mt-auto">
                  {isProductAvailable ? (
                    <div className="space-y-4">
                      {!isInCart && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-4">Количество:</span>
                          <div className="flex items-center">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={decreaseQuantity} 
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="mx-4 font-medium">{quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={increaseQuantity}
                              disabled={product.inventory <= quantity}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className={cn("w-full py-6", isInCart && "bg-green-500 hover:bg-green-600")} 
                        onClick={handleCartAction}
                      >
                        {isInCart ? (
                          <>
                            <Check className="mr-2 h-5 w-5" />
                            Удалить из корзины
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Добавить в корзину
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-700 p-4 rounded-md">
                      <p className="font-medium">Нет в наличии</p>
                      <p className="text-sm text-muted-foreground mt-1">К сожалению, этот товар временно недоступен.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;

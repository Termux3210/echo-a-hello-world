
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import { useAvailableProducts, useNextDeliveryDate, ExtendedProduct } from "@/hooks/useSupabaseData";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

interface ProductsGridProps {
  selectedComplex: number | null;
}

export default function ProductsGrid({ selectedComplex }: ProductsGridProps) {
  const { data: products, isLoading } = useAvailableProducts();
  const { data: nextDelivery } = useNextDeliveryDate();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (product: ExtendedProduct) => {
    if (!selectedComplex) {
      toast.error("Пожалуйста, выберите ЖК для доставки");
      return;
    }
    
    if (!nextDelivery) {
      toast.error("Нет доступных дат доставки");
      return;
    }
    
    if (nextDelivery.complex_ids && !nextDelivery.complex_ids.includes(selectedComplex)) {
      toast.error("Выбранный ЖК не входит в список доставки на ближайшую дату");
      return;
    }
    
    // Check if product has inventory available
    if (product.inventory <= 0) {
      toast.error(`"${product.name}" нет в наличии`);
      return;
    }
    
    // Calculate quantity based on price unit
    const quantity = product.pricePerHalfKg ? 0.5 : 1;
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      complexId: selectedComplex,
      deliveryDate: nextDelivery.date,
      pricePerHalfKg: product.pricePerHalfKg
    });
    
    toast.success(`"${product.name}" добавлен в корзину`);
  };

  const viewProductDetails = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="mt-10 mb-20">
      <h2 className="text-xl font-semibold mb-4 flex items-center contrast-bg px-3 py-1.5 rounded-lg">
        <Leaf className="mr-2 h-5 w-5 text-primary" />
        <span className="text-gray-900">Фермерские продукты</span>
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              deliveryDate={nextDelivery?.date || ""}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm">
          <p className="text-gray-900">Нет доступных продуктов</p>
        </div>
      )}
    </div>
  );
}

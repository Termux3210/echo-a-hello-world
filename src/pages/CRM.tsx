
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useOrders, useComplexes, useProducts } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Search, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { updateOrderStatus } from "@/lib/orderService";
import { getSettingsSync } from "@/lib/settingsService";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrderTable } from "@/components/OrderTable";
import { Button } from "@/components/ui/button";
import { VehicleAssignmentModal } from "@/components/VehicleAssignmentModal";

// Типы для заказов и комплексов
interface Complex {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  available?: boolean;
  inventory?: number;
  pricePerHalfKg?: boolean;
  unit?: string;
}

// Extend Order type to include complex_name
interface ExtendedOrder {
  id: number;
  customer_name: string;
  phone: string;
  telegram_username: string;
  telegram_user_id: string | null;
  residential_complex_id: number | null;
  items: any;
  delivery_date: string;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  complex_name?: string; // Add this property
}

const CRM = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { data: complexesData = [] } = useComplexes();
  const { data: productsData = [] } = useProducts();
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings] = useState(getSettingsSync());
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Vehicle assignment state
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  
  // Status options for the filter
  const statusOptions = [
    { value: "all", label: "Все статусы" },
    { value: "pending", label: "В ожидании" },
    { value: "processing", label: "В обработке" },
    { value: "delivering", label: "Доставляется" },
    { value: "completed", label: "Завершен" },
    { value: "cancelled", label: "Отменен" },
  ];
  
  // Fetch complexes and products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch complexes
        const { data: complexesData, error: complexesError } = await supabase
          .from('residential_complexes')
          .select('id, name')
          .order('name');
        
        if (complexesError) {
          console.error('Error fetching complexes:', complexesError);
          toast.error('Ошибка при загрузке данных о комплексах');
          throw complexesError;
        }
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, available, inventory, pricePerHalfKg, unit')
          .order('name');
        
        if (productsError) {
          console.error('Error fetching products:', productsError);
          toast.error('Ошибка при загрузке данных о товарах');
          throw productsError;
        }
        
        setComplexes(complexesData || []);
        setProducts(productsData || []);
        
        // Refresh orders data
        refetchOrders();
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [refetchOrders]);
  
  // Calculate total products for a selected complex
  const calculateTotalProducts = () => {
    if (!selectedComplexId || !orders) return [];
    
    const complexOrders = orders.filter(
      order => order.residential_complex_id === selectedComplexId && 
      (order.status === "processing" || order.status === "pending" || order.status === "delivering")
    );
    
    const totals: Record<number, number> = {};
    
    complexOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.productId;
          if (!totals[productId]) {
            totals[productId] = 0;
          }
          totals[productId] += item.quantity;
        });
      }
    });
    
    return Object.entries(totals).map(([productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      const isAvailable = product?.available && (product?.inventory ?? 0) > 0;
      
      return {
        productId: parseInt(productId),
        productName: product?.name || "Неизвестный продукт",
        quantity,
        available: isAvailable,
        inventory: product?.inventory ?? 0,
        pricePerHalfKg: product?.pricePerHalfKg ?? false,
        unit: product?.unit ?? '1 кг'
      };
    });
  };

  // Handle order status change
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(`Статус заказа #${orderId} изменен на "${getStatusLabel(newStatus)}"`);
        // Immediately refresh orders data
        await refetchOrders();
      } else {
        toast.error('Ошибка при изменении статуса заказа');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Ошибка при изменении статуса заказа');
    }
  };
  
  // Helper function to get human-readable status label
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending": return "В ожидании";
      case "processing": return "В обработке";
      case "delivering": return "Доставляется";
      case "completed": return "Завершен";
      case "cancelled": return "Отменен";
      default: return status;
    }
  };
  
  // Filter orders based on search term and status
  const filteredOrders = (processedOrders: ExtendedOrder[]) => {
    if (!processedOrders) return [];
    
    return processedOrders.filter(order => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.telegram_username?.toLowerCase().includes(searchLower) ||
        order.id?.toString().includes(searchTerm) ||
        order.phone?.includes(searchTerm)
      );
    });
  };
  
  const isLoading = adminLoading || ordersLoading || loading;
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-900">Загрузка данных...</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Show CRM when authenticated
  if (isAdmin) {
    const totalProducts = calculateTotalProducts();
    
    // Process orders to include product price and complex name
    const processedOrders = orders?.map(order => {
      const orderWithPrices = {...order} as ExtendedOrder;
      
      // Add complex name
      const complex = complexesData.find(c => c.id === order.residential_complex_id);
      orderWithPrices.complex_name = complex?.name || "Неизвестный ЖК";
      
      // Add prices
      if (orderWithPrices.items && Array.isArray(orderWithPrices.items)) {
        orderWithPrices.items = orderWithPrices.items.map((item: any) => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            price: product?.price || 0
          };
        });
      }
      return orderWithPrices;
    }) || [];
    
    // Apply filters
    const displayedOrders = filteredOrders(processedOrders);

    // Get the selected complex name
    const selectedComplexName = selectedComplexId 
      ? complexes.find(c => c.id === selectedComplexId)?.name 
      : undefined;
    
    return (
      <AdminLayout title="CRM - Управление заказами">
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Search and Filter Bar */}
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по ID, имени, телеграму или телефону..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-[200px]">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Статус заказа" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-gray-900">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vehicle assignment button */}
            {selectedOrders.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Button 
                  onClick={() => setIsVehicleModalOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Назначить транспорт ({selectedOrders.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                  Выбрано заказов: {selectedOrders.length}
                </span>
              </div>
            )}
          </div>
          
          {/* Итого по ЖК */}
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Итого по ЖК</h2>
            
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-900 mb-2">
                Выберите ЖК
              </Label>
              <Select 
                value={selectedComplexId?.toString() || ""}
                onValueChange={(value) => setSelectedComplexId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue placeholder="Выберите жилой комплекс" />
                </SelectTrigger>
                <SelectContent>
                  {complexes.map(complex => (
                    <SelectItem key={complex.id} value={complex.id.toString()} className="text-gray-900">
                      {complex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedComplexId && totalProducts && (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <h3 className="text-md font-medium mb-2 px-3 sm:px-0 text-gray-900">
                  Продукты для доставки в {complexes.find(c => c.id === selectedComplexId)?.name}:
                </h3>
                
                {totalProducts.length > 0 ? (
                  <div className="min-w-full overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Продукт
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Статус
                          </th>
                          <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Количество
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {totalProducts.map((item, index) => (
                          <tr key={index} className={cn(!item.available && "bg-gray-50")}>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.productName}
                            </td>
                            <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                              {item.available ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  В наличии
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <AlertTriangle className="inline-block w-3 h-3 mr-1" />
                                  Нет в наличии
                                </Badge>
                              )}
                            </td>
                            <td className={cn(
                              "px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm",
                              item.available ? "text-gray-900" : "text-gray-500"
                            )}>
                              <span className={cn(!item.available && "line-through")}>
                                {item.quantity} {item.pricePerHalfKg ? 'x 0.5 кг' : item.unit}
                              </span>
                              {!item.available && (
                                <span className="ml-2 text-red-600">
                                  (недоступно)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-900 px-3 sm:px-0">Нет активных заказов для этого ЖК</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Заказы</h2>
            {displayedOrders && displayedOrders.length > 0 ? (
              <OrderTable 
                data={displayedOrders} 
                onStatusChange={handleStatusChange}
                onSelectOrders={setSelectedOrders}
              />
            ) : (
              <p className="text-gray-900">Нет активных заказов по выбранным фильтрам</p>
            )}
          </div>
        </div>

        {/* Vehicle Assignment Modal */}
        <VehicleAssignmentModal
          isOpen={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false);
            refetchOrders(); // Refresh orders after closing modal
          }}
          selectedOrders={selectedOrders}
          complexId={selectedComplexId}
          complexName={selectedComplexName}
        />
      </AdminLayout>
    );
  }
  
  // This shouldn't be visible due to the redirect in useEffect in AdminLayout
  return null;
};

export default CRM;

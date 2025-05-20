
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useOrders, Order } from "@/hooks/useSupabaseData";
import { OrderCard } from "@/components/CourierOrderCard";
import { updateOrderStatus, sendCustomStatusNotification } from "@/lib/orderService";
import { toast } from "sonner";

const CourierPanel = () => {
  const { data: orders, isLoading, refetch } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("delivery");

  // Filter orders based on status and search term
  const filteredDeliveryOrders = orders
    ?.filter((order) => order.status === "delivering")
    .filter((order) => 
      !searchTerm || 
      order.id?.toString().includes(searchTerm) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm)
    ) || [];

  const filteredArchivedOrders = orders
    ?.filter((order) => order.status === "completed" || order.status === "cancelled")
    .filter((order) => 
      !searchTerm || 
      order.id?.toString().includes(searchTerm) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm)
    ) || [];

  // Mark order as delivered
  const handleOrderDelivered = async (orderId: number) => {
    try {
      const result = await updateOrderStatus(orderId, "completed");
      
      if (result.success) {
        // Send thank you message
        const order = orders?.find(o => o.id === orderId);
        if (order && (order.telegram_user_id || order.telegram_username)) {
          await sendCustomStatusNotification(
            order.telegram_user_id || order.telegram_username,
            orderId,
            "Спасибо за покупку! Ваш заказ успешно доставлен."
          );
        }
        
        toast.success(`Заказ #${orderId} отмечен как доставленный`);
        refetch();
      } else {
        toast.error(`Не удалось обновить статус заказа #${orderId}`);
      }
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      toast.error("Произошла ошибка при обновлении статуса заказа");
    }
  };

  // Cancel order
  const handleOrderCancelled = async (orderId: number) => {
    try {
      const result = await updateOrderStatus(orderId, "cancelled");
      
      if (result.success) {
        const order = orders?.find(o => o.id === orderId);
        if (order && (order.telegram_user_id || order.telegram_username)) {
          await sendCustomStatusNotification(
            order.telegram_user_id || order.telegram_username,
            orderId,
            "Ваш заказ был отменен. Приносим извинения за неудобства."
          );
        }
        
        toast.success(`Заказ #${orderId} отмечен как отмененный`);
        refetch();
      } else {
        toast.error(`Не удалось обновить статус заказа #${orderId}`);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Произошла ошибка при отмене заказа");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Курьер Панель</h1>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Поиск по ID, имени или телефону..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="delivery">В доставке</TabsTrigger>
          <TabsTrigger value="archive">Архив</TabsTrigger>
        </TabsList>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredDeliveryOrders.length > 0 ? (
            filteredDeliveryOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                onDelivered={() => handleOrderDelivered(order.id)}
                onCancelled={() => handleOrderCancelled(order.id)}
                isArchived={false}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Заказы не найдены" : "Нет заказов в доставке"}
            </div>
          )}
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredArchivedOrders.length > 0 ? (
            filteredArchivedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                isArchived={true}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Заказы не найдены" : "Архив пуст"}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourierPanel;


import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendTelegramMessage } from "@/lib/telegramConfig";

interface OrderInfo {
  id: number;
  customer_name: string;
  telegram_username?: string;
  telegram_user_id?: string;
}

interface VehicleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: OrderInfo[];
  complexId?: number;
  complexName?: string;
}

export function VehicleAssignmentModal({
  isOpen,
  onClose,
  selectedOrders,
  complexId,
  complexName,
}: VehicleAssignmentModalProps) {
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [sending, setSending] = useState(false);
  
  // Track success and failure counts
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);

  const handleAssign = async () => {
    if (!vehicleInfo) {
      toast.error("Укажите информацию о машине");
      return;
    }

    try {
      setSending(true);
      setSuccessCount(0);
      setFailureCount(0);
      
      // Format the message
      const message = `🚚 <b>Информация о доставке</b>\n\n` +
        `Транспорт: ${vehicleInfo}\n` +
        (driverName ? `Водитель: ${driverName}\n` : '') +
        (driverPhone ? `Телефон: ${driverPhone}\n` : '') +
        (complexName ? `\nЖК: ${complexName}\n` : '') +
        `\nСкоро доставим ваш заказ! Ожидайте.`;
      
      // Send messages to all selected orders
      const sendPromises = selectedOrders.map(async (order) => {
        const recipient = order.telegram_user_id || order.telegram_username;
        if (!recipient) return { success: false, orderId: order.id };
        
        try {
          const result = await sendTelegramMessage(recipient, message, {
            parseMode: "HTML",
          });
          
          return { 
            success: result.ok, 
            orderId: order.id,
            error: result.ok ? null : "Ошибка API Telegram"
          };
        } catch (error) {
          console.error(`Error sending message to order #${order.id}:`, error);
          return { 
            success: false, 
            orderId: order.id,
            error: "Не удалось отправить сообщение"
          };
        }
      });
      
      // Wait for all message sending attempts to complete
      const results = await Promise.all(sendPromises);
      
      // Count successes and failures
      const successes = results.filter(r => r && r.success).length;
      const failures = results.filter(r => r && !r.success).length;
      
      setSuccessCount(successes);
      setFailureCount(failures);
      
      // Update order statuses to "delivering" if they're not already
      if (selectedOrders.length > 0) {
        const orderIds = selectedOrders.map(order => order.id);
        
        const { error } = await supabase
          .from('orders')
          .update({ status: 'delivering' })
          .in('id', orderIds)
          .eq('status', 'processing'); // Only change status if it's currently "processing"
        
        if (error) {
          console.error("Error updating order statuses:", error);
          toast.error("Ошибка при обновлении статусов заказов");
        } else {
          // Status updated successfully
          if (successes > 0) {
            toast.success(`Информация о транспорте успешно отправлена ${successes} получателям`);
          }
          
          if (failures > 0) {
            toast.warning(`Не удалось отправить информацию ${failures} получателям, но статусы заказов обновлены`);
          }
        }
      } else if (successes > 0) {
        toast.success(`Информация о транспорте успешно отправлена ${successes} получателям`);
      }
      
      // Close modal if at least some messages were sent successfully or if all orders were updated
      if (successes > 0 || failures === 0) {
        onClose();
      }
      
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      toast.error("Ошибка при назначении транспорта");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Назначить транспорт</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="vehicle">Информация о транспорте</Label>
            <Input
              id="vehicle"
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
              placeholder="Например: Белая Газель А123БВ"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="driver">Водитель (необязательно)</Label>
            <Input
              id="driver"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="ФИО водителя"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Телефон (необязательно)</Label>
            <Input
              id="phone"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="mt-1"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Выбрано заказов: {selectedOrders.length}</p>
            {complexName && <p>ЖК: {complexName}</p>}
            {failureCount > 0 && (
              <p className="text-amber-500 mt-2">
                Примечание: Некоторые пользователи могут не получить уведомление,
                если они не активировали бота или удалили чат.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleAssign} disabled={sending}>
            {sending ? "Отправка..." : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VehicleAssignmentModal;

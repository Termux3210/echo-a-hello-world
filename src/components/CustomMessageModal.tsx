
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendTelegramMessage } from "@/lib/telegramConfig";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface CustomMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  telegram_user_id?: string;
  telegram_username?: string;
  defaultMessage?: string;
}

export function CustomMessageModal({
  isOpen,
  onClose,
  orderId,
  telegram_user_id,
  telegram_username,
  defaultMessage = "",
}: CustomMessageModalProps) {
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Сообщение не может быть пустым");
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      // Determine recipient (user ID or username)
      const recipient = telegram_user_id || telegram_username;
      
      if (!recipient) {
        setError("Не указан получатель сообщения");
        toast.error("Не указан получатель сообщения");
        return;
      }

      // Send the message
      try {
        const result = await sendTelegramMessage(recipient, message, {
          parseMode: "HTML",
        });
        
        if (result.ok) {
          toast.success("Сообщение отправлено");
          onClose();
        } else {
          setError(`Ошибка при отправке сообщения: ${result.description || "Неизвестная ошибка"}`);
          toast.error("Ошибка при отправке сообщения");
          console.error("Error response:", result);
        }
      } catch (error: any) {
        console.error("Error sending message:", error);
        setError(error?.message || "Ошибка при отправке сообщения");
        toast.error("Ошибка при отправке сообщения");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Отправить сообщение</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Сообщение по заказу #{orderId}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст сообщения..."
              className="min-h-[120px]"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            {telegram_username && (
              <p>Получатель: {telegram_username}</p>
            )}
            {telegram_user_id && (
              <p>ID получателя: {telegram_user_id}</p>
            )}
            <p className="mt-1 text-amber-500">
              Примечание: Пользователь может не получить сообщение,
              если он не активировал бота или удалил чат.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Отправка..." : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomMessageModal;

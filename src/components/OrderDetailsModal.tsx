
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Home, Package, Calendar, User, MessageSquare, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!order) return null;

  const getTelegramLink = (username: string) => {
    // Remove @ if present and create Telegram link
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    return `https://t.me/${cleanUsername}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Заказ #{order.id}
          </DialogTitle>
          <DialogDescription>
            {new Date(order.created_at).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </DialogDescription>
          {order.delivery_date && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>Запланированная доставка: </span>
              <span className="font-medium">
                {new Date(order.delivery_date).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Информация о покупателе</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">ФИО:</span>
                    <span className="font-medium">{order.customer_name || '—'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Telegram:</span>
                    {order.telegram_username ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-primary hover:text-primary/90"
                        onClick={() => window.open(getTelegramLink(order.telegram_username), '_blank')}
                      >
                        {order.telegram_username}
                      </Button>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Телефон:</span>
                    <span className="font-medium">{order.phone || '—'}</span>
                  </div>
                  
                  {order.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground min-w-[120px]">Email:</span>
                      <span className="font-medium">{order.email}</span>
                    </div>
                  )}
                  
                  {order.residential_complex_id && (
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground min-w-[120px]">ЖК:</span>
                      <span className="font-medium">{order.complex_name || '—'}</span>
                    </div>
                  )}

                  {order.address && (
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground min-w-[120px]">Адрес:</span>
                      <span className="font-medium">{order.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Детали заказа</h3>
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 py-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{item.quantity} шт</span>
                          <span className="text-sm text-muted-foreground">×</span>
                          <span className="text-sm">{item.price} ₽</span>
                        </div>
                      </div>
                      <div className="font-medium">
                        {item.quantity * item.price} ₽
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Итого:</span>
                  <span className="text-lg font-bold">
                    {order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)} ₽
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Статус заказа</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Дата создания: </span>
                    <span className="font-medium">
                      {new Date(order.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === 'completed' ? 'secondary' : 'default'}>
                      {order.status === 'pending' && 'В ожидании'}
                      {order.status === 'processing' && 'В обработке'}
                      {order.status === 'delivering' && 'Доставляется'}
                      {order.status === 'completed' && 'Завершен'}
                      {order.status === 'cancelled' && 'Отменен'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

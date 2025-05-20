
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, PhoneCall, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string | null;
  items: OrderItem[];
  status: string;
  residential_complex_id: number;
  complex_name?: string;
}

interface OrderCardProps {
  order: Order;
  onDelivered?: () => void;
  onCancelled?: () => void;
  isArchived: boolean;
}

export const OrderCard = ({ order, onDelivered, onCancelled, isArchived }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Calculate total order price
  const totalPrice = order.items?.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 0);
  }, 0) || 0;
  
  // Format address
  const formattedAddress = order.address || 
    (order.complex_name ? `ЖК "${order.complex_name}"` : "Адрес не указан");
  
  // Get status text and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "delivering":
        return { text: "В доставке", color: "bg-blue-100 text-blue-800" };
      case "completed":
        return { text: "Доставлен", color: "bg-green-100 text-green-800" };
      case "cancelled":
        return { text: "Отменен", color: "bg-red-100 text-red-800" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800" };
    }
  };
  
  const statusInfo = getStatusInfo(order.status);
  
  return (
    <Card className="overflow-hidden border-gray-200">
      <CardContent className="p-0">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">Заказ #{order.id}</h3>
              <p className="text-gray-700">{order.customer_name}</p>
            </div>
            <Badge className={statusInfo.color}>{statusInfo.text}</Badge>
          </div>
          
          {/* Contact and Address */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center">
              <PhoneCall className="h-4 w-4 mr-2 text-gray-500" />
              <a href={`tel:${order.phone}`} className="text-blue-600">{order.phone}</a>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>{formattedAddress}</span>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="flex justify-between items-center">
            <p>
              <span className="font-medium">Итого: </span>
              <span className="font-semibold">{formatCurrency(totalPrice)}</span>
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Order Details */}
        {expanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Состав заказа:</h4>
            <ul className="space-y-1 mb-4">
              {order.items?.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>
                    {item.name || `Товар #${item.productId}`} x {item.quantity}
                  </span>
                  <span className="text-gray-700">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Action Buttons */}
        {!isArchived && (
          <div className="flex border-t border-gray-100">
            <Button
              onClick={onDelivered}
              className="flex-1 rounded-none rounded-bl-lg bg-green-500 hover:bg-green-600 text-white border-r border-white/20"
            >
              <Check className="h-4 w-4 mr-2" /> Доставлен
            </Button>
            <Button
              onClick={onCancelled}
              className="flex-1 rounded-none rounded-br-lg bg-red-500 hover:bg-red-600 text-white"
            >
              <X className="h-4 w-4 mr-2" /> Отменен
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

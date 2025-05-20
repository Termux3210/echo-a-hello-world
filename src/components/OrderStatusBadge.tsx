
import { statusColors, OrderStatus, statusLabels } from "@/lib/mockData";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";
  const label = statusLabels[status] || "Неизвестный статус";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export default OrderStatusBadge;


import { Calendar } from "lucide-react";
import { useMemo } from "react";

interface NextDeliveryAlertProps {
  deliveryDate: string;
}

export default function NextDeliveryAlert({ deliveryDate }: NextDeliveryAlertProps) {
  const formattedDate = useMemo(() => {
    try {
      const date = new Date(deliveryDate);
      if (isNaN(date.getTime())) {
        return "Дата не определена";
      }
      
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      };
      
      const formattedDate = date.toLocaleDateString('ru-RU', options);
      return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Ошибка форматирования даты";
    }
  }, [deliveryDate]);

  return (
    <div className="flex items-center space-x-2 contrast-bg p-3 rounded-lg inline-block">
      <Calendar className="h-5 w-5 text-primary" />
      <span className="font-medium text-gray-900">
        Ближайшая доставка: <span className="text-primary font-bold">{formattedDate}</span>
      </span>
    </div>
  );
}

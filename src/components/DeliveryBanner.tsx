
import { Calendar } from "lucide-react";
import { useMemo } from "react";

interface DeliveryBannerProps {
  deliveryDate: string | null;
}

export default function DeliveryBanner({ deliveryDate }: DeliveryBannerProps) {
  const formattedDate = useMemo(() => {
    if (!deliveryDate) return null;
    
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

  if (!deliveryDate) return null;

  return (
    <div className="mb-6 text-center">
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/15 rounded-full border-2 border-primary/25 shadow-sm">
        <Calendar className="h-6 w-6 text-primary" />
        <div className="text-gray-900">
          <span className="font-medium text-lg">Ближайшая доставка: </span>
          <span className="text-primary font-bold text-lg">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

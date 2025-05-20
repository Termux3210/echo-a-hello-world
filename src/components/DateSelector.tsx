
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  availableDates: string[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export function DateSelector({ 
  availableDates, 
  selectedDate, 
  onDateSelect 
}: DateSelectorProps) {
  // Convert string dates to Date objects
  const dateObjects = availableDates.map(d => new Date(d));
  
  // Custom modifiers for available dates
  const isAvailable = (date: Date) => {
    return dateObjects.some(d => 
      d.getDate() === date.getDate() && 
      d.getMonth() === date.getMonth() && 
      d.getFullYear() === date.getFullYear()
    );
  };
  
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4 text-center">Выберите дату доставки</h3>
      
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={ru}
        modifiers={{ available: isAvailable }}
        modifiersClassNames={{
          available: "bg-secondary text-primary font-medium hover:bg-primary hover:text-white"
        }}
        disabled={(date) => {
          // Disable dates in the past
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Or dates that are not in the available dates list
          return date < today || !isAvailable(date);
        }}
        className="rounded-md border"
      />
      
      {selectedDate && (
        <div className="mt-4 p-3 bg-secondary rounded-lg text-center">
          <p className="text-sm font-medium">Выбранная дата:</p>
          <p className="text-lg font-bold text-primary">
            {format(selectedDate, "dd MMMM yyyy", { locale: ru })}
          </p>
        </div>
      )}
    </div>
  );
}

export default DateSelector;


import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface ProductQuantityInputProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export function ProductQuantityInput({ quantity, onChange, min = 1, max = Infinity }: ProductQuantityInputProps) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= min && newQuantity <= max) {
      onChange(newQuantity);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-secondary/20 rounded-lg p-1.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white transition-colors"
        onClick={() => handleQuantityChange(-1)}
        disabled={quantity <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="w-12 h-8 flex items-center justify-center bg-white rounded font-medium shadow-sm">
        {quantity}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white transition-colors"
        onClick={() => handleQuantityChange(1)}
        disabled={quantity >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

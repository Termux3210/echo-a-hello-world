
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterButton({ 
  children, 
  active = false, 
  onClick,
  className 
}: FilterButtonProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("rounded-full", className)}
    >
      {children}
    </Button>
  );
}

export default FilterButton;

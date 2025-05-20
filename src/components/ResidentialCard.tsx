
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResidentialCardProps {
  id: number;
  name: string;
  image: string;
  address?: string; // Added address property as optional
  available?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function ResidentialCard({ 
  id, 
  name, 
  image,
  address,
  available = true, 
  selected = false, 
  onClick 
}: ResidentialCardProps) {
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300 transform",
        selected && "ring-2 ring-primary scale-[1.02]",
        !available && "opacity-60",
        "hover:shadow-md cursor-pointer"
      )}
      onClick={available ? onClick : undefined}
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-muted mx-auto">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="text-center mt-2 mb-1 px-2">
        <h3 className="text-xs sm:text-sm font-medium line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
          {name}
        </h3>
      </div>
      
      {!available && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
          <span className="text-white font-medium text-xs px-2 py-1 bg-black/50 rounded">
            Недоступно
          </span>
        </div>
      )}
    </div>
  );
}

export default ResidentialCard;

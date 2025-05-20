
import { Building2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResidentialCard from "@/components/ResidentialCard";
import { useAvailableComplexes } from "@/hooks/useSupabaseData";
import { useComplexContext } from "@/hooks/useComplex";

interface ResidentialComplexesProps {
  selectedComplex: number | null;
  onComplexSelect: (complexId: number) => void;
}

export default function ResidentialComplexes({ 
  selectedComplex,
  onComplexSelect 
}: ResidentialComplexesProps) {
  const { data: complexes, isLoading } = useAvailableComplexes();
  const { setSelectedComplex } = useComplexContext();

  const handleComplexSelect = (complexId: number) => {
    onComplexSelect(complexId);
    
    // Также обновляем в контексте
    if (complexes) {
      const selected = complexes.find(c => c.id === complexId);
      if (selected) {
        setSelectedComplex(selected);
      }
    }
  };
  
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center contrast-bg px-3 py-1.5 rounded-lg">
        <Building2 className="mr-2 h-5 w-5 text-primary" />
        <span className="text-gray-900">Жилые комплексы</span>
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : complexes && complexes.length > 0 ? (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex space-x-4 pb-2">
            {complexes.map((complex) => (
              <ResidentialCard
                key={complex.id}
                id={complex.id}
                name={complex.name} 
                image={complex.image}
                address={complex.address}
                selected={selectedComplex === complex.id}
                onClick={() => handleComplexSelect(complex.id)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm">
          <p className="text-gray-900">Нет доступных жилых комплексов</p>
        </div>
      )}
    </div>
  );
}

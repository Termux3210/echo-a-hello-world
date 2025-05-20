
import { createContext, useContext, useState, ReactNode } from 'react';

interface Complex {
  id: number;
  name: string;
  address?: string;
  image?: string;
}

interface ComplexContextType {
  selectedComplex: Complex | null;
  setSelectedComplex: (complex: Complex | null) => void;
}

const ComplexContext = createContext<ComplexContextType | undefined>(undefined);

export const ComplexProvider = ({ children }: { children: ReactNode }) => {
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);

  return (
    <ComplexContext.Provider value={{ selectedComplex, setSelectedComplex }}>
      {children}
    </ComplexContext.Provider>
  );
};

export const useComplexContext = () => {
  const context = useContext(ComplexContext);
  
  if (context === undefined) {
    throw new Error('useComplexContext must be used within a ComplexProvider');
  }
  
  return context;
};

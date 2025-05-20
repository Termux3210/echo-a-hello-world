
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useNextDeliveryDate } from "@/hooks/useSupabaseData";
import { getSettingsSync } from "@/lib/settingsService";
import { isTelegramWebApp, expandWebApp } from "@/lib/telegramWebApp";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MaintenanceMode from "@/components/MaintenanceMode";
import DeliveryBanner from "@/components/DeliveryBanner";
import HeroSection from "@/components/HeroSection";
import ComplexSelector from "@/components/ComplexSelector";
import ResidentialComplexes from "@/components/ResidentialComplexes";
import ProductsGrid from "@/components/ProductsGrid";
import NextDeliveryAlert from "@/components/NextDeliveryAlert";

export default function Index() {
  const [selectedComplex, setSelectedComplex] = useState<number | null>(null);
  const [settings, setSettings] = useState(getSettingsSync());
  const { data: nextDelivery, isLoading: deliveryLoading } = useNextDeliveryDate();
  const { isAdmin } = useAdmin();
  
  useEffect(() => {
    if (isTelegramWebApp()) {
      expandWebApp();
    }
    
    const handleSettingsUpdate = (e: any) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);
  
  // Проверяем, находится ли сайт в режиме обслуживания
  if (settings.maintenance_mode && !isAdmin) {
    return <MaintenanceMode />;
  }
  
  const handleComplexSelect = (complexId: number) => {
    setSelectedComplex(complexId);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-white overflow-auto">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 animate-fade-in overflow-y-auto">
        {/* Top Delivery Banner */}
        {nextDelivery && (
          <DeliveryBanner deliveryDate={nextDelivery.date} />
        )}
        
        {/* Hero Section */}
        <HeroSection />
        
        {/* Add the NextDeliveryAlert component inside the hero */}
        {nextDelivery && (
          <NextDeliveryAlert deliveryDate={nextDelivery.date} />
        )}
        
        {/* Complex Selector */}
        <ComplexSelector selectedComplex={selectedComplex} />
        
        {/* Residential Complexes Section */}
        <ResidentialComplexes 
          selectedComplex={selectedComplex} 
          onComplexSelect={handleComplexSelect} 
        />
        
        {/* Products Grid Section */}
        <ProductsGrid selectedComplex={selectedComplex} />
      </main>
      
      <Footer />
    </div>
  );
}

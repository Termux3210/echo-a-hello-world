
import { Leaf } from "lucide-react";
import { getSettingsSync } from "@/lib/settingsService";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [settings, setSettings] = useState(getSettingsSync());
  
  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    <div className="mb-8 rounded-2xl overflow-hidden relative bg-gradient-to-r from-purple-200 via-purple-100 to-blue-100 shadow-md">
      <div className="p-6 md:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
            {settings.site_title}
          </h1>
          <p className="text-gray-900 mb-6 font-medium">
            {settings.site_subtitle}
          </p>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
        <Leaf className="w-64 h-64 text-primary" />
      </div>
    </div>
  );
}

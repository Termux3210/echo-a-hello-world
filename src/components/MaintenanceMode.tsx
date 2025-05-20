
import React from 'react';
import { AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';
import { useAdmin } from "@/hooks/useAdmin";

interface MaintenanceModeProps {
  message?: string;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ 
  message = "Сайт находится на техническом обслуживании и временно недоступен. Пожалуйста, попробуйте позже."
}) => {
  const { isAdmin } = useAdmin();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench className="h-8 w-8 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Техническое обслуживание
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {isAdmin && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <ShieldAlert className="h-5 w-5" />
              <span className="font-medium">Административный доступ</span>
            </div>
            <p className="text-blue-700 text-sm">
              Вы видите этот сайт, так как вы администратор. Обычные пользователи видят сообщение о техническом обслуживании.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceMode;

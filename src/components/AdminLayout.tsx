
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdmin } from "@/hooks/useAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // If not loading and not admin, redirect to login
    if (!loading && !isAdmin) {
      navigate("/login", { replace: true });
    }
  }, [isAdmin, loading, navigate]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }
  
  // Show admin panel when authenticated
  if (isAdmin) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className={cn(
          "flex-1 overflow-auto p-4 md:p-6",
          isMobile && "w-full"
        )}>
          <div className="flex justify-between items-center mb-4">
            {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
            <div className="ml-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home size={16} />
                <span>На главную</span>
              </Button>
            </div>
          </div>
          {children}
        </div>
      </div>
    );
  }
  
  // This shouldn't be visible due to the redirect in useEffect
  return null;
};

export default AdminLayout;

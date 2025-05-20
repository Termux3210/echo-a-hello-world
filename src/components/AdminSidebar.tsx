
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Database, 
  Settings, 
  Calendar, 
  ShoppingBag, 
  Users, 
  ChevronRight,
  LogOut,
  Menu,
  X,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ to, icon: Icon, label, active, onClick }: SidebarLinkProps) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
      active 
        ? "bg-primary text-primary-foreground" 
        : "text-foreground hover:bg-secondary"
    )}
    onClick={onClick}
  >
    <Icon className="w-5 h-5 text-gray-900" />
    <span>{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto text-gray-900" />}
  </Link>
);

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdmin();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  
  // Handle window resize and close sidebar on mobile
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);
  
  const routes = [
    { path: "/admin", icon: Home, label: "Панель управления" },
    { path: "/admin/complexes", icon: Database, label: "Жилые комплексы" },
    { path: "/admin/products", icon: ShoppingBag, label: "Товары" },
    { path: "/admin/delivery", icon: Calendar, label: "Даты доставки" },
    { path: "/admin/admins", icon: Users, label: "Администраторы" },
    { path: "/admin/settings", icon: Settings, label: "Настройки" },
    { path: "/crm", icon: Database, label: "CRM" },
  ];
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const goToMainSite = () => {
    navigate('/');
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  
  if (isMobile && !isSidebarOpen) {
    return (
      <div className="fixed top-0 left-0 z-50 p-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md"
        >
          <Menu className="w-6 h-6 text-gray-900" />
        </button>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "w-64 h-screen bg-white shadow-md flex flex-col",
      isMobile && "fixed top-0 left-0 z-50 w-[80vw] max-w-[300px]"
    )}>
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-primary">Админ панель</h2>
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
        )}
      </div>
      
      <div className="flex-1 py-4 px-3">
        <nav className="space-y-1">
          {routes.map((route) => (
            <SidebarLink
              key={route.path}
              to={route.path}
              icon={route.icon}
              label={route.label}
              active={
                route.path === "/admin" 
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(route.path)
              }
              onClick={handleLinkClick}
            />
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <Button 
          className="mb-4 w-full flex items-center gap-2 justify-center"
          onClick={goToMainSite}
        >
          <Globe className="w-4 h-4" />
          Перейти на сайт
        </Button>
        
        <button 
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          onClick={() => {
            logout();
            if (isMobile) {
              setIsSidebarOpen(false);
            }
          }}
        >
          <LogOut className="w-5 h-5 text-red-600" />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;

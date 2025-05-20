import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AdminProvider } from "@/hooks/useAdmin";
import { CartProvider } from "@/hooks/useCart";
import { ComplexProvider } from "@/hooks/useComplex"; // Добавляем импорт 
import { lazy, Suspense, useEffect } from "react";
import TelegramBotService from "./components/TelegramBotService";
import { startDeliveryReminderSystem } from "./lib/deliveryReminders";
import { ensureDatabaseTables } from "./lib/initializeDatabase";
import PullToRefresh from "./components/PullToRefresh";
import CourierPanel from "./pages/CourierPanel";

// Lazy load pages to improve performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const CRM = lazy(() => import("./pages/CRM"));
const Cart = lazy(() => import("./pages/Cart"));
const ComplexesAdmin = lazy(() => import("./pages/ComplexesAdmin"));
const ProductsAdmin = lazy(() => import("./pages/ProductsAdmin"));
const DeliveryAdmin = lazy(() => import("./pages/DeliveryAdmin"));
const AdminsManagement = lazy(() => import("./pages/AdminsManagement"));
const SettingsAdmin = lazy(() => import("./pages/SettingsAdmin"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component for suspense fallback
const Loading = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  useEffect(() => {
    // Initialize database and reminder system
    const initializeApp = async () => {
      // Ensure all required database tables exist
      await ensureDatabaseTables();
      
      // Start the delivery reminder system
      startDeliveryReminderSystem();
      
      console.log("App initialization completed");
    };
    
    initializeApp();
    
    // Add mobile height correction
    function handleResize() {
      document.body.style.height = window.innerHeight + 'px';
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminProvider>
          <CartProvider>
            <ComplexProvider> {/* Добавляем ComplexProvider */}
              <Toaster />
              <Sonner />
              <Router>
                <TelegramBotService>
                  <PullToRefresh />
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/complexes" element={<ComplexesAdmin />} />
                      <Route path="/admin/products" element={<ProductsAdmin />} />
                      <Route path="/admin/delivery" element={<DeliveryAdmin />} />
                      <Route path="/admin/admins" element={<AdminsManagement />} />
                      <Route path="/admin/settings" element={<SettingsAdmin />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/crm" element={<CRM />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/product/:productId" element={<ProductDetail />} />
                      <Route path="/start_from_telegram/:userId" element={<Index />} />
                      <Route path="/courier" element={<CourierPanel />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </TelegramBotService>
              </Router>
            </ComplexProvider>
          </CartProvider>
        </AdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

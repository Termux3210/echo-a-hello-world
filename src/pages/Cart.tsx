
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useAvailableComplexes, useProductById, useDeliveryDates } from "@/hooks/useSupabaseData";
import { useCart } from "@/hooks/useCart";
import { Loader2, Trash2, Plus, Minus, AlertTriangle, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { getTelegramUser, isTelegramWebApp } from '@/lib/telegramWebApp';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createOrder } from "@/lib/orderService";
import { getCurrentTelegramUserId, syncTelegramUserInfo } from '@/lib/telegramWebAppIntegration';
import MaintenanceMode from "@/components/MaintenanceMode";
import { useAdmin } from "@/hooks/useAdmin";
import { getSettingsSync } from "@/lib/settingsService";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { isAdmin } = useAdmin();
  const [settings, setSettings] = useState(getSettingsSync());
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);
  
  useEffect(() => {
    // Синхронизация информации пользователя из Telegram и получение userId
    const syncUserInfo = async () => {
      if (isTelegramWebApp()) {
        // Попытка синхронизировать данные пользователя с базой данных
        await syncTelegramUserInfo();
        
        // Получение пользователя Telegram
        const user = getTelegramUser();
        if (user) {
          if (user.username) {
            const formattedUsername = user.username.startsWith('@') ? 
              user.username : 
              `@${user.username}`;
            setTelegramUsername(formattedUsername);
          }
          
          // Сохраняем Telegram ID пользователя для использования при создании заказа
          if (user.id) {
            console.log(`Setting Telegram user ID from WebApp: ${user.id}`);
            setTelegramUserId(user.id);
          }
        }
      } else {
        // Если не в Telegram WebApp, пытаемся получить сохраненный ID
        const userId = getCurrentTelegramUserId();
        if (userId) {
          console.log(`Setting Telegram user ID from localStorage: ${userId}`);
          setTelegramUserId(userId);
        }
      }
    };
    
    syncUserInfo();
    
    const handleSettingsUpdate = (e) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);
  
  const { data: complexes, isLoading: loadingComplexes } = useAvailableComplexes();
  const { data: deliveryDates, isLoading: loadingDates } = useDeliveryDates();
  
  // Проверяем, находится ли сайт в режиме обслуживания
  if (settings.maintenance_mode && !isAdmin) {
    return <MaintenanceMode />;
  }
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Корзина пуста</h1>
            <p className="text-gray-800 mb-6">Добавьте товары, чтобы оформить заказ</p>
            <Button onClick={() => navigate("/")} className="w-full">Перейти к товарам</Button>
          </div>
        </div>
      </div>
    );
  }
  
  const getAvailableDates = () => {
    if (!selectedComplexId || !deliveryDates) return [];
    
    return deliveryDates.filter(
      date => date.complex_ids.includes(selectedComplexId)
    );
  };

  // Prepare available dates for calendar
  const getAvailableDatesForCalendar = () => {
    const dates = getAvailableDates();
    return dates.map(d => new Date(d.date));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy, EEEE", { locale: ru });
  };
  
  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setSelectedDeliveryDate(dateStr);
    } else {
      setSelectedDeliveryDate(null);
    }
  };
  
  const validateForm = () => {
    if (!name) {
      setErrorMessage("Пожалуйста, введите ваше имя");
      toast.error("Пожалуйста, введите ваше имя");
      return false;
    }
    if (!phone || phone === "+7") {
      setErrorMessage("Пожалуйста, введите ваш телефон");
      toast.error("Пожалуйста, введите ваш телефон");
      return false;
    }
    if (!telegramUsername) {
      setErrorMessage("Пожалуйста, введите ваш Telegram");
      toast.error("Пожалуйста, введите ваш Telegram");
      return false;
    }
    if (!selectedComplexId) {
      setErrorMessage("Пожалуйста, выберите ЖК для доставки");
      toast.error("Пожалуйста, выберите ЖК для доставки");
      return false;
    }
    if (!selectedDeliveryDate) {
      setErrorMessage("Пожалуйста, выберите дату доставки");
      toast.error("Пожалуйста, выберите дату доставки");
      return false;
    }
    setErrorMessage(null);
    return true;
  };
  
  const submitOrder = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      console.log("Starting order submission");
      
      const formattedUsername = telegramUsername.startsWith('@') 
        ? telegramUsername 
        : `@${telegramUsername}`;
      
      // Получаем ID пользователя из состояния
      console.log("Telegram user ID for order:", telegramUserId);
      
      const orderData = {
        customer_name: name,
        phone: phone,
        telegram_username: formattedUsername,
        telegram_user_id: telegramUserId ? telegramUserId.toString() : null,
        residential_complex_id: selectedComplexId,
        items: items.map(item => ({ 
          productId: item.productId, 
          quantity: item.quantity 
        })),
        delivery_date: selectedDeliveryDate,
        status: "pending"
      };
      
      console.log("Prepared order data:", orderData);
      
      // Используем функцию createOrder, которая также отправит уведомление
      const result = await createOrder(orderData);
      console.log("Order creation result:", result);
      
      if (result.success) {
        toast.success("Заказ успешно оформлен! Спасибо за покупку.");
        clearCart();
        navigate("/");
      } else {
        console.error('Error creating order:', result.error);
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : "Ошибка при оформлении заказа. Пожалуйста, попробуйте позже.";
        
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error in submit order function:', error);
      setErrorMessage("Ошибка при оформлении заказа. Пожалуйста, попробуйте позже.");
      toast.error("Ошибка при оформлении заказа. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Оформление заказа</h1>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cart Items - перемещены вверх */}
          <div className="order-1">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Товары в корзине</h2>
            
            <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-primary font-medium">{item.price} руб.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="h-8 w-8 rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="h-8 w-8 rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium text-gray-900">Итого:</span>
                <span className="text-xl font-bold text-primary">{getCartTotal()} руб.</span>
              </div>
            </div>
          </div>
          
          {/* Customer Info - переместили вниз */}
          <div className="order-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Информация для доставки</h2>
            
            <div className="bg-white rounded-lg shadow-md p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900">ФИО</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Иванов Иван Иванович" 
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-900">Телефон</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => {
                    let value = e.target.value;
                    // Если пользователь стер все и начинает заново, обеспечим наличие +7
                    if (!value.startsWith('+7')) {
                      value = '+7' + value.replace('+7', '');
                    }
                    setPhone(value);
                  }} 
                  placeholder="+7 (___) ___-__-__" 
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegram" className="text-gray-900">Telegram (для уведомлений)</Label>
                <Input 
                  id="telegram" 
                  value={telegramUsername} 
                  onChange={(e) => setTelegramUsername(e.target.value)} 
                  placeholder="@username"
                  readOnly={isTelegramWebApp()}
                  className={`bg-white border-gray-300 text-gray-900 ${isTelegramWebApp() ? "bg-gray-50" : ""}`}
                />
                {isTelegramWebApp() && (
                  <p className="text-sm text-gray-700 mt-1">
                    Telegram username автоматически заполнен из приложения
                  </p>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-2">
                <Label htmlFor="complex" className="text-gray-900">Жилой комплекс</Label>
                {loadingComplexes ? (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-700">Загрузка жилых комплексов...</span>
                  </div>
                ) : (
                  <Select 
                    value={selectedComplexId?.toString() || ""} 
                    onValueChange={(value) => {
                      setSelectedComplexId(parseInt(value));
                      setSelectedDeliveryDate(null);
                      setSelectedDate(undefined);
                    }}
                  >
                    <SelectTrigger id="complex" className="bg-white text-gray-900 border-gray-300">
                      <SelectValue placeholder="Выберите ЖК" className="text-gray-700" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {complexes && complexes.length > 0 ? (
                        complexes.map(complex => (
                          <SelectItem key={complex.id} value={complex.id.toString()} className="text-gray-900">
                            {complex.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled className="text-gray-500">
                          Нет доступных ЖК
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {selectedComplexId && (
                <div className="space-y-2">
                  <Label className="text-gray-900">Дата доставки</Label>
                  {loadingDates ? (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-gray-700">Загрузка дат доставки...</span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white text-gray-900",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              formatDate(selectedDate.toISOString())
                            ) : (
                              <span>Выберите дату доставки</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => {
                              const availableDates = getAvailableDatesForCalendar();
                              return !availableDates.some(
                                availableDate => 
                                  availableDate.getDate() === date.getDate() &&
                                  availableDate.getMonth() === date.getMonth() &&
                                  availableDate.getFullYear() === date.getFullYear()
                              );
                            }}
                            className={cn("p-3 pointer-events-auto")}
                          />
                          
                          {getAvailableDates().length > 0 && (
                            <div className="p-3 border-t">
                              <p className="text-sm text-muted-foreground">
                                Доступные даты доставки выделены. Выберите одну из них.
                              </p>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      
                      {getAvailableDates().length === 0 && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertDescription>
                            Нет доступных дат доставки для выбранного ЖК
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={submitOrder}
                disabled={loadingComplexes || loadingDates || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Оформление...
                  </>
                ) : (
                  'Оформить заказ'
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;

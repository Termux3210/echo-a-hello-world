import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Check, Plus, Trash, Edit, ChevronRight } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import ProductEditor from "@/components/ProductEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const isMobile = useIsMobile();
  
  // State for each section
  const [complexes, setComplexes] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [deliveryDatesList, setDeliveryDatesList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  
  // Loading states
  const [loadingComplexes, setLoadingComplexes] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDeliveryDates, setLoadingDeliveryDates] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  
  // Dialogs state
  const [isAddComplexOpen, setIsAddComplexOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddDeliveryDateOpen, setIsAddDeliveryDateOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Form values
  const [newComplex, setNewComplex] = useState({ name: "", address: "", image: "" });
  const [newProduct, setNewProduct] = useState({ name: "", farm: "", price: 0, image: "", description: "" });
  const [newDeliveryDate, setNewDeliveryDate] = useState({ date: "", complexIds: [] as number[] });
  const [newAdmin, setNewAdmin] = useState({ telegramUsername: "", name: "" });
  
  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch residential complexes
        setLoadingComplexes(true);
        const { data: complexesData, error: complexesError } = await supabase
          .from('residential_complexes')
          .select('*');
        
        if (complexesError) throw complexesError;
        setComplexes(complexesData || []);
        setLoadingComplexes(false);
        
        // Fetch products
        setLoadingProducts(true);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');
        
        if (productsError) throw productsError;
        setProductsList(productsData || []);
        setLoadingProducts(false);
        
        // Fetch delivery dates
        setLoadingDeliveryDates(true);
        const { data: datesData, error: datesError } = await supabase
          .from('delivery_dates')
          .select('*');
        
        if (datesError) throw datesError;
        setDeliveryDatesList(datesData || []);
        setLoadingDeliveryDates(false);
        
        // Fetch admins
        setLoadingAdmins(true);
        const { data: adminsData, error: adminsError } = await supabase
          .from('users')
          .select('*')
          .eq('is_admin', true);
        
        if (adminsError) throw adminsError;
        setAdminsList(adminsData || []);
        setLoadingAdmins(false);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Ошибка при загрузке данных');
      }
    };
    
    fetchData();
  }, []);
  
  // Handler for adding a new residential complex
  const handleAddComplex = async () => {
    if (!newComplex.name || !newComplex.address) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('residential_complexes')
        .insert([{
          name: newComplex.name,
          address: newComplex.address,
          image: newComplex.image || "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
          available: true
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setComplexes([...complexes, data[0]]);
        setNewComplex({ name: "", address: "", image: "" });
        setIsAddComplexOpen(false);
        toast.success("Жилой комплекс успешно добавлен");
      }
    } catch (error) {
      console.error('Error adding complex:', error);
      toast.error('Ошибка при добавлении ЖК');
    }
  };
  
  // Handler for adding a new product
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.farm || !newProduct.price) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          farm: newProduct.farm,
          price: Number(newProduct.price),
          image: newProduct.image || "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
          description: newProduct.description,
          available: true
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProductsList([...productsList, data[0]]);
        setNewProduct({ name: "", farm: "", price: 0, image: "", description: "" });
        setIsAddProductOpen(false);
        toast.success("Товар успешно добавлен");
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Ошибка при добавлении товара');
    }
  };
  
  // Handler for adding a new delivery date
  const handleAddDeliveryDate = async () => {
    if (!newDeliveryDate.date || newDeliveryDate.complexIds.length === 0) {
      toast.error("Пожалуйста, выберите дату и хотя бы один ЖК");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('delivery_dates')
        .insert([{
          date: newDeliveryDate.date,
          complex_ids: newDeliveryDate.complexIds
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setDeliveryDatesList([...deliveryDatesList, data[0]]);
        setNewDeliveryDate({ date: "", complexIds: [] });
        setIsAddDeliveryDateOpen(false);
        toast.success("Дата доставки успешно добавлена");
      }
    } catch (error) {
      console.error('Error adding delivery date:', error);
      toast.error('Ошибка при добавлении даты доставки');
    }
  };
  
  // Handler for adding a new admin
  const handleAddAdmin = async () => {
    if (!newAdmin.telegramUsername || !newAdmin.name) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    
    // Validate Telegram username format
    if (!newAdmin.telegramUsername.startsWith("@")) {
      toast.error("Имя пользователя Telegram до��жно начинаться с @");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          telegram_username: newAdmin.telegramUsername,
          name: newAdmin.name,
          is_admin: true
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAdminsList([...adminsList, data[0]]);
        setNewAdmin({ telegramUsername: "", name: "" });
        setIsAddAdminOpen(false);
        toast.success("Администратор успешно добавлен");
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Ошибка при добавлении администратора');
    }
  };
  
  // Handler for toggling product availability
  const toggleProductAvailability = async (id: number) => {
    try {
      const product = productsList.find(p => p.id === id);
      if (!product) return;
      
      const newAvailability = !product.available;
      
      // Update in Supabase
      const { error } = await supabase
        .from('products')
        .update({ available: newAvailability })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setProductsList(
        productsList.map(product => 
          product.id === id 
            ? { ...product, available: newAvailability } 
            : product
        )
      );
      
      toast.success(`${product.name} ${newAvailability ? 'доступен' : 'скрыт'}`);
    } catch (error) {
      console.error('Error toggling product availability:', error);
      toast.error('Ошибка при изменении статуса товара');
    }
  };
  
  // Open product editor
  const openProductEditor = (product: any) => {
    setSelectedProduct(product);
    setIsEditProductOpen(true);
  };
  
  // Handle product updated
  const handleProductUpdated = (updatedProduct: any) => {
    setProductsList(
      productsList.map(product => 
        product.id === updatedProduct.id 
          ? updatedProduct 
          : product
      )
    );
  };
  
  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  // Handler for delivery date complex selection
  const handleComplexSelection = (complexId: number, checked: boolean) => {
    if (checked) {
      setNewDeliveryDate({
        ...newDeliveryDate,
        complexIds: [...newDeliveryDate.complexIds, complexId]
      });
    } else {
      setNewDeliveryDate({
        ...newDeliveryDate,
        complexIds: newDeliveryDate.complexIds.filter(id => id !== complexId)
      });
    }
  };

  // Mobile-friendly tab navigation
  const renderMobileTabs = () => (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between items-center p-2 bg-primary/10 rounded-md">
        <h3 className="font-medium">{getTabTitle(activeTab)}</h3>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("dashboard")}
            className={activeTab === "dashboard" ? "bg-primary/20" : ""}
          >
            1
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("complexes")}
            className={activeTab === "complexes" ? "bg-primary/20" : ""}
          >
            2
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("products")}
            className={activeTab === "products" ? "bg-primary/20" : ""}
          >
            3
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("delivery")}
            className={activeTab === "delivery" ? "bg-primary/20" : ""}
          >
            4
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("admins")}
            className={activeTab === "admins" ? "bg-primary/20" : ""}
          >
            5
          </Button>
        </div>
      </div>
    </div>
  );

  // Helper to get tab title for mobile view
  const getTabTitle = (tab: string) => {
    switch(tab) {
      case "dashboard": return "Дашборд";
      case "complexes": return "Жилые комплексы";
      case "products": return "Товары";
      case "delivery": return "Доставка";
      case "admins": return "Администраторы";
      default: return "Дашборд";
    }
  };
  
  return (
    <div className="w-full">
      {isMobile ? (
        <>
          {renderMobileTabs()}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Dashboard */}
            <Dashboard />
            
            {/* Residential Complexes */}
            <TabsContent value="complexes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Жилые комплексы</h2>
                <Dialog open={isAddComplexOpen} onOpenChange={setIsAddComplexOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить ЖК
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить жилой комплекс</DialogTitle>
                      <DialogDescription>
                        Заполните форму для добавления нового жилого комплекса.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="complex-name" className="text-right">
                          Название
                        </Label>
                        <Input
                          id="complex-name"
                          value={newComplex.name}
                          onChange={(e) => setNewComplex({...newComplex, name: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="complex-address" className="text-right">
                          Адрес
                        </Label>
                        <Input
                          id="complex-address"
                          value={newComplex.address}
                          onChange={(e) => setNewComplex({...newComplex, address: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="complex-image" className="text-right">
                          Изображение
                        </Label>
                        <Input
                          id="complex-image"
                          value={newComplex.image}
                          onChange={(e) => setNewComplex({...newComplex, image: e.target.value})}
                          placeholder="URL изображения"
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddComplexOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddComplex}>Добавить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loadingComplexes ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {complexes.map((complex) => (
                    <Card key={complex.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{complex.name}</CardTitle>
                        <CardDescription>{complex.address}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="aspect-video bg-muted rounded-md overflow-hidden">
                          <img 
                            src={complex.image} 
                            alt={complex.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant={complex.available ? "outline" : "default"}
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('residential_complexes')
                                .update({ available: !complex.available })
                                .eq('id', complex.id);
                              
                              if (error) throw error;
                              
                              setComplexes(
                                complexes.map(c => 
                                  c.id === complex.id 
                                    ? { ...c, available: !c.available } 
                                    : c
                                )
                              );
                              
                              toast.success(`ЖК "${complex.name}" ${!complex.available ? 'доступен' : 'скрыт'}`);
                            } catch (error) {
                              console.error('Error toggling complex visibility:', error);
                              toast.error('Ошибка при изменении статуса ЖК');
                            }
                          }}
                        >
                          {complex.available ? "Скрыть" : "Показать"}
                        </Button>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Изменить
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Products */}
            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Товары</h2>
                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить товар
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Добавить товар</DialogTitle>
                      <DialogDescription>
                        Заполните форму для добавления нового товара.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-name" className="text-right">
                          Название
                        </Label>
                        <Input
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-farm" className="text-right">
                          Хозяйство
                        </Label>
                        <Input
                          id="product-farm"
                          value={newProduct.farm}
                          onChange={(e) => setNewProduct({...newProduct, farm: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-price" className="text-right">
                          Цена (руб)
                        </Label>
                        <Input
                          id="product-price"
                          type="number"
                          value={newProduct.price.toString()}
                          onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-image" className="text-right">
                          Изображение
                        </Label>
                        <Input
                          id="product-image"
                          value={newProduct.image}
                          onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                          placeholder="URL изображения"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-description" className="text-right">
                          Описание
                        </Label>
                        <Input
                          id="product-description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddProduct}>Добавить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loadingProducts ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productsList.map((product) => (
                    <Card key={product.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{product.farm}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{product.price} руб</span>
                          <span className={`text-sm ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                            {product.available ? 'В наличии' : 'Нет в наличии'}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant={product.available ? "outline" : "default"}
                          onClick={() => toggleProductAvailability(product.id)}
                        >
                          {product.available ? "Скрыть" : "Показать"}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => openProductEditor(product)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Изменить
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Delivery Dates */}
            <TabsContent value="delivery" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Даты доставки</h2>
                <Dialog open={isAddDeliveryDateOpen} onOpenChange={setIsAddDeliveryDateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить дату
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить дату доставки</DialogTitle>
                      <DialogDescription>
                        Выберите дату и жилые комплексы для доставки.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="delivery-date" className="text-right">
                          Дата
                        </Label>
                        <Input
                          id="delivery-date"
                          type="date"
                          value={newDeliveryDate.date}
                          onChange={(e) => setNewDeliveryDate({...newDeliveryDate, date: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">
                          Жилые комплексы
                        </Label>
                        <div className="col-span-3 space-y-2">
                          {complexes.map((complex) => (
                            <div key={complex.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`complex-${complex.id}`}
                                checked={newDeliveryDate.complexIds.includes(complex.id)}
                                onCheckedChange={(checked) => 
                                  handleComplexSelection(complex.id, checked === true)
                                }
                              />
                              <Label htmlFor={`complex-${complex.id}`}>{complex.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDeliveryDateOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddDeliveryDate}>Добавить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loadingDeliveryDates ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Жилые комплексы
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deliveryDatesList.map((date) => (
                        <tr key={date.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(date.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(date.complex_ids) && date.complex_ids.map((complexId: number) => {
                                const complex = complexes.find(c => c.id === complexId);
                                return complex ? (
                                  <span key={complexId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {complex.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => {
                                toast.info("Редактирование даты доставки");
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('delivery_dates')
                                    .delete()
                                    .eq('id', date.id);
                                  
                                  if (error) throw error;
                                  
                                  setDeliveryDatesList(
                                    deliveryDatesList.filter(d => d.id !== date.id)
                                  );
                                  
                                  toast.success("Дата доставки удалена");
                                } catch (error) {
                                  console.error('Error deleting delivery date:', error);
                                  toast.error('Ошибка при удалении даты доставки');
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            {/* Admins */}
            <TabsContent value="admins" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Администраторы</h2>
                <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить администратора
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить администратора</DialogTitle>
                      <DialogDescription>
                        Введите данные нового администратора.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin-username" className="text-right">
                          Telegram
                        </Label>
                        <Input
                          id="admin-username"
                          value={newAdmin.telegramUsername}
                          onChange={(e) => setNewAdmin({...newAdmin, telegramUsername: e.target.value})}
                          placeholder="@username"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin-name" className="text-right">
                          Имя
                        </Label>
                        <Input
                          id="admin-name"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddAdmin}>Добавить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loadingAdmins ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Имя
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telegram
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adminsList.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {admin.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.telegram_username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Администратор
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={async () => {
                                try {
                                  if (adminsList.length <= 1) {
                                    toast.error('Невозможно удалить последнего администратора');
                                    return;
                                  }
                                  
                                  const { error } = await supabase
                                    .from('users')
                                    .update({ is_admin: false })
                                    .eq('id', admin.id);
                                  
                                  if (error) throw error;
                                  
                                  setAdminsList(
                                    adminsList.filter(a => a.id !== admin.id)
                                  );
                                  
                                  toast.success("Администратор удален");
                                } catch (error) {
                                  console.error('Error removing admin:', error);
                                  toast.error('Ошибка при удалении администратора');
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
            <TabsTrigger value="complexes">Жилые комплексы</TabsTrigger>
            <TabsTrigger value="products">Товары</TabsTrigger>
            <TabsTrigger value="delivery">Доставка</TabsTrigger>
            <TabsTrigger value="admins">Администраторы</TabsTrigger>
          </TabsList>
          
          {/* Dashboard */}
          <Dashboard />
          
          {/* Residential Complexes */}
          <TabsContent value="complexes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Жилые комплексы</h2>
              <Dialog open={isAddComplexOpen} onOpenChange={setIsAddComplexOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить ЖК
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить жилой комплекс</DialogTitle>
                    <DialogDescription>
                      Заполните форму для добавления нового жилого комплекса.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="complex-name" className="text-right">
                        Название
                      </Label>
                      <Input
                        id="complex-name"
                        value={newComplex.name}
                        onChange={(e) => setNewComplex({...newComplex, name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="complex-address" className="text-right">
                        Адрес
                      </Label>
                      <Input
                        id="complex-address"
                        value={newComplex.address}
                        onChange={(e) => setNewComplex({...newComplex, address: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="complex-image" className="text-right">
                        Изображение
                      </Label>
                      <Input
                        id="complex-image"
                        value={newComplex.image}
                        onChange={(e) => setNewComplex({...newComplex, image: e.target.value})}
                        placeholder="URL изображения"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddComplexOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleAddComplex}>Добавить</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingComplexes ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complexes.map((complex) => (
                  <Card key={complex.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{complex.name}</CardTitle>
                      <CardDescription>{complex.address}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        <img 
                          src={complex.image} 
                          alt={complex.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant={complex.available ? "outline" : "default"}
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('residential_complexes')
                              .update({ available: !complex.available })
                              .eq('id', complex.id);
                            
                            if (error) throw error;
                            
                            setComplexes(
                              complexes.map(c => 
                                c.id === complex.id 
                                  ? { ...c, available: !c.available } 
                                  : c
                              )
                            );
                            
                            toast.success(`ЖК "${complex.name}" ${!complex.available ? 'доступен' : 'скрыт'}`);
                          } catch (error) {
                            console.error('Error toggling complex visibility:', error);
                            toast.error('Ошибка при изменении статуса ЖК');
                          }
                        }}
                      >
                        {complex.available ? "Скрыть" : "Показать"}
                      </Button>
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Изменить
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Products */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Товары</h2>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить товар
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Добавить товар</DialogTitle>
                    <DialogDescription>
                      Заполните форму для добавления нового товара.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product-name" className="text-right">
                        Название
                      </Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product-farm" className="text-right">
                        Хозяйство
                      </Label>
                      <Input
                        id="product-farm"
                        value={newProduct.farm}
                        onChange={(e) => setNewProduct({...newProduct, farm: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product-price" className="text-right">
                        Цена (руб)
                      </Label>
                      <Input
                        id="product-price"
                        type="number"
                        value={newProduct.price.toString()}
                        onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product-image" className="text-right">
                        Изображение
                      </Label>
                      <Input
                        id="product-image"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                        placeholder="URL изображения"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product-description" className="text-right">
                        Описание
                      </Label>
                      <Input
                        id="product-description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleAddProduct}>Добавить</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingProducts ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsList.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.farm}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{product.price} руб</span>
                        <span className={`text-sm ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                          {product.available ? 'В наличии' : 'Нет в наличии'}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant={product.available ? "outline" : "default"}
                        onClick={() => toggleProductAvailability(product.id)}
                      >
                        {product.available ? "Скрыть" : "Показать"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => openProductEditor(product)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Изменить
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Delivery Dates */}
          <TabsContent value="delivery" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Даты доставки</h2>
              <Dialog open={isAddDeliveryDateOpen} onOpenChange={setIsAddDeliveryDateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить дату
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить дату доставки</DialogTitle>
                    <DialogDescription>
                      Выберите дату и жилые комплексы для доставки.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="delivery-date" className="text-right">
                        Дата
                      </Label>
                      <Input
                        id="delivery-date"
                        type="date"
                        value={newDeliveryDate.date}
                        onChange={(e) => setNewDeliveryDate({...newDeliveryDate, date: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Жилые комплексы
                      </Label>
                      <div className="col-span-3 space-y-2">
                        {complexes.map((complex) => (
                          <div key={complex.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`complex-${complex.id}`}
                              checked={newDeliveryDate.complexIds.includes(complex.id)}
                              onCheckedChange={(checked) => 
                                handleComplexSelection(complex.id, checked === true)
                              }
                            />
                            <Label htmlFor={`complex-${complex.id}`}>{complex.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDeliveryDateOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleAddDeliveryDate}>Добавить</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingDeliveryDates ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Жилые комплексы
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryDatesList.map((date) => (
                      <tr key={date.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(date.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(date.complex_ids) && date.complex_ids.map((complexId: number) => {
                              const complex = complexes.find(c => c.id === complexId);
                              return complex ? (
                                <span key={complexId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {complex.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => {
                              toast.info("Редактирование даты доставки");
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-800"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('delivery_dates')
                                  .delete()
                                  .eq('id', date.id);
                                
                                if (error) throw error;
                                
                                setDeliveryDatesList(
                                  deliveryDatesList.filter(d => d.id !== date.id)
                                );
                                
                                toast.success("Дата доставки удалена");
                              } catch (error) {
                                console.error('Error deleting delivery date:', error);
                                toast.error('Ошибка при удалении даты доставки');
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          
          {/* Admins */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Администраторы</h2>
              <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить администратора
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить администратора</DialogTitle>
                    <DialogDescription>
                      Введите данные нового администратора.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="admin-username" className="text-right">
                        Telegram
                      </Label>
                      <Input
                        id="admin-username"
                        value={newAdmin.telegramUsername}
                        onChange={(e) => setNewAdmin({...newAdmin, telegramUsername: e.target.value})}
                        placeholder="@username"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="admin-name" className="text-right">
                        Имя
                      </Label>
                      <Input
                        id="admin-name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleAddAdmin}>Добавить</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingAdmins ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Имя
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telegram
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adminsList.map((admin) => (
                      <tr key={admin.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {admin.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {admin.telegram_username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Администратор
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-800"
                            onClick={async () => {
                              try {
                                if (adminsList.length <= 1) {
                                  toast.error('Невозможно удалить последнего администратора');
                                  return;
                                }
                                
                                const { error } = await supabase
                                  .from('users')
                                  .update({ is_admin: false })
                                  .eq('id', admin.id);
                                
                                if (error) throw error;
                                
                                setAdminsList(
                                  adminsList.filter(a => a.id !== admin.id)
                                );
                                
                                toast.success("Администратор удален");
                              } catch (error) {
                                console.error('Error removing admin:', error);
                                toast.error('Ошибка при удалении администратора');
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Product Editor Dialog */}
      {selectedProduct && (
        <ProductEditor
          isOpen={isEditProductOpen}
          onClose={() => setIsEditProductOpen(false)}
          product={selectedProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
}

export default AdminPanel;

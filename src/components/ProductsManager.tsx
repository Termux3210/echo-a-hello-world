import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit, Loader2, Upload, Image, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductEditor from "@/components/ProductEditor";
import { useProducts, ensureProductSchema } from "@/hooks/useSupabaseData";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ProductsManager() {
  const { data: productsList = [], isLoading: loadingProducts, error } = useProducts();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    farm: "", 
    price: 0, 
    image: "", 
    description: "", 
    inventory: 0, 
    unit: "1 кг",
    pricePerHalfKg: false
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  useEffect(() => {
    const initializeSchema = async () => {
      try {
        await ensureProductSchema();
      } catch (error) {
        console.error("Error initializing product schema:", error);
      }
    };
    
    initializeSchema();
  }, []);
  
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.farm || !newProduct.price) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }
    
    try {
      await ensureProductSchema();
      
      let imageUrl = newProduct.image || "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png";
      
      if (preview) {
        if (preview.startsWith('data:')) {
          try {
            const blob = await fetch(preview).then(res => res.blob());
            const formData = new FormData();
            formData.append('file', blob, `product_${Date.now()}.${blob.type.split('/')[1]}`);
            imageUrl = preview;
          } catch (error) {
            console.error('Error processing image:', error);
            toast.warning("Не удалось обработать изображение, используется стандартное изображение");
          }
        } else {
          imageUrl = preview;
        }
      }
      
      const productData = {
        name: newProduct.name,
        farm: newProduct.farm,
        price: Number(newProduct.price),
        image: imageUrl,
        description: newProduct.description,
        available: true,
        inventory: Number(newProduct.inventory),
        unit: newProduct.unit,
        pricePerHalfKg: newProduct.pricePerHalfKg
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setNewProduct({ name: "", farm: "", price: 0, image: "", description: "", inventory: 0, unit: "1 кг", pricePerHalfKg: false });
        setPreview(null);
        setIsAddProductOpen(false);
        toast.success("Товар успешно добавлен");
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Ошибка при добавлении товара');
    }
  };
  
  const toggleProductAvailability = async (id: number) => {
    try {
      const product = productsList.find(p => p.id === id);
      if (!product) return;
      
      const newAvailability = !product.available;
      
      const { error } = await supabase
        .from('products')
        .update({ available: newAvailability })
        .eq('id', id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success(`${product.name} ${newAvailability ? 'доступен' : 'скрыт'}`);
    } catch (error) {
      console.error('Error toggling product availability:', error);
      toast.error('Ошибка при изменении статуса товара');
    }
  };
  
  const openProductEditor = (product: any) => {
    setSelectedProduct(product);
    setIsEditProductOpen(true);
  };
  
  const handleProductUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const viewProductDetails = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const openDeleteConfirmation = (product: any) => {
    setProductToDelete(product);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteAlertOpen(false);
      setProductToDelete(null);
      toast.success("Товар успешно удален");
    } catch (error: any) {
      console.error('Error deleting product:', error);
      
      if (error.code === '23503') {
        toast.error('Невозможно удалить товар, так как он используется в заказах');
      } else {
        toast.error('Ошибка при удалении товара');
      }
    }
  };
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Ошибка при загрузке товаров</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }
  
  if (loadingProducts) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Товары</h2>
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="product-inventory" className="text-right">
                  Количество (кг)
                </Label>
                <Input
                  id="product-inventory"
                  type="number"
                  value={newProduct.inventory.toString()}
                  onChange={(e) => setNewProduct({...newProduct, inventory: Number(e.target.value)})}
                  className="col-span-3"
                  placeholder="Доступное количество в кг"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-unit" className="text-right">
                  Единица (кг)
                </Label>
                <Input
                  id="product-unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  className="col-span-3"
                  placeholder="Например: 0.25 кг, 0.5 кг, 1 кг"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-price-per-half-kg" className="text-right">
                  Цена за 0.5 ��г
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="product-price-per-half-kg"
                    checked={newProduct.pricePerHalfKg}
                    onCheckedChange={(checked) => setNewProduct({...newProduct, pricePerHalfKg: checked})}
                  />
                  <Label htmlFor="product-price-per-half-kg">
                    {newProduct.pricePerHalfKg ? "Да" : "Нет"}
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="product-image" className="text-right pt-2">
                  Изображение
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full"
                  />
                  
                  {preview && (
                    <div className="mt-2 relative w-full h-40 border rounded-md overflow-hidden">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="product-description" className="text-right pt-2">
                  Описание
                </Label>
                <Textarea
                  id="product-description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="col-span-3 min-h-[100px]"
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productsList.map((product) => (
          <Card key={product.id} className={`${!product.available ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>{product.farm}</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2 cursor-pointer" onClick={() => viewProductDetails(product.id)}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                
                {!product.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                    <span className="text-white font-medium px-2 py-1 bg-black/50 rounded">
                      Нет в наличии
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">{product.price} руб</span>
                <span className={`text-sm font-medium ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                  {product.available ? 'В наличии' : 'Нет в наличии'}
                </span>
              </div>
            </CardContent>
            <CardFooter className={`flex ${isMobile ? 'flex-col' : 'justify-between'} gap-2`}>
              <div className={`flex ${isMobile ? 'w-full' : ''} gap-2`}>
                <Button 
                  variant={product.available ? "outline" : "default"}
                  onClick={() => toggleProductAvailability(product.id)}
                  className={isMobile ? "flex-1" : ""}
                >
                  {product.available ? "Скрыть" : "Показать"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => openProductEditor(product)}
                  className={isMobile ? "flex-1" : ""}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Изменить
                </Button>
              </div>
              <Button 
                variant="destructive"
                onClick={() => openDeleteConfirmation(product)}
                className={isMobile ? "w-full" : ""}
              >
                <Trash className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {selectedProduct && (
        <ProductEditor
          isOpen={isEditProductOpen}
          onClose={() => setIsEditProductOpen(false)}
          product={selectedProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Товар "{productToDelete?.name}" будет удален.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductsManager;

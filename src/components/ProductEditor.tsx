
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureProductSchema } from "@/hooks/useSupabaseData";
import { Loader2 } from "lucide-react";
import { executeSQL } from "@/lib/supabaseClient";

interface ProductEditorProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onProductUpdated: (updatedProduct: any) => void;
}

interface ExtendedProduct {
  id: number;
  name: string;
  farm: string | null;
  price: number;
  image: string | null;
  description: string | null;
  available: boolean;
  created_at: string;
  inventory: number;
  unit: string;
  pricePerHalfKg: boolean;
}

const ProductEditor = ({ isOpen, onClose, product, onProductUpdated }: ProductEditorProps) => {
  const [editedProduct, setEditedProduct] = useState({
    id: 0,
    name: "",
    farm: "",
    price: 0,
    image: "",
    description: "",
    available: true,
    unit: "1 кг",
    inventory: 0,
    pricePerHalfKg: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [schemaReady, setSchemaReady] = useState(false);
  
  useEffect(() => {
    const initSchema = async () => {
      try {
        const success = await ensureProductSchema();
        setSchemaReady(success);
        if (!success) {
          console.error("Failed to ensure product schema");
          toast.error("Ошибка при подготовке базы данных. Пожалуйста, попробуйте позже.");
        }
      } catch (error) {
        console.error("Schema initialization error:", error);
        setSchemaReady(false);
      }
    };
    
    initSchema();
  }, []);
  
  useEffect(() => {
    if (product) {
      console.log("Загружен продукт для редактирования:", product);
      setEditedProduct({
        id: product.id,
        name: product.name || "",
        farm: product.farm || "",
        price: product.price || 0,
        image: product.image || "",
        description: product.description || "",
        available: product.available || true,
        unit: product.unit || "1 кг",
        inventory: typeof product.inventory === 'number' ? product.inventory : 0,
        pricePerHalfKg: Boolean(product.pricePerHalfKg)
      });
    }
  }, [product]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace("product-", "");
    
    // Специальная обработка для числовых полей
    if (fieldName === "price" || fieldName === "inventory") {
      // Убедимся, что значение числовое
      const numValue = parseFloat(value);
      setEditedProduct({
        ...editedProduct,
        [fieldName]: isNaN(numValue) ? 0 : numValue
      });
    } else {
      setEditedProduct({
        ...editedProduct,
        [fieldName]: value
      });
    }
    
    // Добавляем лог для отладки
    if (fieldName === "inventory") {
      console.log(`Установлено inventory: ${value} (${typeof value}), преобразовано в: ${isNaN(parseFloat(value)) ? 0 : parseFloat(value)}`);
    }
  };
  
  const handleToggleAvailability = (checked: boolean) => {
    setEditedProduct({
      ...editedProduct,
      available: checked
    });
  };

  const handleTogglePricePerHalfKg = (checked: boolean) => {
    setEditedProduct({
      ...editedProduct,
      pricePerHalfKg: checked
    });
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedProduct({
      ...editedProduct,
      unit: e.target.value
    });
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!editedProduct.name || !editedProduct.farm || !editedProduct.price) {
        toast.error("Пожалуйста, заполните все обязательные поля");
        setIsLoading(false);
        return;
      }
      
      await ensureProductSchema();
      
      // Убедимся, что inventory сохраняется как число
      const inventoryValue = typeof editedProduct.inventory === 'number' 
        ? editedProduct.inventory 
        : parseFloat(String(editedProduct.inventory)) || 0;
        
      console.log(`Сохраняем inventory: ${inventoryValue} (${typeof inventoryValue})`);
      
      const updateData = {
        name: editedProduct.name,
        farm: editedProduct.farm,
        price: editedProduct.price,
        image: editedProduct.image,
        description: editedProduct.description,
        available: editedProduct.available,
        inventory: inventoryValue,
        unit: editedProduct.unit,
        pricePerHalfKg: editedProduct.pricePerHalfKg
      };
      
      console.log('Обновление продукта с данными:', updateData);
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editedProduct.id)
        .select();
      
      if (error) {
        console.error("Update error:", error);
        
        const sqlQuery = `
          UPDATE products SET 
            name = '${editedProduct.name.replace(/'/g, "''")}', 
            farm = '${(editedProduct.farm || '').replace(/'/g, "''")}', 
            price = ${editedProduct.price},
            image = '${(editedProduct.image || '').replace(/'/g, "''")}',
            description = '${(editedProduct.description || '').replace(/'/g, "''")}',
            available = ${editedProduct.available},
            inventory = ${inventoryValue},
            unit = '${editedProduct.unit.replace(/'/g, "''")}',
            "pricePerHalfKg" = ${editedProduct.pricePerHalfKg}
          WHERE id = ${editedProduct.id};
        `;
        
        console.log("Выполняем SQL-запрос:", sqlQuery);
        
        const { error: sqlError } = await executeSQL(sqlQuery);
        
        if (sqlError) {
          console.error("SQL update error:", sqlError);
          toast.error("Ошибка при обновлении товара");
          setIsLoading(false);
          return;
        }
        
        const { data: fetchedProduct, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', editedProduct.id)
          .single();
          
        if (fetchError) {
          console.error("Error fetching updated product:", fetchError);
          toast.warning("Товар обновлен, но не удалось получить обновленные данные");
        } else {
          console.log("Продукт после обновления:", fetchedProduct);
          onProductUpdated(fetchedProduct);
        }
        
        toast.success("Товар успешно обновлен");
        onClose();
        return;
      }
      
      const { data: updatedProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', editedProduct.id)
        .single();
      
      console.log("Продукт после обновления (из базы):", updatedProduct);  
      onProductUpdated(updatedProduct);
      toast.success("Товар успешно обновлен");
      onClose();
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Ошибка при обновлении товара');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Изменить товар</DialogTitle>
          <DialogDescription>
            Отредактируйте информацию о товаре.
          </DialogDescription>
        </DialogHeader>
        
        {!schemaReady && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Подготовка базы данных...</span>
          </div>
        )}
        
        <div className={`grid gap-4 py-4 ${!schemaReady ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-name" className="text-right">
              Название
            </Label>
            <Input
              id="product-name"
              value={editedProduct.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-farm" className="text-right">
              Хозяйство
            </Label>
            <Input
              id="product-farm"
              value={editedProduct.farm}
              onChange={handleChange}
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
              value={editedProduct.price.toString()}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-unit" className="text-right">
              Единица (кг)
            </Label>
            <Input
              id="product-unit"
              value={editedProduct.unit}
              onChange={handleUnitChange}
              placeholder="Например: 0.25 кг, 0.5 кг, 1 кг"
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
              value={editedProduct.inventory.toString()}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Общее количество в наличии"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-price-per-half-kg" className="text-right">
              Цена за 0.5 кг
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="product-price-per-half-kg"
                checked={editedProduct.pricePerHalfKg}
                onCheckedChange={handleTogglePricePerHalfKg}
              />
              <Label htmlFor="product-price-per-half-kg">
                {editedProduct.pricePerHalfKg ? "Да" : "Нет"}
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-image" className="text-right">
              Изображение
            </Label>
            <Input
              id="product-image"
              value={editedProduct.image}
              onChange={handleChange}
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
              value={editedProduct.description}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-available" className="text-right">
              Доступен
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="product-available"
                checked={editedProduct.available}
                onCheckedChange={handleToggleAvailability}
              />
              <Label htmlFor="product-available">
                {editedProduct.available ? "Да" : "Нет"}
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !schemaReady}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditor;

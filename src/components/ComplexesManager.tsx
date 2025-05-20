import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

export function ComplexesManager() {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [loadingComplexes, setLoadingComplexes] = useState(true);
  const [isAddComplexOpen, setIsAddComplexOpen] = useState(false);
  const [isEditComplexOpen, setIsEditComplexOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [newComplex, setNewComplex] = useState({ name: "", address: "", image: "" });
  const [editingComplex, setEditingComplex] = useState<any>(null);
  const [complexToDelete, setComplexToDelete] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchComplexes();
  }, []);
  
  const fetchComplexes = async () => {
    try {
      setLoadingComplexes(true);
      const { data, error } = await supabase
        .from('residential_complexes')
        .select('*');
      
      if (error) throw error;
      setComplexes(data || []);
      setLoadingComplexes(false);
    } catch (error) {
      console.error('Error fetching complexes:', error);
      toast.error('Ошибка при загрузке ЖК');
      setLoadingComplexes(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditPreview(reader.result as string);
      } else {
        setPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleAddComplex = async () => {
    if (!newComplex.name || !newComplex.address) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      // Use default image or the data URL directly from preview
      const imageUrl = preview || "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png";
      
      const { data, error } = await supabase
        .from('residential_complexes')
        .insert([{
          name: newComplex.name,
          address: newComplex.address,
          image: imageUrl,
          available: true
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setComplexes([...complexes, data[0]]);
        setNewComplex({ name: "", address: "", image: "" });
        setPreview(null);
        setIsAddComplexOpen(false);
        toast.success("Жилой комплекс успешно добавлен");
      }
    } catch (error) {
      console.error('Error adding complex:', error);
      toast.error('Ошибка при добавлении ЖК');
    }
  };
  
  const openEditComplex = (complex: any) => {
    setEditingComplex({...complex});
    setEditPreview(complex.image);
    setIsEditComplexOpen(true);
  };
  
  const handleUpdateComplex = async () => {
    if (!editingComplex?.name || !editingComplex?.address) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      // Use the existing image or the new data URL directly
      const imageUrl = editPreview || editingComplex.image;
      
      const { error } = await supabase
        .from('residential_complexes')
        .update({
          name: editingComplex.name,
          address: editingComplex.address,
          image: imageUrl
        })
        .eq('id', editingComplex.id);
      
      if (error) throw error;
      
      setComplexes(complexes.map(complex => 
        complex.id === editingComplex.id ? 
        {...editingComplex, image: imageUrl} : 
        complex
      ));
      
      setIsEditComplexOpen(false);
      setEditPreview(null);
      toast.success("Жилой комплекс успешно обновлен");
    } catch (error) {
      console.error('Error updating complex:', error);
      toast.error('Ошибка при обновлении ЖК');
    }
  };
  
  const toggleComplexAvailability = async (id: number, available: boolean) => {
    try {
      const { error } = await supabase
        .from('residential_complexes')
        .update({ available: !available })
        .eq('id', id);
      
      if (error) throw error;
      
      setComplexes(
        complexes.map(complex => 
          complex.id === id 
            ? { ...complex, available: !available } 
            : complex
        )
      );
      
      toast.success(`ЖК ${!available ? 'включен' : 'выключен'}`);
    } catch (error) {
      console.error('Error toggling complex availability:', error);
      toast.error('Ошибка при изменении статуса ЖК');
    }
  };
  
  const openDeleteConfirmation = (complex: any) => {
    setComplexToDelete(complex);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDeleteComplex = async () => {
    if (!complexToDelete) return;
    
    try {
      const { error } = await supabase
        .from('residential_complexes')
        .delete()
        .eq('id', complexToDelete.id);
      
      if (error) throw error;
      
      setComplexes(complexes.filter(complex => complex.id !== complexToDelete.id));
      setIsDeleteAlertOpen(false);
      setComplexToDelete(null);
      toast.success("Жилой комплекс успешно удален");
    } catch (error: any) {
      console.error('Error deleting complex:', error);
      
      // Check if error is related to foreign key constraint
      if (error.code === '23503') {
        toast.error('Невозможно удалить ЖК, так как он используется в заказах');
      } else {
        toast.error('Ошибка при удалении ЖК');
      }
    }
  };
  
  if (loadingComplexes) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Жилые комплексы</h2>
        <Dialog open={isAddComplexOpen} onOpenChange={setIsAddComplexOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить ЖК
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Добавить жилой комплекс</DialogTitle>
              <DialogDescription>
                Заполните форму для добавления нового жилого комплекса.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="complex-name" className="text-right text-gray-900">
                  Название
                </Label>
                <Input
                  id="complex-name"
                  value={newComplex.name}
                  onChange={(e) => setNewComplex({...newComplex, name: e.target.value})}
                  className="col-span-3 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="complex-address" className="text-right text-gray-900">
                  Адрес
                </Label>
                <Input
                  id="complex-address"
                  value={newComplex.address}
                  onChange={(e) => setNewComplex({...newComplex, address: e.target.value})}
                  className="col-span-3 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="complex-image" className="text-right pt-2 text-gray-900">
                  Изображение
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="complex-image"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e)}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {complexes.map((complex) => (
          <Card key={complex.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-900">{complex.name}</CardTitle>
              <CardDescription className="text-gray-700">{complex.address}</CardDescription>
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
            <CardFooter className={`flex ${isMobile ? 'flex-col' : 'justify-between'} gap-2`}>
              <div className={`flex ${isMobile ? 'w-full' : ''} gap-2`}>
                <Button 
                  variant={complex.available ? "outline" : "default"}
                  onClick={() => toggleComplexAvailability(complex.id, complex.available)}
                  className={isMobile ? "flex-1" : ""}
                >
                  {complex.available ? "Скрыть" : "Показать"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => openEditComplex(complex)}
                  className={isMobile ? "flex-1" : ""}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Изменить
                </Button>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => openDeleteConfirmation(complex)}
                className={isMobile ? "w-full" : ""}
              >
                <Trash className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Dialog open={isEditComplexOpen} onOpenChange={setIsEditComplexOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Редактировать жилой комплекс</DialogTitle>
          </DialogHeader>
          {editingComplex && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-complex-name" className="text-right text-gray-900">
                    Название
                  </Label>
                  <Input
                    id="edit-complex-name"
                    value={editingComplex.name}
                    onChange={(e) => setEditingComplex({...editingComplex, name: e.target.value})}
                    className="col-span-3 text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-complex-address" className="text-right text-gray-900">
                    Адрес
                  </Label>
                  <Input
                    id="edit-complex-address"
                    value={editingComplex.address}
                    onChange={(e) => setEditingComplex({...editingComplex, address: e.target.value})}
                    className="col-span-3 text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-complex-image" className="text-right pt-2 text-gray-900">
                    Изображение
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <Input
                      id="edit-complex-image"
                      type="file"
                      accept="image/*"
                      ref={editFileInputRef}
                      onChange={(e) => handleFileChange(e, true)}
                      className="w-full"
                    />
                    
                    {editPreview && (
                      <div className="mt-2 relative w-full h-40 border rounded-md overflow-hidden">
                        <img
                          src={editPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditComplexOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleUpdateComplex}>Сохранить</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Жилой комплекс "{complexToDelete?.name}" будет удален.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComplex} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ComplexesManager;

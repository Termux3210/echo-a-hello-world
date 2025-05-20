
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile";

export function DeliveryManager() {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [deliveryDatesList, setDeliveryDatesList] = useState<any[]>([]);
  const [loadingComplexes, setLoadingComplexes] = useState(true);
  const [loadingDeliveryDates, setLoadingDeliveryDates] = useState(true);
  const [isAddDeliveryDateOpen, setIsAddDeliveryDateOpen] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState({ date: "", complexIds: [] as number[] });
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchData();
  }, []);
  
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
      
      // Fetch delivery dates
      setLoadingDeliveryDates(true);
      const { data: datesData, error: datesError } = await supabase
        .from('delivery_dates')
        .select('*');
      
      if (datesError) throw datesError;
      setDeliveryDatesList(datesData || []);
      setLoadingDeliveryDates(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка при загрузке данных');
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
  
  // Handler for deleting a delivery date
  const handleDeleteDeliveryDate = async (id: number) => {
    try {
      const { error } = await supabase
        .from('delivery_dates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDeliveryDatesList(
        deliveryDatesList.filter(d => d.id !== id)
      );
      
      toast.success("Дата доставки удалена");
    } catch (error) {
      console.error('Error deleting delivery date:', error);
      toast.error('Ошибка при удалении даты доставки');
    }
  };
  
  if (loadingDeliveryDates || loadingComplexes) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Даты доставки</h2>
        <Dialog open={isAddDeliveryDateOpen} onOpenChange={setIsAddDeliveryDateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить дату
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
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
      
      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
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
                  <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} items-end gap-2`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`${isMobile ? 'w-full' : 'mr-2'} text-red-600 hover:text-red-800`}
                      onClick={() => handleDeleteDeliveryDate(date.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeliveryManager;

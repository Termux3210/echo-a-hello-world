
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Check, Trash } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdmins } from "@/hooks/useSupabaseData";

export function AdminsManager() {
  const { data: adminsList, isLoading: loadingAdmins, refetch } = useAdmins();
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ telegramUsername: "", name: "" });
  const isMobile = useIsMobile();
  
  // Handler for adding a new admin
  const handleAddAdmin = async () => {
    if (!newAdmin.telegramUsername || !newAdmin.name) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    
    // Validate Telegram username format
    if (!newAdmin.telegramUsername.startsWith("@")) {
      toast.error("Имя пользователя Telegram должно начинаться с @");
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
        setNewAdmin({ telegramUsername: "", name: "" });
        setIsAddAdminOpen(false);
        toast.success("Администратор успешно добавлен");
        refetch(); // Refresh the admins list
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Ошибка при добавлении администратора');
    }
  };
  
  // Handler for removing an admin
  const handleRemoveAdmin = async (adminId: number) => {
    try {
      // Don't allow deleting the last admin
      if (!adminsList || adminsList.length <= 1) {
        toast.error('Невозможно удалить последнего администратора');
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({ is_admin: false })
        .eq('id', adminId);
      
      if (error) throw error;
      
      toast.success("Администратор удален");
      refetch(); // Refresh the admins list
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Ошибка при удалении администратора');
    }
  };
  
  if (loadingAdmins) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Администраторы</h2>
        <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить администратора
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
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
      
      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
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
            {adminsList && adminsList.map((admin) => (
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
                    onClick={() => handleRemoveAdmin(admin.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminsManager;

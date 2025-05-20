
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { MessageCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const { login, loading, isAdmin } = useAdmin();
  const navigate = useNavigate();
  
  // If already logged in, redirect to admin panel
  useEffect(() => {
    if (isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      toast.error("Пожалуйста, введите имя пользователя Telegram");
      return;
    }
    
    // Normalize username format
    let normalizedUsername = username;
    if (!normalizedUsername.startsWith("@")) {
      normalizedUsername = "@" + normalizedUsername;
    }
    
    const success = await login(normalizedUsername);
    
    if (success) {
      toast.success("Вход выполнен успешно");
      navigate("/admin");
    } else {
      toast.error("Ошибка входа. Проверьте имя пользователя или права доступа.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500 text-white p-3 rounded-full">
              <MessageCircle size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Вход в админ-панель</h1>
          <p className="mt-2 text-sm text-gray-600">
            Введите имя пользователя Telegram для входа
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Имя пользователя Telegram
            </label>
            <div className="mt-1 relative">
              {!username.startsWith("@") && username.length > 0 && (
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">@</span>
              )}
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full ${!username.startsWith("@") && username.length > 0 ? "pl-8" : ""}`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Например: @admin</p>
          </div>
          
          <div>
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Для тестирования используйте: @admin</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

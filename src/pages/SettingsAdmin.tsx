
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { fetchSettings, saveSettings } from "@/lib/settingsService";
import { supabase } from "@/lib/supabaseClient";

const SettingsAdmin = () => {
  const [settings, setSettings] = useState({
    siteName: "Фермерские продукты",
    contactEmail: "contact@example.com",
    contactPhone: "+7 (999) 123-45-67",
    telegramBot: "@farm_products_bot",
    siteDescription: "Доставка свежих фермерских продуктов прямо к вам домой.",
    siteTitle: "Свежие фермерские продукты с доставкой",
    siteSubtitle: "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
    enableNotifications: true,
    telegramNotifications: true,
    maintenanceMode: false
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const getSettings = async () => {
      try {
        setLoadingSettings(true);
        
        // Получаем настройки
        const result = await fetchSettings();
        
        if (result.success && result.data) {
          console.log("Получены настройки:", result.data);
          setSettings({
            siteName: result.data.site_name || "Фермерские продукты",
            contactEmail: result.data.contact_email || "contact@example.com",
            contactPhone: result.data.contact_phone || "+7 (999) 123-45-67",
            telegramBot: result.data.telegram_bot || "@farm_products_bot",
            siteDescription: result.data.site_description || "Доставка свежих фермерских продуктов прямо к вам домой.",
            siteTitle: result.data.site_title || "Свежие фермерские продукты с доставкой",
            siteSubtitle: result.data.site_subtitle || "Выберите ваш жилой комплекс и получите свежие продукты прямо к вашей двери",
            enableNotifications: result.data.enable_notifications !== false,
            telegramNotifications: result.data.telegram_notifications !== false,
            maintenanceMode: result.data.maintenance_mode === true
          });
        } else {
          console.warn("Используются настройки по умолчанию, нет данных из БД");
        }
        
        setLoadingSettings(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Ошибка при загрузке настроек');
        setLoadingSettings(false);
      }
    };
    
    getSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      console.log("Сохраняем настройки:", settings);
      
      // Сохраняем настройки
      const result = await saveSettings(settings);
      
      if (result.success) {
        toast.success("Настройки успешно сохранены");
        
        // Сразу применяем новые настройки в UI
        window.dispatchEvent(new CustomEvent('settingsUpdated', { 
          detail: {
            site_name: settings.siteName,
            contact_email: settings.contactEmail,
            contact_phone: settings.contactPhone,
            telegram_bot: settings.telegramBot,
            site_description: settings.siteDescription,
            site_title: settings.siteTitle,
            site_subtitle: settings.siteSubtitle,
            enable_notifications: settings.enableNotifications,
            telegram_notifications: settings.telegramNotifications,
            maintenance_mode: settings.maintenanceMode
          }
        }));
      } else {
        console.error("Settings save error:", result.error);
        toast.error('Ошибка при сохранении настроек');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loadingSettings) {
    return (
      <AdminLayout title="Настройки">
        <div className="text-center py-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Загрузка настроек...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Настройки">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Общие настройки</CardTitle>
            <CardDescription>Основная информация о сайте</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site-name" className="text-gray-900">Название сайта</Label>
                <Input 
                  id="site-name" 
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-gray-900">Контактный email</Label>
                <Input 
                  id="contact-email" 
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone" className="text-gray-900">Контактный телефон</Label>
                <Input 
                  id="contact-phone" 
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram-bot" className="text-gray-900">Telegram бот</Label>
                <Input 
                  id="telegram-bot" 
                  value={settings.telegramBot}
                  onChange={(e) => setSettings({...settings, telegramBot: e.target.value})}
                  className="text-gray-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-description" className="text-gray-900">Описание сайта</Label>
              <Textarea 
                id="site-description" 
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                rows={3}
                className="text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-title" className="text-gray-900">Заголовок на главной странице</Label>
              <Input 
                id="site-title" 
                value={settings.siteTitle}
                onChange={(e) => setSettings({...settings, siteTitle: e.target.value})}
                className="text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-subtitle" className="text-gray-900">Подзаголовок на главной странице</Label>
              <Textarea 
                id="site-subtitle" 
                value={settings.siteSubtitle}
                onChange={(e) => setSettings({...settings, siteSubtitle: e.target.value})}
                rows={2}
                className="text-gray-900"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Настройки уведомлений</CardTitle>
            <CardDescription>Управление способами отправки уведомлений</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-notifications" className="font-medium text-gray-900">Включить уведомления</Label>
                <p className="text-sm text-gray-700">
                  Отправлять уведомления клиентам и администраторам
                </p>
              </div>
              <Switch 
                id="enable-notifications" 
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="telegram-notifications" className="font-medium text-gray-900">Telegram уведомления</Label>
                <p className="text-sm text-gray-700">
                  Отправлять уведомления через Telegram
                </p>
              </div>
              <Switch 
                id="telegram-notifications" 
                checked={settings.telegramNotifications}
                onCheckedChange={(checked) => setSettings({...settings, telegramNotifications: checked})}
                disabled={!settings.enableNotifications}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Системные настройки</CardTitle>
            <CardDescription>Настройки технического обслуживания</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance-mode" className="font-medium text-gray-900">Режим обслуживания</Label>
                <p className="text-sm text-gray-700">
                  Временно закрыть сайт для технического обслуживания
                </p>
              </div>
              <Switch 
                id="maintenance-mode" 
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => {
                  if (checked) {
                    if (window.confirm("Вы уверены, что хотите включить режим обслуживания? Сайт будет недоступен для пользователей.")) {
                      setSettings({...settings, maintenanceMode: checked});
                    }
                  } else {
                    setSettings({...settings, maintenanceMode: checked});
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsAdmin;

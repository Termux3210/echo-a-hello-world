
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isTelegramWebApp, sendMessageToBot, getTelegramUser } from "@/lib/telegramWebApp";
import { useToast } from "@/hooks/use-toast";
import { getCurrentTelegramUserId } from '@/lib/telegramWebAppIntegration';
import { TELEGRAM_BOT_USERNAME } from '@/lib/telegramConfig';
import { Send, MessageSquare, ExternalLink } from 'lucide-react';

interface TelegramMessageSenderProps {
  className?: string;
}

export function TelegramMessageSender({ className }: TelegramMessageSenderProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const user = getTelegramUser();
  const userId = getCurrentTelegramUserId();
  
  // Only show this component if we're in a Telegram WebApp
  if (!isTelegramWebApp()) {
    return (
      <div className={`flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-900" />
          Телеграм интеграция
        </h3>
        <p className="text-sm text-gray-600">
          Для полной функциональности приложения, подключитесь к нашему Телеграм боту.
        </p>
        <WebAppButton />
      </div>
    );
  }
  
  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите сообщение",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Add user ID to the message if available
      const messageWithUserId = user ? 
        JSON.stringify({ 
          message: message, 
          userId: userId || user.id,
          username: user.username,
          firstName: user.first_name 
        }) : message;
      
      sendMessageToBot(messageWithUserId);
      toast({
        title: "Успешно",
        description: "Сообщение отправлено в бот",
      });
      setMessage("");
    } catch (error) {
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщение в бот",
        variant: "destructive",
      });
      console.error("Failed to send message to bot:", error);
    }
  };
  
  return (
    <div className={`flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm ${className}`}>
      <h3 className="text-lg font-medium">Отправить сообщение в бот</h3>
      {user && (
        <div className="text-sm text-gray-600 mb-2">
          Пользователь: {user.first_name} {user.last_name || ''} {user.username ? `(@${user.username})` : ''}
          {userId && <span className="block mt-1">ID: {userId}</span>}
        </div>
      )}
      <div className="flex gap-2">
        <Input 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Введите ваше сообщение..."
          className="flex-1"
        />
        <Button onClick={handleSendMessage}>
          <Send className="h-4 w-4 mr-2 text-white" />
          Отправить
        </Button>
      </div>
    </div>
  );
}

function WebAppButton() {
  const getTelegramBotLink = () => {
    return `https://t.me/${TELEGRAM_BOT_USERNAME}`;
  };

  const getWebAppLink = () => {
    const currentUrl = window.location.origin;
    return `https://t.me/${TELEGRAM_BOT_USERNAME}/app?startapp=${encodeURIComponent(currentUrl)}`;
  };

  return (
    <a 
      href={getWebAppLink()} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="no-underline"
    >
      <Button className="w-full bg-[#0088cc] hover:bg-[#0099dd] text-white">
        <MessageSquare className="h-4 w-4 mr-2 text-white" />
        Открыть в Telegram
        <ExternalLink className="h-4 w-4 ml-2 text-white" />
      </Button>
    </a>
  );
}

export default TelegramMessageSender;

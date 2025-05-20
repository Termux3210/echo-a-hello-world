
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initTelegramWebApp } from './lib/telegramWebApp'

// Initialize Telegram WebApp if available in a safe way
try {
  initTelegramWebApp();
} catch (error) {
  console.error('Failed to initialize Telegram WebApp:', error);
}

// Handle Telegram WebApp theme
document.addEventListener('DOMContentLoaded', function () {
  // Initialize AOS if available
  if (typeof window.AOS !== 'undefined') {
    window.AOS.init({
      duration: 300,
      once: true,
      easing: 'ease-out',
    });
  }

  // Telegram WebApp: theme setup - wrapped in try/catch for safety
  try {
    if (window.Telegram?.WebApp) {
      const theme = window.Telegram.WebApp.colorScheme;
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update icons
      const icons = document.querySelectorAll('.nav-icon');
      icons.forEach(icon => {
        const lightIcon = icon.getAttribute('data-light');
        const darkIcon = icon.getAttribute('data-dark');
        if (lightIcon && darkIcon) {
          (icon as HTMLImageElement).src = (theme === 'dark') ? darkIcon : lightIcon;
        }
      });

      // Change text color for dark theme
      document.querySelectorAll('.nav-item').forEach(item => {
        if (theme === 'dark') {
          (item as HTMLElement).style.color = "#000000";
        } else {
          (item as HTMLElement).style.color = "#ffffff";
        }
      });
    }
  } catch (error) {
    console.error('Error applying Telegram theme:', error);
  }
});

// Initialize the React application
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}

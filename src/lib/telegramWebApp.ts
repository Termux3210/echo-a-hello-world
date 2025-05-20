
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme: 'light' | 'dark'; // Add the colorScheme property
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        sendData: (data: string) => void;
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: string;
          hash?: string;
        };
      };
    };
  }
}

/**
 * Safely checks if the app is running inside a Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  try {
    return Boolean(window.Telegram?.WebApp);
  } catch (error) {
    console.error("Error checking Telegram WebApp:", error);
    return false;
  }
}

/**
 * Safely returns the Telegram WebApp instance if available
 */
export function getTelegramWebApp() {
  try {
    if (isTelegramWebApp()) {
      return window.Telegram.WebApp;
    }
  } catch (error) {
    console.error("Error getting Telegram WebApp:", error);
  }
  return null;
}

/**
 * Safely send a message to the Telegram bot via WebApp
 * @param message The message to send
 */
export function sendMessageToBot(message: string) {
  try {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.sendData(JSON.stringify({ action: 'message', data: message }));
    } else {
      console.log('Telegram WebApp not available');
    }
  } catch (error) {
    console.error("Error sending message to Telegram bot:", error);
  }
}

/**
 * Safely initialize the Telegram WebApp
 */
export function initTelegramWebApp() {
  try {
    const webApp = getTelegramWebApp();
    if (webApp) {
      // Tell Telegram WebApp we're ready
      webApp.ready();
      // Expand the WebApp to take full height
      webApp.expand();
      console.info("[Telegram.WebView] > postEvent web_app_ready");
      console.info("[Telegram.WebView] > postEvent web_app_expand");
    }
  } catch (error) {
    console.error("Error initializing Telegram WebApp:", error);
  }
}

/**
 * Safely expand the Telegram WebApp to take full height
 */
export function expandWebApp() {
  try {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.expand();
      console.info("[Telegram.WebView] > postEvent web_app_expand");
    }
  } catch (error) {
    console.error("Error expanding Telegram WebApp:", error);
  }
}

/**
 * Safely close the Telegram WebApp
 */
export function closeWebApp() {
  try {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.close();
    }
  } catch (error) {
    console.error("Error closing Telegram WebApp:", error);
  }
}

/**
 * Safely get user information from Telegram WebApp
 */
export function getTelegramUser() {
  try {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
      return webApp.initDataUnsafe.user;
    }
  } catch (error) {
    console.error("Error getting Telegram user:", error);
  }
  return null;
}

/**
 * Check if the current route includes the specified path
 */
export function isTelegramStartRoute(path: string): boolean {
  try {
    return window.location.pathname.includes(`/start_from_telegram/${path}`);
  } catch (error) {
    console.error("Error checking Telegram start route:", error);
    return false;
  }
}

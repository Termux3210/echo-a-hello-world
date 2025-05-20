
/// <reference types="vite/client" />

interface Window {
  AOS?: {
    init: (options: {
      duration?: number;
      once?: boolean;
      easing?: string;
    }) => void;
  };
}

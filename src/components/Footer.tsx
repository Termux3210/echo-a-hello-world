
import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-6 border-t mt-auto bg-white">
      <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground flex flex-col items-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span>Сделано с</span>
          <Heart className="h-4 w-4 text-red-500 fill-current" />
          <span>для вас</span>
        </div>
      </div>
    </footer>
  );
}

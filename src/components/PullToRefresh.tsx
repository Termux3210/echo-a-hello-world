
import { useEffect } from 'react';

const PullToRefresh = () => {
  useEffect(() => {
    let startY: number;
    let loadingIndicator: HTMLDivElement | null = null;

    // Create loading indicator
    function createLoadingIndicator() {
      const indicator = document.createElement('div');
      indicator.style.position = 'fixed';
      indicator.style.top = '10px';
      indicator.style.left = '50%';
      indicator.style.transform = 'translateX(-50%)';
      indicator.style.width = '40px';
      indicator.style.height = '40px';
      indicator.style.border = '3px solid rgba(150, 150, 150, 0.5)';
      indicator.style.borderRadius = '50%';
      indicator.style.borderTopColor = '#007AFF';
      indicator.style.zIndex = '9999';
      indicator.style.transition = 'opacity 0.3s';
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none';
      indicator.style.animation = 'spin 1s linear infinite';
      
      // Add rotation animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(indicator);
      return indicator;
    }

    const touchStartHandler = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      
      // Create indicator at first touch
      if (!loadingIndicator) {
        loadingIndicator = createLoadingIndicator();
      }
    };

    const touchMoveHandler = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const pullDistance = currentY - startY;
      
      if (scrollTop === 0 && currentY > startY) {
        e.preventDefault();
        
        // Show indicator and animate based on pull distance
        if (pullDistance > 0 && loadingIndicator) {
          const opacity = Math.min(pullDistance / 100, 0.8);
          const scale = Math.min(pullDistance / 100, 1);
          
          loadingIndicator.style.opacity = String(opacity);
          loadingIndicator.style.transform = `translateX(-50%) scale(${scale})`;
        }
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (!loadingIndicator) return;
      
      const currentY = e.changedTouches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop === 0 && currentY > startY && (currentY - startY) > 80) {
        // Animation before refresh
        loadingIndicator.style.opacity = '1';
        
        // Refresh page after short delay
        setTimeout(() => {
          location.reload();
        }, 300);
      } else {
        // Hide indicator if not enough swipe
        loadingIndicator.style.opacity = '0';
      }
    };

    document.addEventListener('touchstart', touchStartHandler, { passive: true });
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);

    return () => {
      document.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('touchend', touchEndHandler);
      
      // Remove the indicator when component unmounts
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PullToRefresh;

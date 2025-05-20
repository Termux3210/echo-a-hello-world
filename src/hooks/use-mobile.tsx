
import * as React from "react"
import { isTelegramWebApp } from "@/lib/telegramWebApp"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const checkMobile = () => {
      // Consider Telegram WebApp as mobile by default
      if (isTelegramWebApp()) {
        setIsMobile(true)
        return
      }
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    const onChange = () => {
      checkMobile()
    }
    
    mql.addEventListener("change", onChange)
    checkMobile()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export default useIsMobile

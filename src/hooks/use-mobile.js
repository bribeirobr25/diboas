import * as React from "react"

const SCREEN_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
}

/**
 * Hook to detect current screen size and device type
 * @returns {Object} Screen size information and device checks
 */
export function useScreenSize() {
  const [screenInfo, setScreenInfo] = React.useState({
    width: undefined,
    height: undefined,
    isMobile: undefined,
    isTablet: undefined,
    isDesktop: undefined
  })

  React.useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenInfo({
        width,
        height,
        isMobile: width < SCREEN_BREAKPOINTS.mobile,
        isTablet: width >= SCREEN_BREAKPOINTS.mobile && width < SCREEN_BREAKPOINTS.tablet,
        isDesktop: width >= SCREEN_BREAKPOINTS.tablet
      })
    }

    const mediaQueryList = window.matchMedia(`(max-width: ${SCREEN_BREAKPOINTS.mobile - 1}px)`)
    
    // Initial check
    updateScreenInfo()
    
    // Listen for changes
    mediaQueryList.addEventListener("change", updateScreenInfo)
    window.addEventListener("resize", updateScreenInfo)
    
    return () => {
      mediaQueryList.removeEventListener("change", updateScreenInfo)
      window.removeEventListener("resize", updateScreenInfo)
    }
  }, [])

  return screenInfo
}

// Legacy alias for backward compatibility  
export function useIsMobile() {
  const { isMobile } = useScreenSize()
  return !!isMobile
}

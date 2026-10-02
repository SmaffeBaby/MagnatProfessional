export const BREAKPOINTS = {
  mobile: {
    min: 320,
    max: 768,
  },
  tablet: {
    min: 768,
    max: 1199,
  },
  desktop: {
    min: 1200,
  },
}

export const screens = {
  mobile: {
    min: `${BREAKPOINTS.mobile.min}px`,
    max: `${BREAKPOINTS.mobile.max}px`,
  },
  tablet: {
    min: `${BREAKPOINTS.tablet.min}px`,
    max: `${BREAKPOINTS.tablet.max}px`,
  },
  desktop: `${BREAKPOINTS.desktop.min}px`,
}

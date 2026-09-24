export const BREAKPOINTS = {
  mobile: {
    min: 375,
    max: 1040,
  },
  tablet: {
    min: 1040,
    max: 1300,
  },
  desktop: {
    min: 1301,
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

/* eslint-disable @typescript-eslint/no-explicit-any */
// Type declarations for third-party libs without types
declare module 'jspdf' {
  export const jsPDF: any;
  const _default: any;
  export default _default;
}

declare module 'js-cookie' {
  const Cookies: any;
  export default Cookies;
}

// Allow importing images
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

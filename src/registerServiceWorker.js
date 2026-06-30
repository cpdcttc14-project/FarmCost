export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || './';
    const swUrl = `${baseUrl}sw.js`;

    navigator.serviceWorker.register(swUrl, { scope: baseUrl }).catch((error) => {
      console.warn('FarmCost service worker registration failed:', error);
    });
  });
}

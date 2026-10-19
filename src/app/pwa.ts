/** Registra o service worker (push notifications). Só em produção. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sem SW: app funciona normalmente, só sem push */
    })
  })
}

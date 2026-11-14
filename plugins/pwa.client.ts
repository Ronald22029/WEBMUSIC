// Instalación progresiva. El service worker nunca almacena audio ni catálogos privados.
export default defineNuxtPlugin(()=>{
  if(!('serviceWorker' in navigator))return
  window.addEventListener('load',()=>{
    void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{
      // La web continúa funcionando sin service worker.
    })
  },{once:true})
})

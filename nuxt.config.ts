export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2025-07-01',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  app: { head: { htmlAttrs: { lang: 'es' }, title: 'WEBMUSIC — Tu biblioteca musical', meta: [
    { name: 'description', content: 'Explora artistas, álbumes y canciones en WEBMUSIC, tu biblioteca musical.' },
    { name: 'theme-color', content: '#0a0b11' }
  ] } },
  runtimeConfig: { public: { siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000' } }
})

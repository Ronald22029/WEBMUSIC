export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2025-07-17',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: { preset: 'cloudflare_module' },
  runtimeConfig: {
    adminPassword: '',
    adminSessionSecret: '',
    public: { siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000' }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'WEBMUSIC — Tu biblioteca musical',
      meta: [
        { name: 'description', content: 'Explora artistas, álbumes y canciones en WEBMUSIC.' },
        { name: 'theme-color', content: '#080a11' }
      ]
    }
  }
})

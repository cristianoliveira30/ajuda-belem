export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@vite-pwa/nuxt'],

  // Desligado: o botão flutuante do DevTools (tempo de página + ícone)
  // aparecia por cima da barra de navegação inferior no celular. Para ligar
  // de novo durante o desenvolvimento, troque para `true` (ou use Shift+Alt+D
  // com ele habilitado).
  devtools: { enabled: false },
  compatibilityDate: '2026-09-18',

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/avisos': { swr: 3600 },
    '/contatos': { swr: 3600 },
  },

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['icons/favicon-16.png', 'icons/favicon-32.png'],
    manifest: {
      name: 'Ajuda Belém',
      short_name: 'Ajuda Belém',
      description: 'Registre e acompanhe solicitações de infraestrutura urbana em Belém do Pará.',
      lang: 'pt-BR',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2563eb',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Só cacheia os arquivos estáticos da build (app shell), nunca respostas
      // de API — evita mostrar dados de solicitações desatualizados como se
      // fossem atuais quando o cidadão está offline.
      globPatterns: ['**/*.{js,css,html,woff2}'],
      navigateFallback: null,
    },
    devOptions: {
      enabled: false,
    },
  },

  app: {
    head: {
      title: 'Ajuda Belém',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        {
          name: 'description',
          content: 'Portal de solicitações de serviços de infraestrutura urbana da Prefeitura de Belém.',
        },
        { name: 'theme-color', content: '#2563eb' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
    },
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },

  nitro: {
    storage: {
      solicitacoes: { driver: 'fs', base: './.data/solicitacoes' },
    },
  },
})

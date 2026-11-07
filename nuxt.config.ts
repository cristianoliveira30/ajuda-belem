export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', 'nuxt-auth-utils'],

  devtools: { enabled: true },
  compatibilityDate: '2026-09-18',

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Ajuda Belém',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        {
          name: 'description',
          content: 'Portal de solicitações de serviços de infraestrutura urbana da Prefeitura de Belém.',
        },
      ],
    },
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },
})

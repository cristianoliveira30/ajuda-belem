// Substitui o `redirect`/`redirectOptions` que o módulo @nuxtjs/supabase
// fazia automaticamente: exige sessão para as rotas de conta do cidadão,
// redirecionando para /entrar quem não estiver logado. A checagem extra de
// "é servidor?" para /painel fica em app/middleware/servidor.ts.
const ROTAS_PROTEGIDAS = ['/perfil', '/minhas-solicitacoes']

export default defineNuxtRouteMiddleware(async (to) => {
  const protegida = ROTAS_PROTEGIDAS.includes(to.path) || to.path.startsWith('/painel')
  if (!protegida)
    return

  const { data } = await useSessao()

  if (!data.value?.user)
    return navigateTo('/entrar')
})

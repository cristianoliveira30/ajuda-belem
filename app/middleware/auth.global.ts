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
  const usuario = data.value?.user

  if (!usuario)
    return navigateTo('/entrar')

  // Login por Google não pede CPF (ver server/utils/auth.ts) — cidadão
  // autenticado sem CPF completa isso direto em /perfil (ver
  // app/pages/perfil.vue), então só precisa ser mandado pra lá antes de
  // entrar em outra área de conta. Servidor nunca cai aqui: a exigência é só
  // para cidadão (ver server/api/perfil/completar-cadastro.post.ts).
  const cadastroIncompleto = usuario.papel === 'cidadao' && !usuario.cpf

  if (cadastroIncompleto && to.path !== '/perfil')
    return navigateTo('/perfil')
})

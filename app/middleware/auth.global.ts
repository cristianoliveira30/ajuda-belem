// Substitui o `redirect`/`redirectOptions` que o módulo @nuxtjs/supabase
// fazia automaticamente: exige sessão para as rotas de conta do cidadão,
// redirecionando para /entrar quem não estiver logado. A checagem extra de
// "é servidor?" para /painel fica em app/middleware/servidor.ts.
// /solicitacoes/nova entrou aqui junto: registrar uma ocorrência agora exige
// sessão (ver server/api/solicitacoes/index.post.ts) — sem isso, o cidadão
// preenchia o chat inteiro só pra descobrir um 401 no final.
const ROTAS_PROTEGIDAS = ['/perfil', '/solicitacoes/nova']

export default defineNuxtRouteMiddleware(async (to) => {
  // /solicitacoes/acompanhar é dupla: com `?protocolo=` é a busca pública
  // (usada pelo mapa e pela busca da home, sem exigir login, sem dado
  // pessoal — ver server/api/solicitacoes/[protocolo].get.ts); sem
  // `?protocolo=` é o dashboard pessoal do cidadão (GET /api/minhas-solicitacoes),
  // que precisa de sessão.
  const dashboardAcompanhar = to.path === '/solicitacoes/acompanhar' && !to.query.protocolo

  const protegida = ROTAS_PROTEGIDAS.includes(to.path) || to.path.startsWith('/painel') || dashboardAcompanhar
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

  // Mesmo padrão do CPF acima, pro servidor criado pelo admin (ver
  // server/api/admin/servidores/index.post.ts): antes de trocar a senha
  // inicial, só pode acessar /perfil (onde o formulário obrigatório de nova
  // senha aparece). Backend também bloqueia isso de verdade — ver
  // server/utils/exigirServidor.ts.
  const primeiroAcessoPendente = usuario.papel === 'servidor' && usuario.primeiroAcesso

  if ((cadastroIncompleto || primeiroAcessoPendente) && to.path !== '/perfil')
    return navigateTo('/perfil')
})

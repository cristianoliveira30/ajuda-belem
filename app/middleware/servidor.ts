export default defineNuxtRouteMiddleware(async () => {
  // Sessão ausente: app/middleware/auth.global.ts já redireciona para
  // /entrar antes deste rodar. Primeiro acesso pendente também já foi
  // desviado pra /perfil por lá antes de chegar aqui.
  const { data } = await useSessao()
  const usuario = data.value?.user

  const podeAcessar = usuario?.papel === 'servidor' || usuario?.papel === 'admin'

  if (!podeAcessar || usuario?.banned)
    return navigateTo('/')
})

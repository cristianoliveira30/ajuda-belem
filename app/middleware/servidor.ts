export default defineNuxtRouteMiddleware(async () => {
  // Sessão ausente: app/middleware/auth.global.ts já redireciona para
  // /entrar antes deste rodar.
  const { data } = await useSessao()

  if (data.value?.user.papel !== 'servidor')
    return navigateTo('/')
})

export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value || user.value?.tipo !== 'cidadao') {
    return navigateTo('/entrar')
  }
})

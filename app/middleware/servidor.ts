export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value || user.value?.tipo !== 'servidor') {
    return navigateTo('/entrar')
  }
})

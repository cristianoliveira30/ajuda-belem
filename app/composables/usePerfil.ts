import type { Perfil } from '#shared/types/perfil'

export function usePerfil() {
  const { data, status, error, refresh } = useSessao()

  const perfil = computed<Perfil | null>(() => {
    const user = data.value?.user
    if (!user)
      return null

    return {
      id: user.id,
      nome: user.name,
      email: user.email,
      cpf: user.cpf ?? null,
      telefone: user.telefone ?? null,
      papel: user.papel,
      secretaria: user.secretaria ?? null,
    }
  })

  return { perfil, status, error, refresh }
}

import type { SessaoUsuario } from '#shared/types/perfil'

// Wrapper fino sobre GET /api/auth/get-session com uma `key` fixa, para o
// Nuxt reaproveitar a mesma resposta entre o middleware global, o cabeçalho
// e a página atual em vez de disparar uma requisição por consumidor.
export function useSessao() {
  return useFetch<{ user: SessaoUsuario } | null>('/api/auth/get-session', {
    key: 'sessao',
  })
}

import type { SessaoUsuario } from '#shared/types/perfil'

// Único lugar que decide para onde cada papel vai depois de entrar (usado
// pelo login em app/pages/entrar.vue e pelo redirecionamento de quem já está
// logado e abre /entrar de novo):
//   admin     → /painel               (visão geral + administração de servidores)
//   servidor  → /painel/solicitacoes  (fila de atendimento)
//   cidadão   → /perfil
// Servidor em primeiro acesso vai para /perfil: lá fica o formulário
// obrigatório de nova senha (ver app/middleware/auth.global.ts).
export function destinoPosLogin(usuario: Pick<SessaoUsuario, 'papel' | 'primeiroAcesso'>): string {
  if (usuario.papel === 'admin')
    return '/painel'

  if (usuario.papel === 'servidor')
    return usuario.primeiroAcesso ? '/perfil' : '/painel/solicitacoes'

  return '/perfil'
}

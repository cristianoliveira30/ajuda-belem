// Heurística de defesa em profundidade: identifica padrões de payload de XSS
// (HTML/JavaScript) e de injeção de SQL em texto livre digitado pelo cidadão
// ou pelo servidor, para avisar e bloquear o envio antes de gravar o dado.
//
// Isso NÃO substitui a proteção "de verdade": o Vue já escapa toda
// interpolação `{{ }}` por padrão (não há v-html com dado do usuário neste
// projeto) e não existe SQL bruto em nenhum lugar do código — as consultas ao
// Postgres passam pelo Better Auth (query builder Kysely internamente), que
// já é imune a injeção de SQL por construção. Esta checagem é só uma camada
// extra de sinalização/atrito para o usuário, não o mecanismo que garante a
// segurança.

export type TipoAmeacaEntrada = 'xss' | 'sql'

const PADROES_XSS: RegExp[] = [
  /<\s*script[\s>]/i,
  /<\s*\/\s*script\s*>/i,
  /<\s*iframe[\s>]/i,
  /<\s*svg[^>]*\bon\w+\s*=/i,
  /<\s*img[^>]+\bonerror\s*=/i,
  /\bon(error|load|click|mouseover|focus)\s*=\s*['"]/i,
  /javascript\s*:/i,
  /document\s*\.\s*(cookie|write)\s*\(/i,
]

const PADROES_SQL: RegExp[] = [
  /\bunion\b[\s\S]{0,30}\bselect\b/i,
  /\bselect\b[\s\S]{0,30}\bfrom\b[\s\S]{0,30}\bwhere\b/i,
  /\bdrop\s+table\b/i,
  /\binsert\s+into\b[\s\S]{0,30}\bvalues\b/i,
  /\bdelete\s+from\b/i,
  /'\s*or\s*'?\s*1\s*'?\s*=\s*'?\s*1/i,
  /;\s*--/,
  /\bxp_cmdshell\b/i,
]

export function detectarAmeacaEntrada(texto: string | undefined | null): TipoAmeacaEntrada | null {
  if (!texto)
    return null

  if (PADROES_XSS.some(padrao => padrao.test(texto)))
    return 'xss'

  if (PADROES_SQL.some(padrao => padrao.test(texto)))
    return 'sql'

  return null
}

export function detectarAmeacaEmCampos(valores: Array<string | undefined | null>): TipoAmeacaEntrada | null {
  for (const valor of valores) {
    const ameaca = detectarAmeacaEntrada(valor)
    if (ameaca)
      return ameaca
  }
  return null
}

export const MENSAGEM_AMEACA_ENTRADA: Record<TipoAmeacaEntrada, string> = {
  xss: 'Esse texto contém um trecho de código (HTML/JavaScript) que não é permitido aqui. Reescreva usando apenas texto normal.',
  sql: 'Esse texto contém um padrão de comando de banco de dados que não é permitido aqui. Reescreva usando apenas texto normal.',
}

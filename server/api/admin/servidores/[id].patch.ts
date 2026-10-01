import { editarServidorSchema } from '#shared/utils/validacao'
import { detectarAmeacaEntrada, MENSAGEM_AMEACA_ENTRADA } from '#shared/utils/segurancaEntrada'

// Editar nome/e-mail e/ou ativar-desativar (`banned`) uma conta de servidor
// — as duas ações de gestão que sobram além de criar (index.post.ts), então
// ficam no mesmo endpoint em vez de criar mais um arquivo só pra isso.
export default defineEventHandler(async (event) => {
  await exigirAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Informe o id do servidor' })
  }

  const resultado = editarServidorSchema.safeParse(await readBody(event))
  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: resultado.error.flatten(),
    })
  }

  const { nome, email, banned } = resultado.data

  if (nome) {
    const ameaca = detectarAmeacaEntrada(nome)
    if (ameaca) {
      throw createError({ statusCode: 400, message: MENSAGEM_AMEACA_ENTRADA[ameaca] })
    }
  }

  // Só mexe em conta que realmente é servidor — nunca cidadão, nunca admin
  // (impede na prática um admin desativar a própria conta ou a de outro
  // admin por essa via, mesmo chamando a API direto).
  const { rows: alvo } = await pool.query('select papel from "user" where id = $1', [id])
  if (!alvo.length || alvo[0].papel !== 'servidor') {
    throw createError({ statusCode: 404, message: 'Servidor não encontrado' })
  }

  if (email) {
    const { rows: existente } = await pool.query('select 1 from "user" where email = $1 and id <> $2', [email, id])
    if (existente.length > 0) {
      throw createError({ statusCode: 400, message: 'Este e-mail já está em uso por outra conta.' })
    }
  }

  const campos: string[] = []
  const valores: unknown[] = []
  let indice = 1

  if (nome !== undefined) {
    campos.push(`name = $${indice++}`)
    valores.push(nome)
  }
  if (email !== undefined) {
    campos.push(`email = $${indice++}`)
    valores.push(email)
  }
  if (banned !== undefined) {
    campos.push(`banned = $${indice++}`)
    valores.push(banned)
  }

  if (campos.length > 0) {
    valores.push(id)
    await pool.query(`update "user" set ${campos.join(', ')} where id = $${indice}`, valores)
  }

  const { rows } = await pool.query(
    'select id, name, email, telefone, secretaria, "primeiroAcesso", banned from "user" where id = $1',
    [id],
  )

  return {
    id: rows[0].id,
    nome: rows[0].name,
    email: rows[0].email,
    telefone: rows[0].telefone,
    secretaria: rows[0].secretaria,
    primeiroAcesso: rows[0].primeiroAcesso,
    banned: rows[0].banned,
  }
})

import { z } from 'zod'
import { CATEGORIAS } from './categorias'

const valoresCategorias = CATEGORIAS.map(categoria => categoria.value) as [string, ...string[]]

const TAMANHO_MAXIMO_FOTO_BASE64 = 2_000_000

const fotoSchema = z
  .string()
  .max(TAMANHO_MAXIMO_FOTO_BASE64, 'Foto muito grande')
  .refine(foto => /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(foto), 'Formato de foto inválido')

export const solicitacaoSchema = z.object({
  categoria: z.enum(valoresCategorias, { message: 'Selecione uma categoria' }),
  rua: z.string().min(3, 'Informe o nome da rua'),
  numero: z.string().min(1, 'Informe o número'),
  bairro: z.string().min(1, 'Informe o bairro'),
  complemento: z.string().optional(),
  pontoReferencia: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  descricao: z
    .string()
    .min(1, 'Descreva o problema com mais detalhes')
    .max(1000, 'Descrição muito longa (máximo 1000 caracteres)'),
  fotos: z.array(fotoSchema).max(3, 'Envie no máximo 3 fotos').optional(),
  risco: z.enum(['sim', 'nao', 'nao_sei']).optional(),
  nome: z.string().min(3, 'Informe seu nome completo').optional(),
  email: z.string().email('Informe um e-mail válido').optional(),
  telefone: z.string().min(10, 'Informe um telefone válido, com DDD').optional(),
  cpf: z.string().optional(),
})

export type SolicitacaoFormData = z.infer<typeof solicitacaoSchema>

const valoresStatus = ['aberto', 'em_analise', 'encaminhado', 'em_execucao', 'concluido'] as const

export const atualizarStatusSchema = z.object({
  status: z.enum(valoresStatus, { message: 'Selecione um status válido' }),
  mensagem: z.string().min(3, 'Descreva a atualização').max(500, 'Mensagem muito longa'),
  responsavel: z.string().max(120).optional(),
})

export type AtualizarStatusFormData = z.infer<typeof atualizarStatusSchema>

export const avaliacaoSchema = z.object({
  nota: z.number().min(1, 'Dê uma nota de 1 a 5').max(5),
  comentario: z.string().max(500, 'Comentário muito longo').optional(),
})

export type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>

export function validarSenha(senha: string): boolean {
  return senha.length >= 6 && /[a-zA-ZÀ-ü]/.test(senha) && /\d/.test(senha)
}

export function validarTelefone(telefone: string): boolean {
  const digitos = telefone.replace(/\D/g, '')
  return digitos.length === 10 || digitos.length === 11
}

export const criarServidorSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().refine(validarSenha, 'A senha precisa ter pelo menos 6 caracteres, com letra e número'),
  telefone: z.string().refine(telefone => !telefone.trim() || validarTelefone(telefone), 'Informe um telefone válido, com DDD').optional(),
  secretaria: z.string().optional(),
})

export type CriarServidorFormData = z.infer<typeof criarServidorSchema>

export const editarServidorSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo').optional(),
  email: z.string().email('Informe um e-mail válido').optional(),
  banned: z.boolean().optional(),
})

export type EditarServidorFormData = z.infer<typeof editarServidorSchema>

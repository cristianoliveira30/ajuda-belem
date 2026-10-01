import { z } from 'zod'
import { CATEGORIAS } from './categorias'

const valoresCategorias = CATEGORIAS.map(categoria => categoria.value) as [string, ...string[]]

// ~1.4MB decodificado — folga generosa sobre o que a compressão do
// navegador já produz (foto 1280px/JPEG q0.75 fica tipicamente entre 150KB
// e 550KB em base64). O navegador já comprime; isso aqui só barra payload
// absurdo ou que não seja uma foto de verdade, sem precisar de biblioteca de
// imagem no backend.
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
    .min(20, 'Descreva o problema com mais detalhes (mínimo 20 caracteres)')
    .max(1000, 'Descrição muito longa (máximo 1000 caracteres)'),
  fotos: z.array(fotoSchema).max(3, 'Envie no máximo 3 fotos').optional(),
  risco: z.enum(['sim', 'nao', 'nao_sei']).optional(),
  // Opcionais de propósito: o chat não pergunta mais isso (a identidade já
  // vem autenticada, ver server/api/solicitacoes/index.post.ts) — nome/email
  // são sempre sobrescritos pela sessão de qualquer forma; telefone/cpf, se
  // não vierem no body, o backend tenta preencher a partir da própria conta.
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

// Regra de senha do projeto inteiro: mínimo 6 caracteres, pelo menos 1 letra
// e 1 número — sem exigir maiúscula nem símbolo. Usada no cadastro
// tradicional, na criação de servidor pelo admin e na troca de senha do
// primeiro acesso. server/utils/auth.ts reaplica isso no hook do Better
// Auth (garantia de verdade); aqui é só pra não duplicar o regex em cada tela.
export function validarSenha(senha: string): boolean {
  return senha.length >= 6 && /[a-zA-ZÀ-ü]/.test(senha) && /\d/.test(senha)
}

// Criação de conta de servidor pelo admin (ver
// server/api/admin/servidores/index.post.ts). Secretaria não é obrigatória
// na criação (decisão explícita) — o campo continua existindo, só não é
// requisito aqui.
export const criarServidorSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().refine(validarSenha, 'A senha precisa ter pelo menos 6 caracteres, com letra e número'),
  telefone: z.string().optional(),
  secretaria: z.string().optional(),
})

export type CriarServidorFormData = z.infer<typeof criarServidorSchema>

// Edição de nome/e-mail de um servidor já existente (ver
// server/api/admin/servidores/[id].patch.ts). `banned` não entra aqui —
// tem sua própria ação (ativar/desativar) no mesmo endpoint.
export const editarServidorSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo').optional(),
  email: z.string().email('Informe um e-mail válido').optional(),
  banned: z.boolean().optional(),
})

export type EditarServidorFormData = z.infer<typeof editarServidorSchema>

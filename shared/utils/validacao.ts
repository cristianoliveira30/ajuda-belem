import { z } from 'zod'
import { CATEGORIAS } from './categorias'

const valoresCategorias = CATEGORIAS.map(categoria => categoria.value) as [string, ...string[]]

export const solicitacaoSchema = z.object({
  categoria: z.enum(valoresCategorias, { message: 'Selecione uma categoria' }),
  rua: z.string().min(3, 'Informe o nome da rua'),
  numero: z.string().min(1, 'Informe o número'),
  bairro: z.string().min(1, 'Informe o bairro'),
  complemento: z.string().optional(),
  pontoReferencia: z.string().optional(),
  descricao: z
    .string()
    .min(20, 'Descreva o problema com mais detalhes (mínimo 20 caracteres)')
    .max(1000, 'Descrição muito longa (máximo 1000 caracteres)'),
  fotos: z.array(z.string()).max(3, 'Envie no máximo 3 fotos').optional(),
  risco: z.enum(['sim', 'nao', 'nao_sei']).optional(),
  nome: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('Informe um e-mail válido'),
  telefone: z.string().min(10, 'Informe um telefone válido, com DDD'),
  cpf: z.string().optional(),
})

export type SolicitacaoFormData = z.infer<typeof solicitacaoSchema>

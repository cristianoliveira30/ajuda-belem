import { z } from 'zod'

export const cadastroSchema = z.object({
  nome: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('Informe um e-mail válido'),
  telefone: z.string().min(10, 'Informe um telefone válido, com DDD'),
  cpf: z.string().optional(),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export type CadastroFormData = z.infer<typeof cadastroSchema>

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe sua senha'),
})

export type LoginFormData = z.infer<typeof loginSchema>

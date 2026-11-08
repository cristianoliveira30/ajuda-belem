import { describe, expect, it } from 'vitest'
import { validarCpf } from '../shared/utils/cpf'

describe('validarCpf', () => {
  it('aceita CPF válido, com ou sem máscara', () => {
    expect(validarCpf('529.982.247-25')).toBe(true)
    expect(validarCpf('52998224725')).toBe(true)
  })

  it('rejeita dígito errado, tamanho errado e sequência repetida', () => {
    expect(validarCpf('52998224726')).toBe(false)
    expect(validarCpf('5299822472')).toBe(false)
    expect(validarCpf('11111111111')).toBe(false)
  })
})

import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
  })

  it('renders the home page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Ajuda Belém')
  })

  it('creates and retrieves a solicitação by protocolo', async () => {
    const { protocolo } = await $fetch<{ protocolo: string }>('/api/solicitacoes', {
      method: 'POST',
      body: {
        categoria: 'iluminacao',
        rua: 'Av. Gentil Bittencourt',
        numero: '1234',
        bairro: 'Nazaré',
        descricao: 'Poste de luz apagado há uma semana, deixando a rua escura à noite.',
        nome: 'Teste Automatizado',
        email: 'teste@example.com',
        telefone: '(91) 90000-0000',
      },
    })

    expect(protocolo).toMatch(/^\d{10}$/)

    const solicitacao = await $fetch(`/api/solicitacoes/${protocolo}`)
    expect(solicitacao).toMatchObject({ protocolo, status: 'aberto', bairro: 'Nazaré' })
  })

  it('never exposes citizen contact data on the public tracking endpoint', async () => {
    const { protocolo } = await $fetch<{ protocolo: string }>('/api/solicitacoes', {
      method: 'POST',
      body: {
        categoria: 'iluminacao',
        rua: 'Av. Gentil Bittencourt',
        numero: '1234',
        bairro: 'Nazaré',
        descricao: 'Poste de luz apagado há uma semana, deixando a rua escura à noite.',
        nome: 'Dado Sigiloso',
        email: 'sigiloso@example.com',
        telefone: '(91) 90000-0000',
        cpf: '12345678900',
      },
    })

    const solicitacao = await $fetch(`/api/solicitacoes/${protocolo}`)
    expect(solicitacao).not.toHaveProperty('nome')
    expect(solicitacao).not.toHaveProperty('email')
    expect(solicitacao).not.toHaveProperty('telefone')
    expect(solicitacao).not.toHaveProperty('cpf')
  })

  it('rejects a solicitação payload containing an XSS-like script tag', async () => {
    await expect(
      $fetch('/api/solicitacoes', {
        method: 'POST',
        body: {
          categoria: 'iluminacao',
          rua: 'Av. Gentil Bittencourt',
          numero: '1234',
          bairro: 'Nazaré',
          descricao: '<script>alert(1)</script> poste apagado há dias na minha rua',
          nome: 'Teste Automatizado',
          email: 'teste@example.com',
          telefone: '(91) 90000-0000',
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a solicitação payload containing a SQL injection-like pattern', async () => {
    await expect(
      $fetch('/api/solicitacoes', {
        method: 'POST',
        body: {
          categoria: 'iluminacao',
          rua: 'Av. Gentil Bittencourt',
          numero: '1234',
          bairro: "x' OR '1'='1",
          descricao: 'Poste apagado há dias, testando validação do bairro.',
          nome: 'Teste Automatizado',
          email: 'teste@example.com',
          telefone: '(91) 90000-0000',
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

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
})

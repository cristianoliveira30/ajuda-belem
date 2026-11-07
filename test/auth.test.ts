import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

describe('auth', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
  })

  function cookiePair(setCookieHeader: string | null) {
    expect(setCookieHeader).toBeTruthy()
    return setCookieHeader!.split(';')[0]
  }

  it('recusa acesso a rota protegida sem sessão', async () => {
    await expect($fetch('/api/solicitacoes/minhas')).rejects.toThrow()
  })

  it('cadastra um cidadão, autentica a sessão e lista suas solicitações (vazio)', async () => {
    const email = `cidadao-${Date.now()}@example.com`

    const resposta = await fetch('/api/auth/cadastro', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nome: 'Cidadã de Teste', email, telefone: '(91) 90000-0001', senha: 'senha12345' }),
    })
    const cookie = cookiePair(resposta.headers.get('set-cookie'))

    const minhas = await $fetch('/api/solicitacoes/minhas', { headers: { cookie } })
    expect(minhas).toEqual([])
  })

  it('recusa login com senha incorreta', async () => {
    const email = `cidadao-${Date.now()}-login@example.com`
    await $fetch('/api/auth/cadastro', {
      method: 'POST',
      body: { nome: 'Cidadão Login', email, telefone: '(91) 90000-0003', senha: 'senha12345' },
    })

    await expect($fetch('/api/auth/login', {
      method: 'POST',
      body: { email, senha: 'senha-errada' },
    })).rejects.toThrow()
  })

  it('vincula uma solicitação criada por um cidadão logado à sua conta', async () => {
    const email = `cidadao-${Date.now()}-vinculo@example.com`

    const resposta = await fetch('/api/auth/cadastro', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nome: 'Outra Cidadã', email, telefone: '(91) 90000-0002', senha: 'senha12345' }),
    })
    const cookie = cookiePair(resposta.headers.get('set-cookie'))

    await $fetch('/api/solicitacoes', {
      method: 'POST',
      headers: { cookie },
      body: {
        categoria: 'pavimentacao',
        rua: 'Rua dos Testes',
        numero: '10',
        bairro: 'Marco',
        descricao: 'Buraco grande na via, atrapalhando o tráfego de veículos.',
        nome: 'Outra Cidadã',
        email,
        telefone: '(91) 90000-0002',
      },
    })

    const minhas = await $fetch<{ protocolo: string }[]>('/api/solicitacoes/minhas', { headers: { cookie } })
    expect(minhas).toHaveLength(1)
  })
})

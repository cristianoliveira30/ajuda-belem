import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { $fetch, fetch as fetchCru, setup } from '@nuxt/test-utils/e2e'

// Gerador local (não importa shared/utils/cpf pra manter o teste
// independente do cálculo que ele mesmo indiretamente valida via API).
function gerarCpfValido(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const digitoVerificador = (digitos: number[]) => {
    let soma = 0
    let peso = digitos.length + 1
    for (const digito of digitos) {
      soma += digito * peso
      peso -= 1
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = digitoVerificador(base)
  const d2 = digitoVerificador([...base, d1])
  return [...base, d1, d2].join('')
}

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
  })

  // POST /api/solicitacoes agora exige sessão (ver
  // server/api/solicitacoes/index.post.ts) — os testes que criam
  // solicitação precisam de um cidadão autenticado primeiro.
  let cookieCidadao = ''

  // Os testes gravam na mesma storage (.data/solicitacoes) que o dashboard
  // público lê (ver server/api/dashboard.get.ts) — sem essa limpeza, cada
  // execução de `yarn test` deixava ocorrências fictícias contaminando os
  // números reais mostrados na home e no painel.
  const protocolosCriados: string[] = []

  afterAll(async () => {
    await Promise.all(
      protocolosCriados.map(protocolo =>
        rm(new URL(`../.data/solicitacoes/${protocolo}.json`, import.meta.url), { force: true }),
      ),
    )
  })

  beforeAll(async () => {
    // `fetch` cru (não `$fetch`, que só devolve os dados já parseados) —
    // precisamos do Response pra ler o cookie de sessão do Set-Cookie.
    const resposta = await fetchCru('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Teste Automatizado',
        email: `teste.solicitacoes.${Date.now()}@example.com`,
        password: 'SenhaTeste123!',
        cpf: gerarCpfValido(),
      }),
    })
    cookieCidadao = resposta.headers.getSetCookie().join('; ')
  })

  it('renders the home page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Ajuda Belém')
  })

  it('rejects creating a solicitação without an authenticated session', async () => {
    await expect(
      $fetch('/api/solicitacoes', {
        method: 'POST',
        body: {
          categoria: 'iluminacao',
          rua: 'Av. Gentil Bittencourt',
          numero: '1234',
          bairro: 'Nazaré',
          descricao: 'Poste de luz apagado há uma semana, deixando a rua escura à noite.',
          nome: 'Sem Sessão',
          email: 'semsessao@example.com',
          telefone: '(91) 90000-0000',
        },
      }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('creates and retrieves a solicitação by protocolo', async () => {
    const { protocolo } = await $fetch<{ protocolo: string }>('/api/solicitacoes', {
      method: 'POST',
      headers: { cookie: cookieCidadao },
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

    protocolosCriados.push(protocolo)
    expect(protocolo).toMatch(/^\d{10}$/)

    const solicitacao = await $fetch(`/api/solicitacoes/${protocolo}`)
    expect(solicitacao).toMatchObject({ protocolo, status: 'aberto', bairro: 'Nazaré' })
  })

  it('never exposes citizen contact data on the public tracking endpoint', async () => {
    const { protocolo } = await $fetch<{ protocolo: string }>('/api/solicitacoes', {
      method: 'POST',
      headers: { cookie: cookieCidadao },
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

    protocolosCriados.push(protocolo)
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
        headers: { cookie: cookieCidadao },
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
        headers: { cookie: cookieCidadao },
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

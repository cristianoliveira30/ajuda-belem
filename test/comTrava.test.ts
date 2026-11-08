import { describe, expect, it } from 'vitest'
import { comTrava } from '../server/utils/comTrava'

describe('comTrava', () => {
  it('não perde atualização quando duas rodam ao mesmo tempo na mesma chave', async () => {
    let valor = 0
    const somar = () => comTrava('x', async () => {
      const lido = valor
      await new Promise(r => setTimeout(r, 10))
      valor = lido + 1
    })
    await Promise.all([somar(), somar(), somar()])
    expect(valor).toBe(3)
  })

  it('uma falha não trava a fila', async () => {
    await expect(comTrava('y', async () => { throw new Error('x') })).rejects.toThrow()
    await expect(comTrava('y', async () => 1)).resolves.toBe(1)
  })
})

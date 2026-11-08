// Serializa leitura-alteração-gravação por chave (protocolo) para que duas
// requisições simultâneas não sobrescrevam uma à outra.
// shortcut: trava em memória, vale só com 1 instância (o storage em arquivo já
// obriga isso); com 2+ instâncias ou Postgres, trocar por update atômico no banco.
const filas = new Map<string, Promise<unknown>>()

export function comTrava<T>(chave: string, fn: () => Promise<T>): Promise<T> {
  const atual = (filas.get(chave) ?? Promise.resolve()).then(fn)
  const fila = atual.catch(() => {})
  filas.set(chave, fila)
  fila.then(() => filas.get(chave) === fila && filas.delete(chave))
  return atual
}

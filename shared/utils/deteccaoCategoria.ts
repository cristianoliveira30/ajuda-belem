const PALAVRAS_CHAVE: Record<string, string[]> = {
  pavimentacao: ['buraco', 'asfalto', 'cratera', 'pavimento', 'afundou', 'afundamento'],
  iluminacao: ['luz', 'poste', 'lâmpada', 'lampada', 'escuro', 'iluminação', 'iluminacao'],
  saneamento: ['esgoto', 'vazamento', 'bueiro', 'saneamento', 'fossa'],
  alagamento: ['alagamento', 'alagou', 'alagada', 'enchente', 'água acumulada', 'agua acumulada'],
  arborizacao: ['árvore', 'arvore', 'galho', 'poda', 'queda de árvore'],
  limpeza: ['lixo', 'entulho', 'sujeira', 'terreno baldio'],
  sinalizacao: ['sinalização', 'sinalizacao', 'placa', 'semáforo', 'semaforo', 'faixa de pedestre'],
}

export function detectarCategoria(texto: string): string | undefined {
  const normalizado = texto.toLowerCase()
  for (const [categoria, palavras] of Object.entries(PALAVRAS_CHAVE)) {
    if (palavras.some(palavra => normalizado.includes(palavra)))
      return categoria
  }
  return undefined
}

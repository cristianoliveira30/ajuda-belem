export type CategoriaAviso = 'alerta' | 'zeladoria' | 'obras' | 'infraestrutura'

export interface Aviso {
  id: string
  categoria: CategoriaAviso
  titulo: string
  descricao: string
  data: string
  icon: string
}

export const CATEGORIAS_AVISO: Record<CategoriaAviso, { label: string, color: string }> = {
  alerta: { label: 'Alerta', color: 'error' },
  zeladoria: { label: 'Zeladoria', color: 'success' },
  obras: { label: 'Obras', color: 'primary' },
  infraestrutura: { label: 'Infraestrutura', color: 'neutral' },
}

function diasAtras(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return data.toISOString()
}

export const AVISOS: Aviso[] = [
  {
    id: 'chuvas-alagamento',
    categoria: 'alerta',
    titulo: 'Período chuvoso em Belém',
    descricao: 'Relate pontos de alagamento na sua região para agilizar a limpeza de bueiros e canais.',
    data: diasAtras(0),
    icon: 'i-lucide-cloud-rain',
  },
  {
    id: 'mutirao-limpeza',
    categoria: 'zeladoria',
    titulo: 'Mutirão de limpeza urbana',
    descricao: 'Equipes de zeladoria seguem atuando nos bairros com mais solicitações de limpeza e entulho.',
    data: diasAtras(1),
    icon: 'i-lucide-trash-2',
  },
  {
    id: 'obras-drenagem',
    categoria: 'obras',
    titulo: 'Obras de drenagem em andamento',
    descricao: 'Trechos com histórico de alagamento recebem obras de drenagem ao longo do ano.',
    data: diasAtras(3),
    icon: 'i-lucide-hard-hat',
  },
  {
    id: 'iluminacao-led',
    categoria: 'infraestrutura',
    titulo: 'Troca de lâmpadas por LED',
    descricao: 'Substituição gradual da iluminação pública por lâmpadas de LED em vias com mais registros de postes apagados.',
    data: diasAtras(5),
    icon: 'i-lucide-lightbulb',
  },
  {
    id: 'canal-oficial',
    categoria: 'infraestrutura',
    titulo: 'Canal oficial de atendimento',
    descricao: 'O Ajuda Belém é o canal direto entre você e as equipes de infraestrutura da Prefeitura.',
    data: diasAtras(7),
    icon: 'i-lucide-megaphone',
  },
]

export type TomCategoria = 'primary' | 'secondary' | 'neutral'

export interface Categoria {
  value: string
  label: string
  icon: string
  description: string
  tom: TomCategoria
}

export const CATEGORIAS: Categoria[] = [
  {
    value: 'iluminacao',
    label: 'Iluminação pública',
    icon: 'i-lucide-lightbulb',
    description: 'Lâmpadas apagadas, piscando ou postes danificados.',
    tom: 'primary',
  },
  {
    value: 'pavimentacao',
    label: 'Buracos e pavimentação',
    icon: 'i-lucide-construction',
    description: 'Buracos, afundamentos e problemas no asfalto.',
    tom: 'secondary',
  },
  {
    value: 'saneamento',
    label: 'Saneamento e drenagem',
    icon: 'i-lucide-droplets',
    description: 'Vazamentos, esgoto a céu aberto e bueiros entupidos.',
    tom: 'neutral',
  },
  {
    value: 'arborizacao',
    label: 'Poda e árvores',
    icon: 'i-lucide-trees',
    description: 'Árvores com risco de queda ou galhos sobre a rede elétrica.',
    tom: 'primary',
  },
  {
    value: 'limpeza',
    label: 'Limpeza urbana',
    icon: 'i-lucide-trash-2',
    description: 'Acúmulo de lixo, entulho e terrenos baldios.',
    tom: 'secondary',
  },
  {
    value: 'sinalizacao',
    label: 'Sinalização de trânsito',
    icon: 'i-lucide-traffic-cone',
    description: 'Placas danificadas, semáforos e faixas apagadas.',
    tom: 'neutral',
  },
  {
    value: 'alagamento',
    label: 'Alagamento',
    icon: 'i-lucide-cloud-rain',
    description: 'Ruas alagadas ou água acumulada após chuvas.',
    tom: 'primary',
  },
]

export const TOM_CATEGORIA_CLASSES: Record<TomCategoria, string> = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
}

export function getCategoria(value: string): Categoria | undefined {
  return CATEGORIAS.find(categoria => categoria.value === value)
}

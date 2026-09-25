export interface ContatoUtil {
  nome: string
  telefone: string
  descricao?: string
  icon: string
  exemplo?: boolean
}

export const CONTATOS_EMERGENCIA: ContatoUtil[] = [
  { nome: 'Polícia Militar', telefone: '190', icon: 'i-lucide-shield' },
  { nome: 'SAMU', telefone: '192', icon: 'i-lucide-siren' },
  { nome: 'Corpo de Bombeiros', telefone: '193', icon: 'i-lucide-flame' },
  { nome: 'Defesa Civil', telefone: '199', icon: 'i-lucide-triangle-alert' },
]

export const CONTATOS_PREFEITURA: ContatoUtil[] = [
  {
    nome: 'Ouvidoria Municipal',
    telefone: '(91) 0000-0000',
    descricao: 'Dado de exemplo — substituir pelo contato oficial da Prefeitura de Belém antes de publicar.',
    icon: 'i-lucide-megaphone',
    exemplo: true,
  },
  {
    nome: 'Guarda Municipal',
    telefone: '(91) 0000-0000',
    descricao: 'Dado de exemplo — substituir pelo contato oficial.',
    icon: 'i-lucide-shield-check',
    exemplo: true,
  },
  {
    nome: 'Atendimento presencial (SEINFRA)',
    telefone: '(91) 0000-0000',
    descricao: 'Dado de exemplo — inserir endereço e horário de funcionamento reais.',
    icon: 'i-lucide-building-2',
    exemplo: true,
  },
]

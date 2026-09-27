export function mascararCpf(cpf?: string | null): string {
  const digitos = (cpf ?? '').replace(/\D/g, '')
  if (digitos.length !== 11)
    return '—'

  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`
}

// Remove tudo que não for dígito. Único ponto que decide o formato de
// persistência do CPF (só números) — usado tanto no client (UX) quanto no
// server (fonte da verdade, ver server/utils/auth.ts).
export function normalizarCpf(cpf?: string | null): string {
  return (cpf ?? '').replace(/\D/g, '')
}

function calcularDigitoVerificador(base: string): number {
  let soma = 0
  let peso = base.length + 1
  for (const digito of base) {
    soma += Number(digito) * peso
    peso -= 1
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

// Valida os 11 dígitos e os dois dígitos verificadores (algoritmo oficial da
// Receita Federal). Recebe o CPF em qualquer formato (com ou sem máscara).
export function validarCpf(cpf?: string | null): boolean {
  const digitos = normalizarCpf(cpf)

  if (digitos.length !== 11)
    return false

  // Sequências como 00000000000, 11111111111 etc. passam no cálculo do
  // dígito verificador, mas nunca são CPFs reais — precisam ser rejeitadas à parte.
  if (/^(\d)\1{10}$/.test(digitos))
    return false

  const digito1 = calcularDigitoVerificador(digitos.slice(0, 9))
  if (digito1 !== Number(digitos[9]))
    return false

  const digito2 = calcularDigitoVerificador(digitos.slice(0, 10))
  if (digito2 !== Number(digitos[10]))
    return false

  return true
}

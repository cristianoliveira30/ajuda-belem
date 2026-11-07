export function mascararCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11)
    return cpf

  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`
}

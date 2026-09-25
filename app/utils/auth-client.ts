import { createAuthClient } from 'better-auth/vue'
import { inferAdditionalFields } from 'better-auth/client/plugins'

// Campos extra do usuário (ver server/utils/auth.ts) repetidos aqui em vez de
// inferidos do arquivo do servidor para não puxar dependências Node-only
// (ex.: `pg`) para o bundle do cliente.
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        papel: { type: 'string' },
        cpf: { type: 'string', required: false },
        telefone: { type: 'string', required: false },
        secretaria: { type: 'string', required: false },
      },
    }),
  ],
})

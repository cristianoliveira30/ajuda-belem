// Raio de busca por ocorrência semelhante (detecção de duplicidade, ver
// server/api/solicitacoes/candidata.post.ts) — centralizado aqui num único
// lugar pra poder ser ajustado depois sem procurar "30" espalhado pelo código.
export const RAIO_DUPLICIDADE_METROS = 30

const RAIO_TERRA_METROS = 6371000

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180
}

// Fórmula de Haversine — distância em linha reta, em metros, entre duas
// coordenadas geográficas.
export function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = paraRadianos(lat2 - lat1)
  const dLon = paraRadianos(lon2 - lon1)

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(paraRadianos(lat1)) * Math.cos(paraRadianos(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return RAIO_TERRA_METROS * c
}

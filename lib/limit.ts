// lib/limit.ts
// Versão NO-OP: não usa @upstash/* para não quebrar build.
// Depois, se quiser rate limit real, a gente ativa.
export async function limitOrThrow(_key: string) {
  return;
}

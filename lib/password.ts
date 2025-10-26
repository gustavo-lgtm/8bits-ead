// lib/password.ts

// ✅ Regra única da plataforma — ajuste aqui e tudo herda.
// Mantive simples (bom para o público-alvo): mínimo 6 caracteres.
export const PASSWORD_RULES = {
  minLength: 6,
  // Se no futuro quiser exigir algo a mais, habilite aqui:
  // requireNumber: false,
  // requireLetter: false,
  // requireUpper: false,
  // requireSymbol: false,
} as const;

export type PasswordValidation = {
  ok: boolean;
  errors: string[];
};

export function validatePassword(password: string, confirm?: string): PasswordValidation {
  const errors: string[] = [];
  const { minLength } = PASSWORD_RULES;

  if (!password || password.length < minLength) {
    errors.push(`A senha deve ter pelo menos ${minLength} caracteres.`);
  }

  // Se quiser regras adicionais, descomente/adicione:
  // if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) errors.push("A senha deve ter ao menos um número.");
  // if (PASSWORD_RULES.requireLetter && !/[a-zA-Z]/.test(password)) errors.push("A senha deve ter ao menos uma letra.");
  // if (PASSWORD_RULES.requireUpper && !/[A-Z]/.test(password)) errors.push("A senha deve ter ao menos uma letra maiúscula.");
  // if (PASSWORD_RULES.requireSymbol && !/[^\w\s]/.test(password)) errors.push("A senha deve ter ao menos um símbolo.");

  if (typeof confirm === "string" && password !== confirm) {
    errors.push("As senhas não coincidem.");
  }

  return { ok: errors.length === 0, errors };
}

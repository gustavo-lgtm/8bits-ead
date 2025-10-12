// src/lib/gamification.ts
// Serviço mínimo para conceder XP ao CONCLUIR uma Unit (modo FIXED).
// Integra com as tabelas: CourseGamificationConfig, UserXPEvent, UserXPBalance.
// QUIZ_PARTIAL fica para um passo futuro.

import { prisma } from "@/lib/db";
import type { XPType } from "@prisma/client";

// ---------- Helpers de configuração/saldo ----------

async function getCourseConfig(courseId: string) {
  const cfg = await prisma.courseGamificationConfig.findUnique({
    where: { courseId },
  });
  return {
    countExtraInPrimary: cfg?.countExtraInPrimary ?? true,
    xpWelcome: cfg?.xpWelcome ?? 0,
  };
}

async function ensureBalance(userId: string, courseId: string) {
  return prisma.userXPBalance.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

async function recomputeBalance(userId: string, courseId: string) {
  const [bal, cfg] = await Promise.all([
    prisma.userXPBalance.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),
    getCourseConfig(courseId),
  ]);
  if (!bal) return;

  const xpPrimary =
    bal.xpMandatory +
    (cfg.countExtraInPrimary ? bal.xpExtra : 0) +
    bal.xpBonus +
    bal.xpWelcome;

  const xpTotal = xpPrimary + bal.xpOptional;

  await prisma.userXPBalance.update({
    where: { userId_courseId: { userId, courseId } },
    data: { xpPrimary, xpTotal },
  });
}

// ---------- Criação de evento idempotente ----------

async function createEventOnce(data: {
  userId: string;
  courseId: string;
  moduleId?: string | null;
  unitId?: string | null;
  eventType: "unit_completed" | "module_bonus" | "course_welcome";
  xp: number;
  xpType: XPType;
  meta?: any;
}) {
  const { userId, courseId, moduleId, unitId, eventType, xp, xpType, meta } = data;

  // Checagem de idempotência pelo alvo do evento
  if (unitId) {
    const exists = await prisma.userXPEvent.findUnique({
      where: { userId_unitId_eventType: { userId, unitId, eventType } },
    });
    if (exists) return null;
  } else if (moduleId) {
    const exists = await prisma.userXPEvent.findUnique({
      where: { userId_moduleId_eventType: { userId, moduleId, eventType } },
    });
    if (exists) return null;
  } else {
    const exists = await prisma.userXPEvent.findUnique({
      where: { userId_courseId_eventType: { userId, courseId, eventType } },
    });
    if (exists) return null;
  }

  return prisma.userXPEvent.create({
    data: { userId, courseId, moduleId, unitId, eventType, xp, xpType, meta },
  });
}

// ---------- Aplicação incremental no saldo ----------

async function applyToBalance(userId: string, courseId: string, xp: number, xpType: XPType) {
  await ensureBalance(userId, courseId);

  // Campos correspondentes no saldo
  const fieldMap: Record<XPType, keyof Omit<Awaited<ReturnType<typeof ensureBalance>>, "id" | "userId" | "courseId" | "updatedAt">> = {
    MANDATORY: "xpMandatory",
    EXTRA: "xpExtra",
    OPTIONAL: "xpOptional",
    BONUS: "xpBonus",
    WELCOME: "xpWelcome",
  };

  const field = fieldMap[xpType];

  await prisma.userXPBalance.update({
    where: { userId_courseId: { userId, courseId } },
    data: { [field]: { increment: xp } } as any,
  });

  await recomputeBalance(userId, courseId);
}

// ---------- Bônus de módulo (quando todas obrigatórias estão completas) ----------

async function maybeAwardModuleBonus(userId: string, moduleId: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true, units: true },
  });
  if (!mod) return;

  // Não há bônus para módulo opcional
  if (mod.isOptional) return;

  // Unidades obrigatórias = nem optional nem extra
  const requiredUnits = mod.units.filter((u) => !u.isOptional && !u.isExtra);
  if (requiredUnits.length === 0) return;

  const unitIds = requiredUnits.map((u) => u.id);

  // Eventos de unit_completed MANDATORY do usuário neste módulo
  const events = await prisma.userXPEvent.findMany({
    where: {
      userId,
      moduleId,
      unitId: { in: unitIds },
      eventType: "unit_completed",
      xpType: "MANDATORY",
    },
    select: { unitId: true, xp: true },
  });

  // Verifica se completou todas as obrigatórias
  const doneSet = new Set(events.map((e) => e.unitId));
  const allDone = unitIds.every((id) => doneSet.has(id));
  if (!allDone) return;

  // Soma XP das obrigatórias e aplica percentual de bônus
  const sumXP = events.reduce((acc, e) => acc + e.xp, 0);
  const percent = mod.bonusPercent ?? 10;
  const bonus = Math.round((sumXP * percent) / 100);
  if (bonus <= 0) return;

  // Emite evento (idempotente) e aplica no saldo
  const created = await createEventOnce({
    userId,
    courseId: mod.courseId,
    moduleId,
    eventType: "module_bonus",
    xp: bonus,
    xpType: "BONUS",
  });
  if (!created) return;

  await applyToBalance(userId, mod.courseId, bonus, "BONUS");
}

// ---------- API pública mínima ----------

/**
 * Concede XP ao concluir uma Unit (modo FIXED).
 * - Determina o tipo de XP pela Unit: OPTIONAL / EXTRA / MANDATORY.
 * - Cria evento idempotente (unit_completed).
 * - Atualiza o saldo e verifica bônus de módulo.
 */
export async function awardUnitCompletionXP(userId: string, unitId: string) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { module: true },
  });
  if (!unit) return;

  const courseId = unit.module.courseId;
  const moduleId = unit.moduleId;

  // Só tratamos FIXED neste passo
  const xp = unit.xpMode === "FIXED" ? unit.xpValue ?? 0 : 0;

  const xpType: XPType = unit.isOptional
    ? "OPTIONAL"
    : unit.isExtra
    ? "EXTRA"
    : "MANDATORY";

  // Evento idempotente por user+unit
  const ev = await createEventOnce({
    userId,
    courseId,
    moduleId,
    unitId,
    eventType: "unit_completed",
    xp,
    xpType,
  });
  if (!ev) return; // já concedido anteriormente

  // Aplica no saldo
  await applyToBalance(userId, courseId, xp, xpType);

  // Verifica bônus do módulo (considera apenas MANDATORY)
  await maybeAwardModuleBonus(userId, moduleId);
}

/* scripts/create-unlock-codes.js */

//Execução: node scripts/create-unlock-codes.js

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * CONFIGURAÇÃO
 */
const COURSE_ID = "cmiwhtn890000er8wvx2jmm9x";
const HOW_MANY = 1; // quantidade de códigos a gerar

/**
 * Gera código no formato: SE7N4KDQ
 * - 8 caracteres
 * - evita 0, 1, I, O (menos confusão visual)
 */
function generateCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, alphabet.length);
    code += alphabet[idx];
  }

  return code;
}

async function main() {
  const data = Array.from({ length: HOW_MANY }).map(() => ({
    courseId: COURSE_ID,
    code: generateCode(8),
    status: "ACTIVE", // enum UnlockStatus
    usedAt: null,
  }));

  const result = await prisma.courseUnlockCode.createMany({
    data,
    skipDuplicates: true, // evita erro se algum code repetir
  });

  console.log("Códigos solicitados:", HOW_MANY);
  console.log("Códigos criados:", result.count);
  console.log(
    "Exemplo:",
    data.slice(0, 10).map((c) => c.code).join(", ")
  );
}

main()
  .catch((e) => {
    console.error("Erro ao gerar códigos:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

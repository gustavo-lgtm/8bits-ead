// prisma/seed-gamification.js
// - Garante CourseGamificationConfig para todos os cursos existentes
// - Seta xpValue default nas Units (quando FIXED e ainda sem valor)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1) Config por curso (countExtraInPrimary = true; xpWelcome = 0 por padrão)
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  for (const c of courses) {
    await prisma.courseGamificationConfig.upsert({
      where: { courseId: c.id },
      update: {},
      create: {
        courseId: c.id,
        countExtraInPrimary: true,
        xpWelcome: 0,
      },
    });
  }

  // 2) Defaults de XP para Units FIXED que ainda não têm xpValue
  // Sugerido: VIDEO 100, DOC 80, LINK 50 (ajuste depois no Studio, se quiser)
  const units = await prisma.unit.findMany({
    select: { id: true, type: true, xpMode: true, xpValue: true },
  });

  for (const u of units) {
    if (u.xpMode === "FIXED" && (u.xpValue === null || u.xpValue === undefined)) {
      let defaultXP = 50;
      if (u.type === "VIDEO") defaultXP = 100;
      else if (u.type === "DOC") defaultXP = 80;
      else if (u.type === "LINK") defaultXP = 50;

      await prisma.unit.update({
        where: { id: u.id },
        data: { xpValue: defaultXP },
      });
    }
  }

  console.log(
    `✔ Seed concluído: ${courses.length} curso(s) configurado(s), defaults de XP aplicados para units FIXED sem valor.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

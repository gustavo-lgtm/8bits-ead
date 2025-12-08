// prisma/seed-course-b001.js
// Cria/atualiza o curso da Box 001 e alguns códigos de desbloqueio de exemplo

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const slug = "b001";

  // 1) Curso
  const course = await prisma.course.upsert({
    where: { slug },
    update: {}, // se já existir, por enquanto não alteramos nada
    create: {
      slug,
      title: "Box 001 Minecraft - Aventura do Bloco Bugado",
      description:
        "Nesta missão você aprende a criar mods para Minecraft com MCreator e Blockbench.",
      // ajuste os caminhos se quiser usar posters reais
      posterWideUrl: "/images/courses/box001-wide.png",
      posterNarrowUrl: "/images/courses/box001-narrow.png",
      // opcionais - mas ajudam se futuramente você filtrar por categoria/nível
      category: "GAME_DEV",
      level: "N1",
    },
  });

  console.log("✔ Curso garantido:", course.slug, "-", course.title);

  // 2) Configuração de gamificação do curso
  await prisma.courseGamificationConfig.upsert({
    where: { courseId: course.id },
    update: {},
    create: {
      courseId: course.id,
      countExtraInPrimary: true,
      xpWelcome: 0, // ou 50/100 se quiser dar XP ao desbloquear
    },
  });

  console.log("✔ Gamificação básica configurada para o curso");

  // 3) Códigos de desbloqueio da Box 001
  // - coloque aqui os códigos reais da tiragem ou alguns códigos de teste
  const codes = [
    "B001-TESTE-0001",
    "B001-TESTE-0002",
    "B001-TESTE-0003",
  ];

  for (const code of codes) {
    await prisma.courseUnlockCode.upsert({
      where: { code },
      update: {
        courseId: course.id,
        status: "ACTIVE",
      },
      create: {
        courseId: course.id,
        code,
        status: "ACTIVE",
      },
    });
  }

  console.log(`✔ ${codes.length} código(s) de desbloqueio garantidos para a Box 001`);
}

main()
  .catch((e) => {
    console.error("Erro no seed da Box 001:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

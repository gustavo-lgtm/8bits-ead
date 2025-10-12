// scripts/ensureWelcome.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Podemos buscar os cursos e, para cada curso, garantir o módulo/unit de welcome
  const courses = await prisma.course.findMany({ select: { id: true, title: true, slug: true } });

  for (const course of courses) {
    // Sempre carregue/retorne o módulo com units incluídas, tanto no find quanto no create
    let welcomeModule = await prisma.module.findFirst({
      where: { courseId: course.id, slug: "welcome" },
      include: { units: true },
    });

    if (!welcomeModule) {
      welcomeModule = await prisma.module.create({
        data: {
          courseId: course.id,
          slug: "welcome",
          title: "Bem-vindo ao curso",
          sortIndex: 0,
          // se você tiver esses campos no schema:
          // isOptional: false,
          // bonusPercent: 0,
        },
        include: { units: true }, // <<< importante para manter o mesmo shape tipado
      });
      console.log(`✅ Módulo 'Welcome' criado para o curso ${course.title}`);
    }

    // Agora garantimos a unidade 'unlock' (welcome)
    let unlockUnit = welcomeModule.units.find((u) => u.slug === "unlock");
    if (!unlockUnit) {
      unlockUnit = await prisma.unit.create({
        data: {
          moduleId: welcomeModule.id,
          slug: "unlock",
          title: "Missão de Desbloqueio",
          type: "DOC",
          isWelcome: true,
          sortIndex: 0,
          durationSec: 60,
          // se já tiver campos de XP por unidade, pode preencher aqui (exemplos):
          // xpValue: 20,
          // xpMax: 20,
          // isOptional: false,
        },
      });
      console.log(`🎯 Unidade 'unlock' criada em ${course.title}`);
    } else {
      console.log(`⚙️ Unidade 'unlock' já existente em ${course.title}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// prisma/seed-dev-user.js
// Cria (ou atualiza) um usuário de desenvolvimento para testes locais

const { PrismaClient } = require("@prisma/client");
const { hash } = require("@node-rs/argon2");

const prisma = new PrismaClient();

async function main() {
  const email = "dev@8bitsedu.com.br";
  const password = "teste123"; // senha de teste
  const passwordHash = await hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      // se já existir, garante que continua com acesso liberado
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      consentStatus: "APPROVED",
    },
    create: {
      email,
      name: "Usuário Dev",
      nickname: "Dev8bits",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      consentStatus: "APPROVED",
    },
  });

  console.log("✔ Usuário de desenvolvimento criado/atualizado:");
  console.log({
    id: user.id,
    email,
    password,
    role: user.role,
    consentStatus: user.consentStatus,
  });
}

main()
  .catch((e) => {
    console.error("Erro no seed-dev-user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

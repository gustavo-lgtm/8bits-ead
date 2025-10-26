// lib/mail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const FROM = process.env.EMAIL_FROM || "8bits <no-reply@8bitsedu.com.br>";

/** CONSENTIMENTO (responsável) — já aprovado */
export async function sendConsentEmail(params: {
  guardianEmail: string;
  studentNickname?: string | null;
  studentEmail: string;
  confirmUrl: string;
  expiresAt: Date;
}) {
  const { guardianEmail, studentNickname, studentEmail, confirmUrl, expiresAt } = params;

  const subject = `Autorize o cadastro de ${studentNickname || "seu(sua) filho(a)"} na 8bits`;

  const html = `
  <div style="background:#eef2f7;padding:24px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.06)">
      <tr>
        <td style="padding:28px 28px 0" align="center">
          <img src="${APP_URL}/logo.png" alt="8bits" height="36" style="display:block;opacity:.95"/>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 28px 0">
          <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25">Autorize o cadastro na 8bits</h1>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#334155">
            Olá! Recebemos um pedido de cadastro para
            <strong>${studentNickname || studentEmail}</strong> na plataforma educacional 8bits.
          </p>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#334155">
            Para prosseguir, confirme que você é o(a) responsável e autoriza o uso da plataforma.
          </p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding:16px 28px 8px">
          <a href="${confirmUrl}"
            style="background:#ffab40;border-radius:12px;color:#fff;text-decoration:none;
                   display:inline-block;font-weight:700;padding:12px 22px">
            Autorizar cadastro
          </a>
        </td>
      </tr>

      <tr>
        <td style="padding:4px 28px 22px;text-align:center;font-size:12px;color:#475569">
          Este link expira em <strong>${expiresAt.toLocaleString("pt-BR")}</strong>.
          Se você não solicitou este cadastro, pode ignorar este e-mail.
        </td>
      </tr>
    </table>

    <div style="max-width:680px;margin:10px auto 0;text-align:center;font-size:12px;color:#94a3b8">
      Dúvidas? Escreva para <a href="mailto:8bits@8bitsedu.com.br">8bits@8bitsedu.com.br</a>.
      <div style="margin-top:8px">© ${new Date().getFullYear()} 8bits</div>
    </div>
  </div>`;

  const text = `Autorize o cadastro na 8bits
Aluno: ${studentNickname || studentEmail}
Link: ${confirmUrl}
Expira em: ${expiresAt.toLocaleString("pt-BR")}
Se não solicitou, ignore este e-mail.`;

  return resend.emails.send({ from: FROM, to: guardianEmail, subject, html, text });
}

/** VERIFICAÇÃO (≥13) — sem botão de login no e-mail */
export async function sendVerifyEmail(params: { to: string; verifyUrl: string; expiresAt: Date }) {
  const { to, verifyUrl, expiresAt } = params;
  const subject = "Confirme seu e-mail na 8bits";

  const html = `
  <div style="background:#eef2f7;padding:24px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.06)">
      <tr><td style="padding:28px 28px 0" align="center">
        <img src="${APP_URL}/logo.png" alt="8bits" height="36" style="display:block;opacity:.95"/>
      </td></tr>

      <tr><td style="padding:20px 28px 0">
        <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25">Confirme seu e-mail</h1>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#334155">
          Confirme seu endereço de e-mail para ativar sua conta na 8bits.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:16px 28px 8px">
        <a href="${verifyUrl}" style="background:#ffab40;border-radius:12px;color:#fff;text-decoration:none;display:inline-block;font-weight:700;padding:12px 22px">Confirmar e-mail</a>
      </td></tr>

      <tr><td style="padding:4px 28px 22px;text-align:center;font-size:12px;color:#475569">
        Este link expira em <strong>${expiresAt.toLocaleString("pt-BR")}</strong>.
      </td></tr>
    </table>

    <div style="max-width:680px;margin:10px auto 0;text-align:center;font-size:12px;color:#94a3b8">
      © ${new Date().getFullYear()} 8bits
    </div>
  </div>`;

  const text = `Confirme seu e-mail na 8bits
Link de confirmação: ${verifyUrl}
Expira em: ${expiresAt.toLocaleString("pt-BR")}`;

  return resend.emails.send({ from: FROM, to, subject, html, text });
}

/** RESET DE SENHA — 15 minutos */
export async function sendResetEmail(params: { to: string; resetUrl: string }) {
  const { to, resetUrl } = params;
  const subject = "Redefinir sua senha • 8bits";

  const html = `
  <div style="background:#eef2f7;padding:24px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.06)">
      <tr><td style="padding:28px 28px 0" align="center">
        <img src="${APP_URL}/logo.png" alt="8bits" height="36" style="display:block;opacity:.95"/>
      </td></tr>

      <tr><td style="padding:20px 28px 0">
        <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25">Redefinir senha</h1>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#334155">
          Recebemos um pedido para redefinir sua senha na 8bits.
        </p>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#334155">
          Clique no botão abaixo. O link é válido por 15 minutos.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:16px 28px 8px">
        <a href="${resetUrl}" style="background:#ffab40;border-radius:12px;color:#fff;text-decoration:none;display:inline-block;font-weight:700;padding:12px 22px">Redefinir senha</a>
      </td></tr>

      <tr><td style="padding:4px 28px 22px;text-align:center;font-size:12px;color:#475569">
        Se você não solicitou, ignore este e-mail.
      </td></tr>
    </table>

    <div style="max-width:680px;margin:10px auto 0;text-align:center;font-size:12px;color:#94a3b8">
      © ${new Date().getFullYear()} 8bits
    </div>
  </div>`;

  const text = `Redefinição de senha 8bits
Acesse: ${resetUrl}
O link é válido por 15 minutos.
Se você não solicitou, ignore este e-mail.`;

  return resend.emails.send({ from: FROM, to, subject, html, text });
}

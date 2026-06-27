const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_REMETENTE = "TargetPro Co. <acesso@mail.targetproco.com.br>";
const LINK_DOWNLOAD_DESKTOP = "https://github.com/RicardoVelozo1/statpro-downloads/releases/download/v6.0.0/Lotofacil.Pro.Setup.6.0.0.exe";

const SETUP_SECRET = "rv-setup-teste-2026-temp-email";

exports.handler = async (event) => {
  const secret = event.queryStringParameters?.secret;
  if (secret !== SETUP_SECRET) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "RESEND_API_KEY ausente" };
  }

  const destinatario = "ricardo.s.velozo@gmail.com";
  const primeiroNome = "Ricardo";

  const blocoSenha = `
    <p style="font-size: 15px; line-height: 1.6;">
      Use o mesmo email e senha que você já utiliza em <a href="https://targetproco.com.br" style="color:#3b82f6;">targetproco.com.br</a> para acessar tanto a versão web quanto o programa desktop.
    </p>
  `;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="font-size: 22px; font-weight: bold; color: #3b82f6;">Target<span style="color:#f59e0b;">Pro</span></span>
    </div>
    <h2 style="color:#111827; font-size: 20px;">Bem-vindo(a) ao Plano Vitalício, ${primeiroNome}!</h2>
    <p style="font-size: 15px; line-height: 1.6;">
      Sua compra do <strong>StatPro — Analisador de Dados Estatísticos</strong> (Plano Vitalício) foi confirmada com sucesso.
    </p>
    ${blocoSenha}
    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 28px 0;">
    <h3 style="color:#111827; font-size: 16px;">📥 Programa Desktop (exclusivo Vitalício)</h3>
    <p style="font-size: 15px; line-height: 1.6;">
      Como cliente Vitalício, você também tem acesso ao programa desktop para Windows, que funciona mesmo offline (login válido por 30 dias).
    </p>
    <div style="text-align:center; margin: 28px 0;">
      <a href="${LINK_DOWNLOAD_DESKTOP}" style="background:#3b82f6; color:#ffffff; text-decoration:none; font-weight:bold; padding: 14px 28px; border-radius: 8px; display:inline-block; font-size: 15px;">
        Baixar programa desktop (Windows)
      </a>
    </div>
    <p style="font-size: 13px; color:#6b7280; line-height: 1.6;">
      Após instalar, abra o programa e faça login com o mesmo email e senha da sua conta.<br>
      Requisitos: Windows 10 ou 11, 64-bit.
    </p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color:#9ca3af; text-align:center;">
      TargetPro Co. — Analytics &amp; Solutions<br>
      Dúvidas? targetproco@gmail.com<br>
      Este é um email automático, não é necessário responder.<br>
      <strong>[TESTE — não corresponde a uma compra real]</strong>
    </p>
  </div>`;

  try {
    const resp = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_REMETENTE,
        to: [destinatario],
        subject: "[TESTE] Bem-vindo ao Plano Vitalício StatPro — acesso web + desktop",
        html,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, erro: data }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, erro: err.message }) };
  }
};

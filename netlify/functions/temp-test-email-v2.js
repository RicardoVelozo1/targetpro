const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_REMETENTE = "TargetPro Co. <acesso@mail.targetproco.com.br>";
const LINK_DOWNLOAD_DESKTOP = "https://github.com/RicardoVelozo1/statpro-downloads/releases/download/v6.0.0/Lotofacil.Pro.Setup.6.0.0.exe";

const SETUP_SECRET = "rv-setup-teste-2026-temp-email-v2";

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
  // Link de exemplo apenas para visualizar o layout — não é um link funcional real
  const linkSenha = "https://targetproco.com.br/app?mode=resetPassword&exemplo=teste";

  const blocoSenha = `
    <p style="font-size: 15px; line-height: 1.6;">
      Para acessar a plataforma web, crie sua senha clicando no botão abaixo:
    </p>
    <div style="text-align:center; margin: 28px 0;">
      <a href="${linkSenha}" style="background:#f59e0b; color:#111827; text-decoration:none; font-weight:bold; padding: 14px 28px; border-radius: 8px; display:inline-block; font-size: 15px;">
        Criar minha senha
      </a>
    </div>
    <p style="font-size: 13px; color:#6b7280; line-height: 1.6;">
      Se o botão não funcionar, copie e cole este link no seu navegador:<br>
      <a href="${linkSenha}" style="color:#3b82f6; word-break: break-all;">${linkSenha}</a>
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
      Antes de abrir o programa, crie sua senha clicando no botão acima. Depois, use o mesmo email e senha para fazer login no programa desktop.<br>
      Requisitos: Windows 10 ou 11, 64-bit.
    </p>
    <div style="background:#FEF3C7; border-left:4px solid #D97706; border-radius:6px; padding:14px 16px; margin: 20px 0;">
      <p style="font-size: 13px; color:#92400e; line-height: 1.6; margin:0;">
        <strong>⚠️ Aviso esperado do Windows ao instalar:</strong> o Windows pode mostrar a tela <em>“O Windows protegeu o computador”</em>, dizendo que o aplicativo não é reconhecido. Isso é normal para programas novos e não significa vírus. Para continuar, clique em <strong>“Mais informações”</strong> e depois em <strong>“Executar assim mesmo”</strong>.
      </p>
    </div>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color:#9ca3af; text-align:center;">
      TargetPro Co. — Analytics &amp; Solutions<br>
      Dúvidas? targetproco@gmail.com<br>
      Este é um email automático, não é necessário responder.<br>
      <strong>[TESTE — cenário cliente novo — não corresponde a uma compra real]</strong>
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
        subject: "[TESTE v2] Bem-vindo ao Plano Vitalício StatPro — acesso web + desktop",
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

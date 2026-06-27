const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_REMETENTE = "TargetPro Co. <acesso@mail.targetproco.com.br>";
const LINK_DOWNLOAD_DESKTOP = "https://github.com/RicardoVelozo1/statpro-downloads/releases/download/v6.0.0/Lotofacil.Pro.Setup.6.0.0.exe";

async function enviarEmailVitalicio(destinatario, nomeCliente, linkSenha) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY não configurada — email não enviado.");
    return { ok: false, motivo: "RESEND_API_KEY ausente" };
  }

  const primeiroNome = (nomeCliente || "").split(" ")[0] || "";

  const blocoSenha = linkSenha ? `
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
  ` : `
    <p style="font-size: 15px; line-height: 1.6;">
      Use o mesmo email e senha que você já utiliza em <a href="https://targetproco.com.br" style="color:#3b82f6;">targetproco.com.br</a> para acessar tanto a versão web quanto o programa desktop.
    </p>
  `;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="font-size: 22px; font-weight: bold; color: #3b82f6;">Target<span style="color:#f59e0b;">Pro</span></span>
    </div>
    <h2 style="color:#111827; font-size: 20px;">Bem-vindo(a) ao Plano Vitalício${primeiroNome ? ", " + primeiroNome : ""}!</h2>
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
      Este é um email automático, não é necessário responder.
    </p>
  </div>`;

  const resp = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_REMETENTE,
      to: [destinatario],
      subject: "Bem-vindo ao Plano Vitalício StatPro — acesso web + desktop",
      html,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Resend: falha ao enviar email vitalicio:", resp.status, JSON.stringify(data));
    return { ok: false, motivo: data };
  }
  console.log("Resend: email vitalicio enviado com sucesso, id:", data.id);
  return { ok: true, id: data.id };
}

async function enviarEmailDefinicaoSenha(destinatario, nomeCliente, linkSenha) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY não configurada — email não enviado.");
    return { ok: false, motivo: "RESEND_API_KEY ausente" };
  }

  const primeiroNome = (nomeCliente || "").split(" ")[0] || "";

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="font-size: 22px; font-weight: bold; color: #3b82f6;">Target<span style="color:#f59e0b;">Pro</span></span>
    </div>
    <h2 style="color:#111827; font-size: 20px;">Bem-vindo(a)${primeiroNome ? ", " + primeiroNome : ""}!</h2>
    <p style="font-size: 15px; line-height: 1.6;">
      Sua compra do <strong>StatPro — Analisador de Dados Estatísticos</strong> foi confirmada com sucesso.
      Para acessar a plataforma, crie sua senha clicando no botão abaixo:
    </p>
    <div style="text-align:center; margin: 32px 0;">
      <a href="${linkSenha}" style="background:#f59e0b; color:#111827; text-decoration:none; font-weight:bold; padding: 14px 28px; border-radius: 8px; display:inline-block; font-size: 15px;">
        Criar minha senha
      </a>
    </div>
    <p style="font-size: 13px; color:#6b7280; line-height: 1.6;">
      Se o botão não funcionar, copie e cole este link no seu navegador:<br>
      <a href="${linkSenha}" style="color:#3b82f6; word-break: break-all;">${linkSenha}</a>
    </p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color:#9ca3af; text-align:center;">
      TargetPro Co. — Analytics & Solutions<br>
      Este é um email automático, não é necessário responder.
    </p>
  </div>`;

  const resp = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_REMETENTE,
      to: [destinatario],
      subject: "Defina sua senha de acesso ao StatPro",
      html,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Resend: falha ao enviar email:", resp.status, JSON.stringify(data));
    return { ok: false, motivo: data };
  }
  console.log("Resend: email enviado com sucesso, id:", data.id);
  return { ok: true, id: data.id };
}

function normalizePrivateKey(raw) {
  if (!raw) return raw;
  let key = raw.trim();

  // Remove aspas externas, caso tenham sido coladas por engano
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Normaliza quebras de linha estilo Windows
  key = key.replace(/\r\n/g, "\n");
  // Converte sequências literais "\n" (texto) em quebra de linha real
  key = key.replace(/\\n/g, "\n");

  // Se já tem quebras de linha reais, está no formato correto
  if (key.includes("\n")) return key;

  // Caso a chave tenha sido salva em uma única linha (espaços no lugar de \n),
  // reconstrói o formato PEM correto a partir do header/footer.
  const headerMatch = key.match(/-----BEGIN ([A-Z ]+)-----/);
  const footerMatch = key.match(/-----END ([A-Z ]+)-----/);
  if (headerMatch && footerMatch) {
    const header = headerMatch[0];
    const footer = footerMatch[0];
    let body = key.replace(header, "").replace(footer, "").trim();
    body = body.replace(/\s+/g, ""); // remove todos os espaços, deixa só o base64
    const lines = body.match(/.{1,64}/g) || [];
    return header + "\n" + lines.join("\n") + "\n" + footer + "\n";
  }

  return key;
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

exports.handler = async (event) => {
  // Modo de diagnóstico temporário (GET com query ?debug=1) — não expõe a chave, só sua "forma"
  if (event.httpMethod === "GET" && event.queryStringParameters?.debug === "1") {
    const raw = process.env.FIREBASE_PRIVATE_KEY || "";
    return {
      statusCode: 200,
      body: JSON.stringify({
        length: raw.length,
        startsWithQuote: raw.startsWith('"'),
        firstChars: raw.slice(0, 35),
        lastChars: raw.slice(-35),
        containsLiteralBackslashN: raw.includes("\\n"),
        containsRealNewline: raw.includes("\n"),
        containsCarriageReturn: raw.includes("\r"),
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasHotmartSecret: !!process.env.HOTMART_SECRET,
      }),
    };
  }

  // Apenas POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Validar token Hotmart
  const secret = process.env.HOTMART_SECRET;
  const receivedSecret =
    event.headers["x-hotmart-hottok"] ||
    event.headers["x-hotmart-webhook-secret"] ||
    event.headers["hottok"];
  if (secret && receivedSecret !== secret) {
    console.warn("Webhook: token inválido recebido:", receivedSecret, "| headers disponíveis:", Object.keys(event.headers || {}));
    return { statusCode: 401, body: "Unauthorized" };
  }

  // Parse do body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Log para debug
  console.log("Webhook recebido:", JSON.stringify({ event: body?.event, product: body?.data?.product?.id }));

  // Filtrar apenas eventos de compra aprovada
  const event_type = body?.event;
  if (event_type !== "PURCHASE_APPROVED" && event_type !== "PURCHASE_COMPLETE") {
    return { statusCode: 200, body: "Ignored event: " + event_type };
  }

  const email = body?.data?.buyer?.email?.toLowerCase().trim();
  const name  = body?.data?.buyer?.name || "";
  const product_id  = body?.data?.product?.id?.toString();
  const offer_code  = (body?.data?.purchase?.offer?.code || "").toLowerCase();

  if (!email) {
    return { statusCode: 400, body: "No buyer email found" };
  }

  // Determinar plano
  let plano = "mensal";
  if (product_id === "7864099") {
    plano = "vitalicio";
  } else if (offer_code.includes("anual") || offer_code.includes("annual")) {
    plano = "anual";
  }

  const dias = plano === "vitalicio" ? 36500 : plano === "anual" ? 365 : 30;
  const data_inicio     = new Date();
  const data_expiracao  = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  try {
    let uid;
    let usuarioNovo = false;

    // Verificar se usuário já existe
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      console.log("Usuário existente encontrado:", uid);
    } catch {
      // Criar novo usuário sem senha (forçará definição via email)
      const newUser = await auth.createUser({
        email,
        displayName: name,
        emailVerified: false,
      });
      uid = newUser.uid;
      usuarioNovo = true;
      console.log("Novo usuário criado:", uid);
    }

    // Salvar/atualizar assinatura no Firestore
    await db.collection("assinaturas").doc(uid).set({
      uid,
      email,
      nome: name,
      plano,
      status: "ativo",
      data_inicio:    Timestamp.fromDate(data_inicio),
      data_expiracao: Timestamp.fromDate(data_expiracao),
      hotmart_product_id: product_id,
      hotmart_offer_code: offer_code,
      ultima_atualizacao: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Enviar email — comportamento depende do plano e se é usuário novo
    if (plano === "vitalicio") {
      // Vitalício recebe email especial com link de download do desktop,
      // tanto na primeira compra (com link de senha) quanto em upgrade
      // de um plano existente (sem link de senha, pois já possui conta).
      let linkSenha = null;
      if (usuarioNovo) {
        const actionCodeSettings = {
          url: "https://targetproco.com.br/app",
          handleCodeInApp: false,
        };
        linkSenha = await auth.generatePasswordResetLink(email, actionCodeSettings);
        console.log("Link de definição de senha gerado para:", email);
      }

      const envio = await enviarEmailVitalicio(email, name, linkSenha);
      if (!envio.ok) {
        console.error("⚠️ Assinatura vitalicio criada, mas o email falhou:", envio.motivo);
      }
    } else if (usuarioNovo) {
      const actionCodeSettings = {
        url: "https://targetproco.com.br/app",
        handleCodeInApp: false,
      };
      const linkSenha = await auth.generatePasswordResetLink(email, actionCodeSettings);
      console.log("Link de definição de senha gerado para:", email);

      const envio = await enviarEmailDefinicaoSenha(email, name, linkSenha);
      if (!envio.ok) {
        console.error("⚠️ Usuário criado, mas o email de definição de senha falhou:", envio.motivo);
      }
    }

    console.log(`✅ Sucesso: ${email} | plano: ${plano} | uid: ${uid} | novo: ${usuarioNovo}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, uid, plano, novo: usuarioNovo }),
    };

  } catch (err) {
    console.error("Erro no webhook:", err.message, err.stack);
    return { statusCode: 500, body: "Internal Server Error: " + err.message };
  }
};

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
    <p style="font-size: 15px; line-height: 1.6;">
      Depois de criar a senha, acesse <a href="https://targetproco.com.br/app" style="color:#2F7BFF; font-weight:bold;">targetproco.com.br/app</a>
      com seu e-mail e senha, pelo <strong>celular ou computador</strong>. Não é preciso instalar nada.
    </p>
    <p style="font-size: 13px; color:#4b5563; line-height: 1.6; background:#F2F6FF; padding:12px 14px; border-radius:8px;">
      📱 <strong>Dica:</strong> no celular, abra o link no navegador e toque em "Adicionar à tela inicial".
      O StatPro fica com ícone próprio, como um aplicativo.
    </p>
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
      ${linkSenha ? "Antes de abrir o programa, crie sua senha clicando no botão acima. Depois, use o mesmo email e senha para fazer login no programa desktop." : "Após instalar, abra o programa e faça login com o mesmo email e senha da sua conta no site."}<br>
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
      <span style="font-size: 22px; font-weight: bold; color: #0A2463;">TargetPro <span style="color:#F5B731;">Co.</span></span>
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
    <p style="font-size: 15px; line-height: 1.6;">
      Depois de criar a senha, acesse <a href="https://targetproco.com.br/app" style="color:#2F7BFF; font-weight:bold;">targetproco.com.br/app</a>
      com seu e-mail e senha, pelo <strong>celular ou computador</strong>. Não é preciso instalar nada.
    </p>
    <p style="font-size: 13px; color:#4b5563; line-height: 1.6; background:#F2F6FF; padding:12px 14px; border-radius:8px;">
      📱 <strong>Dica:</strong> no celular, abra o link no navegador e toque em "Adicionar à tela inicial".
      O StatPro fica com ícone próprio, como um aplicativo.
    </p>
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

  // Filtrar eventos
  const event_type = body?.event;

  // Reembolso / chargeback / cancelamento da compra: corta o acesso na hora.
  // (Cancelamento da ASSINATURA — SUBSCRIPTION_CANCELLATION — não corta: o cliente
  //  usa até o fim do período já pago, e a data de expiração encerra sozinha.)
  const EVENTOS_CORTE = ["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED", "PURCHASE_PROTEST"];
  if (EVENTOS_CORTE.includes(event_type)) {
    const emailCorte = body?.data?.buyer?.email?.toLowerCase().trim();
    const transacao = body?.data?.purchase?.transaction || "";
    if (!emailCorte) return { statusCode: 200, body: "Sem e-mail no evento " + event_type };
    try {
      const u = await auth.getUserByEmail(emailCorte);
      const ref = db.collection("assinaturas").doc(u.uid);
      const atual = await ref.get();
      if (!atual.exists) return { statusCode: 200, body: "Sem assinatura para cortar" };
      const transAtual = atual.data()?.hotmart_transaction || "";
      // Só corta se o evento for da mesma compra que está valendo (ou se não houver registro da compra)
      if (transAtual && transacao && transAtual !== transacao) {
        console.log(`Evento ${event_type} de outra compra (${transacao}); assinatura atual (${transAtual}) mantida.`);
        return { statusCode: 200, body: "Evento de outra compra — mantido" };
      }
      await ref.set({
        status: event_type === "PURCHASE_REFUNDED" ? "reembolsado" : "cancelado",
        motivo_corte: event_type,
        data_corte: FieldValue.serverTimestamp(),
        ultima_atualizacao: FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`Acesso cortado (${event_type}) para ${emailCorte}`);
      return { statusCode: 200, body: "Acesso cortado: " + event_type };
    } catch (err) {
      console.error("Erro ao cortar acesso:", err);
      return { statusCode: 200, body: "Usuário não encontrado para " + event_type };
    }
  }

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
  // Os códigos de oferta da Hotmart são aleatórios (ex.: "6a1k3hyz"), então o plano
  // é identificado pelo mapa de ofertas abaixo; como reserva, usa o nome/periodicidade
  // do plano de assinatura enviado no payload.
  // Ofertas do produto 7864015 (atualizadas em 14/11/2026):
  const OFERTAS = {
    "sjpl4w70": "mensal",      // Plano Mensal — R$ 19,90
    "8nrfkero": "trimestral",  // Plano Trimestral — R$ 49,90
    "6a1k3hyz": "anual",       // Plano Anual — R$ 149,00
    "tcpkpqw6": "fundador",    // Plano Fundador (anual) — R$ 99,00
  };
  const nomePlanoHotmart = (
    body?.data?.subscription?.plan?.name ||
    body?.data?.purchase?.offer?.name || ""
  ).toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let plano = "mensal";
  if (product_id === "7864099") {
    plano = "vitalicio";
  } else if (OFERTAS[offer_code]) {
    plano = OFERTAS[offer_code];
  } else if (nomePlanoHotmart.includes("fundador")) {
    plano = "fundador";
  } else if (nomePlanoHotmart.includes("trimestral") || offer_code.includes("trimestral")) {
    plano = "trimestral";
  } else if (nomePlanoHotmart.includes("anual") || offer_code.includes("anual") || offer_code.includes("annual")) {
    plano = "anual";
  }
  if (!OFERTAS[offer_code] && product_id !== "7864099") {
    console.warn(`Oferta não mapeada: '${offer_code}' (plano Hotmart: '${nomePlanoHotmart}') → '${plano}'`);
  }

  // Período de teste grátis (Plano Mensal tem 7 dias grátis desde 14/11/2026).
  // Na adesão em teste nada é cobrado: libera só os dias do teste (+1 de folga).
  // Quando a 1ª cobrança for aprovada, chega outro PURCHASE_APPROVED com valor > 0
  // e o acesso é estendido normalmente pelo plano.
  const DIAS_TESTE = 7;
  const purchase = body?.data?.purchase || {};
  const valorPago = Number(purchase?.price?.value ?? purchase?.full_price?.value ?? NaN);
  const statusTexto = [purchase?.status, body?.data?.subscription?.status].join(" ").toLowerCase();
  const emTeste =
    purchase?.is_free_trial === true ||
    purchase?.isFreeTrial === true ||
    statusTexto.includes("trial") ||
    (valorPago === 0 && plano !== "vitalicio");
  if (emTeste || !OFERTAS[offer_code]) {
    // Log detalhado para conferir o formato real do payload da Hotmart
    console.log("Detalhe da compra:", JSON.stringify({
      offer_code, emTeste, valorPago,
      purchase_status: purchase?.status,
      recurrence_number: purchase?.recurrence_number,
      subscription: body?.data?.subscription,
    }));
  }

  // Dias de acesso por período + 3 dias de folga para a renovação automática
  // da Hotmart chegar antes de o acesso expirar.
  const DIAS_PLANO = { vitalicio: 36500, fundador: 365, anual: 365, trimestral: 92, mensal: 30 };
  const dias = emTeste
    ? DIAS_TESTE + 1
    : (DIAS_PLANO[plano] || 30) + (plano === "vitalicio" ? 0 : 3);
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

    // Proteção anti-downgrade: verificar se o cliente já tem um plano superior
    // Uma renovação automática de plano Mensal não deve sobrescrever um plano Vitalício
    // Normaliza (minúsculo, sem acento, sem espaços nas pontas) para que a comparação
    // nunca falhe silenciosamente por causa de variação de formatação no dado salvo.
    const normalizarPlano = (p) =>
      (p || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // remove acentos

    const HIERARQUIA = { "vitalicio": 4, "anual": 3, "fundador": 3, "trimestral": 2, "mensal": 1 };
    const docAtual = await db.collection("assinaturas").doc(uid).get();
    if (docAtual.exists) {
      const planoAtual = docAtual.data()?.plano;
      const statusAtual = docAtual.data()?.status;
      const nivelAtual = HIERARQUIA[normalizarPlano(planoAtual)] || 0;
      const nivelNovo = HIERARQUIA[normalizarPlano(plano)] || 0;
      const expAtual = docAtual.data()?.data_expiracao?.toDate?.();
      const aindaValido = !expAtual || expAtual > new Date();
      if (statusAtual === "ativo" && aindaValido && nivelAtual > nivelNovo) {
        console.log(`⚠️ Downgrade bloqueado: ${email} tem plano '${planoAtual}' (nível ${nivelAtual}) — renovação de '${plano}' (nível ${nivelNovo}) ignorada.`);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, msg: "Downgrade bloqueado — plano superior mantido.", planoAtual, planoIgnorado: plano }),
        };
      }
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
      em_teste: emTeste,
      hotmart_transaction: body?.data?.purchase?.transaction || "",
      motivo_corte: FieldValue.delete(),
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

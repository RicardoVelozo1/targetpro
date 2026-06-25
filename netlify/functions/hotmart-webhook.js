const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

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
    event.headers["x-hotmart-webhook-secret"] ||
    event.headers["hottok"];
  if (secret && receivedSecret !== secret) {
    console.warn("Webhook: token inválido recebido:", receivedSecret);
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

    // Enviar email de definição de senha para usuários novos
    if (usuarioNovo) {
      const actionCodeSettings = {
        url: "https://targetproco.com.br/app",
        handleCodeInApp: false,
      };
      await auth.generatePasswordResetLink(email, actionCodeSettings);
      console.log("Link de definição de senha gerado para:", email);
      // O Firebase envia o email automaticamente via Authentication → Templates
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

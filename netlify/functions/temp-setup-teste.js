const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

function normalizePrivateKey(raw) {
  if (!raw) return raw;
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\r\n/g, "\n");
  key = key.replace(/\\n/g, "\n");
  if (key.includes("\n")) return key;
  const headerMatch = key.match(/-----BEGIN ([A-Z ]+)-----/);
  const footerMatch = key.match(/-----END ([A-Z ]+)-----/);
  if (headerMatch && footerMatch) {
    const header = headerMatch[0];
    const footer = footerMatch[0];
    let body = key.replace(header, "").replace(footer, "").trim();
    body = body.replace(/\s+/g, "");
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

// Function temporária e restrita — usada apenas para criar UM documento de
// teste específico (conta vitalícia de teste para validar o login offline
// do desktop). Protegida por secret simples + UID fixo no código (não aceita
// UID arbitrário via request, para evitar abuso caso a URL seja descoberta).
// REMOVER este arquivo após o teste.

const SETUP_SECRET = "rv-setup-teste-2026-temp";
const UID_PERMITIDO = "WnYafxA7FYYC5p8WL4Zza7YLuI22"; // ricardo.s.velozo@gmail.com

exports.handler = async (event) => {
  const secret = event.queryStringParameters?.secret;
  if (secret !== SETUP_SECRET) {
    return { statusCode: 403, body: "Forbidden" };
  }

  try {
    const agora = new Date();
    const expiracao = new Date(agora.getTime() + 36500 * 24 * 60 * 60 * 1000); // ~100 anos

    await db.collection("assinaturas").doc(UID_PERMITIDO).set({
      uid: UID_PERMITIDO,
      email: "ricardo.s.velozo@gmail.com",
      nome: "Ricardo Teste Vitalicio",
      plano: "vitalicio",
      status: "ativo",
      data_inicio: Timestamp.fromDate(agora),
      data_expiracao: Timestamp.fromDate(expiracao),
      hotmart_product_id: "7864099",
      hotmart_offer_code: "teste-manual-desktop",
    }, { merge: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, mensagem: "Documento de teste criado/atualizado com sucesso.", uid: UID_PERMITIDO }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, erro: err.message }),
    };
  }
};

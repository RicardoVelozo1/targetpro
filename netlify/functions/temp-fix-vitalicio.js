const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

function normalizePrivateKey(raw) {
  if (!raw) return raw;
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
  if (key.includes("\n")) return key;
  const headerMatch = key.match(/-----BEGIN ([A-Z ]+)-----/);
  const footerMatch = key.match(/-----END ([A-Z ]+)-----/);
  if (headerMatch && footerMatch) {
    const header = headerMatch[0];
    const footer = footerMatch[0];
    let body = key.replace(header, "").replace(footer, "").trim().replace(/\s+/g, "");
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

const SECRET = "rv-fix-vitalicio-2026-temp";
const UID = "wBFxVijW9AOEDTqCOAdWvAr5clF2";

exports.handler = async (event) => {
  if (event.queryStringParameters?.secret !== SECRET) {
    return { statusCode: 403, body: "Forbidden" };
  }

  try {
    const agora = new Date();
    const expiracao = new Date(agora.getTime() + 36500 * 24 * 60 * 60 * 1000);

    await db.collection("assinaturas").doc(UID).set({
      plano: "vitalicio",
      status: "ativo",
      hotmart_product_id: "7864099",
      data_inicio: Timestamp.fromDate(agora),
      data_expiracao: Timestamp.fromDate(expiracao),
      ultima_atualizacao: Timestamp.fromDate(agora),
    }, { merge: true });

    const doc = await db.collection("assinaturas").doc(UID).get();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, dados: doc.data() }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, erro: err.message }) };
  }
};

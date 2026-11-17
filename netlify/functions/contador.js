// Contador de visitas e cliques (anônimo: não guarda IP, e-mail nem cookie)
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

function normalizePrivateKey(k) {
  if (!k) return k;
  k = k.replace(/\\n/g, "\n");
  if (!k.includes("\n")) {
    k = k.replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n").replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
  }
  return k;
}
function db() {
  if (!getApps().length) {
    initializeApp({ credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }) });
  }
  return getFirestore();
}

// Só estes eventos são aceitos
const EVENTOS = new Set([
  "site_visita", "site_unico", "app_unico",
  "cta_mensal", "cta_trimestral", "cta_anual", "cta_fundador", "cta_topo",
]);

function hojeBR() {
  // Data no horário de Brasília (UTC-3)
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "" };
  const ua = (event.headers["user-agent"] || "").toLowerCase();
  if (/bot|crawl|spider|preview|facebookexternalhit|headless/.test(ua)) return { statusCode: 204, body: "" };
  let e;
  try { e = JSON.parse(event.body || "{}").e; } catch { e = null; }
  if (!EVENTOS.has(e)) return { statusCode: 400, body: "" };
  try {
    await db().collection("metricas").doc(hojeBR()).set(
      { [e]: FieldValue.increment(1), data: hojeBR(), atualizado: FieldValue.serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("contador:", err.message);
  }
  return { statusCode: 204, body: "" };
};

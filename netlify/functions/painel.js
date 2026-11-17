// Painel do Dono: só responde para as contas do dono (por UID), com o login conferido no servidor
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

// UIDs das contas do dono no Firebase Auth (podem ser trocados pela variável DONOS_UIDS na Netlify, separados por vírgula)
const DONOS = (process.env.DONOS_UIDS || "wBFxVijW9AOEDTqCOAdWvAr5clF2,WnYafxA7FYYC5p8WL4Zza7YLuI22,oeOhUxpr6BcjrfXBuTIHifgfLD13")
  .split(",").map((s) => s.trim()).filter(Boolean);

function normalizePrivateKey(k) {
  if (!k) return k;
  k = k.replace(/\\n/g, "\n");
  if (!k.includes("\n")) {
    k = k.replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n").replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
  }
  return k;
}
function init() {
  if (!getApps().length) {
    initializeApp({ credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }) });
  }
}
const iso = (t) => (t && t.toDate ? t.toDate().toISOString() : null);

exports.handler = async (event) => {
  const h = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, headers: h, body: JSON.stringify({ erro: "sem login" }) };
  init();
  let quem;
  try { quem = await getAuth().verifyIdToken(token); } catch { return { statusCode: 401, headers: h, body: JSON.stringify({ erro: "login inválido" }) }; }
  if (!DONOS.includes(quem.uid)) return { statusCode: 403, headers: h, body: JSON.stringify({ erro: "acesso restrito" }) };

  const db = getFirestore();
  const [lista, assin, metr] = await Promise.all([
    getAuth().listUsers(1000),
    db.collection("assinaturas").get(),
    db.collection("metricas").orderBy("data", "desc").limit(30).get().catch(() => ({ docs: [] })),
  ]);
  const porUid = {};
  assin.docs.forEach((d) => { porUid[d.id] = d.data(); });
  const usuarios = lista.users.map((u) => {
    const a = porUid[u.uid] || {};
    return {
      email: u.email,
      dono: DONOS.includes(u.uid),
      criado: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
      ultimoLogin: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
      plano: a.plano || null,
      status: a.status || null,
      emTeste: !!a.em_teste,
      expira: iso(a.data_expiracao),
    };
  }).sort((x, y) => (y.criado || "").localeCompare(x.criado || ""));
  const metricas = metr.docs.map((d) => { const m = d.data(); delete m.atualizado; return m; });
  return { statusCode: 200, headers: h, body: JSON.stringify({ geradoEm: new Date().toISOString(), usuarios, metricas }) };
};

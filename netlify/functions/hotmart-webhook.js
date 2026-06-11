const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const secret = process.env.HOTMART_SECRET;
  const receivedSecret = event.headers["x-hotmart-webhook-secret"] || event.headers["hottok"];
  if (secret && receivedSecret !== secret) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const event_type = body?.event;
  if (event_type !== "PURCHASE_APPROVED" && event_type !== "PURCHASE_COMPLETE") {
    return { statusCode: 200, body: "Ignored event" };
  }

  const email = body?.data?.buyer?.email;
  const name = body?.data?.buyer?.name || "";
  const product_id = body?.data?.product?.id?.toString();
  const offer_code = body?.data?.purchase?.offer?.code || "";

  if (!email) {
    return { statusCode: 400, body: "No email found" };
  }

  // Determinar plano
  let plano = "mensal";
  if (product_id === "7864099") plano = "vitalicio";
  else if (offer_code.includes("anual")) plano = "anual";

  const dias = plano === "vitalicio" ? 36500 : plano === "anual" ? 365 : 30;
  const data_inicio = new Date();
  const data_expiracao = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  try {
    // Criar usuário no Firebase Auth
    let uid;
    try {
      const existing = await admin.auth().getUserByEmail(email);
      uid = existing.uid;
    } catch {
      const newUser = await admin.auth().createUser({ email, displayName: name });
      uid = newUser.uid;
      // Enviar email de definição de senha
      await admin.auth().generatePasswordResetLink(email);
    }

    // Salvar assinatura no Firestore
    await admin.firestore().collection("assinaturas").doc(uid).set({
      uid,
      email,
      plano,
      status: "ativo",
      data_inicio: admin.firestore.Timestamp.fromDate(data_inicio),
      data_expiracao: admin.firestore.Timestamp.fromDate(data_expiracao),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, uid, plano }) };
  } catch (err) {
    console.error("Erro webhook:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
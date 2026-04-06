const crypto = require("crypto");

const { sendMail } = require("./mailHandler");

const DEFAULT_ACTIVATION_TTL_HOURS = 24;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getActivationTtlMs() {
  const ttlHours = Number(process.env.ACCOUNT_ACTIVATION_TTL_HOURS || DEFAULT_ACTIVATION_TTL_HOURS);
  return ttlHours * 60 * 60 * 1000;
}

function hashActivationToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function createActivationToken() {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashActivationToken(token),
    expiresAt: new Date(Date.now() + getActivationTtlMs())
  };
}

function resolveAppBaseUrl(req) {
  const configuredBaseUrl = normalizeBaseUrl(process.env.APP_BASE_URL);

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const protocol = String(req?.headers?.["x-forwarded-proto"] || req?.protocol || "http")
    .split(",")[0]
    .trim();
  const host = req?.get?.("host");

  if (host) {
    return `${protocol}://${host}`;
  }

  return `http://localhost:${process.env.PORT || 3000}`;
}

function buildActivationUrl(appBaseUrl, token) {
  return `${normalizeBaseUrl(appBaseUrl)}/activate-account?token=${encodeURIComponent(token)}`;
}

async function sendActivationEmail({ user, token, appBaseUrl }) {
  const activationUrl = buildActivationUrl(appBaseUrl, token);
  const fullName = user.fullName || user.username || "user";
  const expirationHours = Number(process.env.ACCOUNT_ACTIVATION_TTL_HOURS || DEFAULT_ACTIVATION_TTL_HOURS);

  const subject = "Activate your warehouse account";
  const text = [
    `Hello ${fullName},`,
    "",
    "An account has been created for you in the warehouse management system.",
    "Please open the link below to activate your account and set your password:",
    activationUrl,
    "",
    `This activation link expires in ${expirationHours} hour(s).`,
    "If you did not expect this email, please contact the administrator."
  ].join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#24314b">
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>An account has been created for you in the warehouse management system.</p>
      <p>Please click the button below to activate your account and set your password:</p>
      <p>
        <a
          href="${activationUrl}"
          style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2f66f6;color:#fff;text-decoration:none;font-weight:700"
        >
          Activate Account
        </a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p><a href="${activationUrl}">${activationUrl}</a></p>
      <p>This activation link expires in <strong>${expirationHours} hour(s)</strong>.</p>
      <p>If you did not expect this email, please contact the administrator.</p>
    </div>
  `;

  try {
    await sendMail({
      to: user.email,
      subject,
      text,
      html
    });
  } catch (err) {
    console.error(`\n[MAILER WARNING] Could not send activation email to ${user.email}`);
    console.error(`[MAILER ERROR] ${err.message}`);
    console.error(`[ACTIVATION URL] Please use this link to activate the account manually:\n${activationUrl}\n`);
  }

  return activationUrl;
}

module.exports = {
  createActivationToken,
  hashActivationToken,
  resolveAppBaseUrl,
  buildActivationUrl,
  sendActivationEmail
};

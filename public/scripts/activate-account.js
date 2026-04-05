const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 64
};

const elements = {
  form: document.getElementById("activationForm"),
  status: document.getElementById("activationStatus"),
  summary: document.getElementById("activationSummary"),
  name: document.getElementById("activationName"),
  email: document.getElementById("activationEmail"),
  expiresAt: document.getElementById("activationExpiresAt"),
  passwordInput: document.getElementById("passwordInput"),
  confirmPasswordInput: document.getElementById("confirmPasswordInput"),
  activateButton: document.getElementById("activateButton")
};

let redirectTimer = null;

function getActivationToken() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

function showStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = `status-message ${type}`;
  elements.status.hidden = false;
}

function scheduleRedirectToLogin(delayMs = 1800) {
  window.clearTimeout(redirectTimer);
  redirectTimer = window.setTimeout(() => {
    window.location.href = "/login";
  }, delayMs);
}

function setLoading(isLoading) {
  elements.activateButton.disabled = isLoading;
  elements.activateButton.querySelector("span").textContent = isLoading
    ? "Activating..."
    : "Activate account";
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function validatePasswordPolicy(password) {
  if (password.length < PASSWORD_POLICY.minLength || password.length > PASSWORD_POLICY.maxLength) {
    return `Password must be between ${PASSWORD_POLICY.minLength} and ${PASSWORD_POLICY.maxLength} characters.`;
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least 1 uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least 1 lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least 1 number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least 1 special character.";
  }

  if (/\s/.test(password)) {
    return "Password cannot contain spaces.";
  }

  return null;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = Array.isArray(data?.errors) ? data.errors : [];
    const firstError = errors[0] && typeof errors[0] === "object"
      ? Object.values(errors[0])[0]
      : null;
    throw new Error(firstError || data?.message || "Request failed.");
  }

  return data;
}

async function loadActivationPreview() {
  const token = getActivationToken();

  if (!token) {
    elements.form.hidden = true;
    showStatus("Activation token is missing. Please use the link from your activation email.", "error");
    return;
  }

  try {
    const result = await requestJson(`/api/v1/auth/activate-account?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: {}
    });
    const data = result?.data ?? {};

    elements.summary.hidden = false;
    elements.name.textContent = data.fullName || data.username || "-";
    elements.email.textContent = data.email || "-";
    elements.expiresAt.textContent = `Link expires: ${formatDateTime(data.expiresAt)}`;
  } catch (error) {
    elements.form.hidden = true;
    showStatus(error.message || "Activation link is invalid or expired.", "error");
  }
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getActivationToken();
  const password = elements.passwordInput.value;
  const confirmPassword = elements.confirmPasswordInput.value;

  if (!token) {
    showStatus("Activation token is missing.", "error");
    return;
  }

  const passwordError = validatePasswordPolicy(password);
  if (passwordError) {
    showStatus(passwordError, "error");
    elements.passwordInput.focus();
    return;
  }

  if (password !== confirmPassword) {
    showStatus("Password confirmation does not match.", "error");
    elements.confirmPasswordInput.focus();
    return;
  }

  setLoading(true);

  try {
    const result = await requestJson("/api/v1/auth/activate-account", {
      method: "POST",
      body: JSON.stringify({
        token,
        password
      })
    });

    elements.form.reset();
    elements.form.hidden = true;
    showStatus(
      `${result.message || "Account activated successfully. You can now sign in."} Dang chuyen ve trang dang nhap...`,
      "success"
    );
    scheduleRedirectToLogin();
  } catch (error) {
    showStatus(error.message || "Failed to activate account.", "error");
  } finally {
    setLoading(false);
  }
});

loadActivationPreview();

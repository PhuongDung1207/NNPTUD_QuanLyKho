function getApiErrorMessage(data) {
  const firstError = Array.isArray(data?.errors) ? data.errors[0] : null;

  if (typeof firstError === "string" && firstError.trim()) {
    return firstError;
  }

  if (firstError && typeof firstError === "object") {
    const firstFieldMessage = Object.values(firstError).find(
      (value) => typeof value === "string" && value.trim()
    );

    if (firstFieldMessage) {
      return firstFieldMessage;
    }
  }

  return data?.message || "Co loi xay ra.";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const API = {
  BASE: "/api/v1",

  async request(method, path, body) {
    const options = {
      method,
      credentials: "include",
      headers: {}
    };

    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API.BASE}${path}`, options);

    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data));
    }

    return data;
  },

  listUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return API.request("GET", `/users${query ? `?${query}` : ""}`);
  },

  getUserById(id) {
    return API.request("GET", `/users/${id}`);
  },

  getCurrentUser() {
    return API.request("GET", "/users/me");
  },

  listRoles() {
    return API.request("GET", "/roles");
  },

  async importUsers(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API.BASE}/users/import`, {
      method: "POST",
      credentials: "include",
      body: formData
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data));
    }

    return data;
  },

  logout() {
    return API.request("POST", "/auth/logout");
  },

  createUser(payload) {
    return API.request("POST", "/users", payload);
  },

  updateUser(id, payload) {
    return API.request("PATCH", `/users/${id}`, payload);
  },

  updateCurrentUser(payload) {
    return API.request("PATCH", "/users/me", payload);
  },

  resendInvite(id) {
    return API.request("POST", `/users/${id}/resend-invite`);
  },

  lockUser(id) {
    return API.request("PATCH", `/users/${id}/lock`);
  },

  unlockUser(id) {
    return API.request("PATCH", `/users/${id}/unlock`);
  },

  deleteUser(id) {
    return API.request("DELETE", `/users/${id}`);
  }
};

const state = {
  users: [],
  availableRoles: [],
  currentUser: null,
  search: "",
  status: "all",
  editingId: null,
  modalMode: "user",
  loading: false,
  importing: false,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 20
};

const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 64
};

const fragmentPaths = {
  sidebar: "/fragments/sidebar.html",
  header: "/fragments/header.html"
};

const elements = {};

async function loadFragment(mountId, source) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const response = await fetch(source);
  if (!response.ok) throw new Error(`Khong the tai fragment: ${source}`);
  mount.innerHTML = await response.text();
}

async function loadLayoutFragments() {
  await Promise.all([
    loadFragment("sidebarMount", fragmentPaths.sidebar),
    loadFragment("headerMount", fragmentPaths.header)
  ]);
}

function cacheElements() {
  elements.tableBody = document.getElementById("usersTableBody");
  elements.tableSummary = document.getElementById("tableSummary");
  elements.totalUsersCount = document.getElementById("totalUsersCount");
  elements.activeUsersCount = document.getElementById("activeUsersCount");
  elements.lockedUsersCount = document.getElementById("lockedUsersCount");
  elements.searchInput = document.getElementById("searchInput");
  elements.statusFilter = document.getElementById("statusFilter");
  elements.openUserModalButton = document.getElementById("openUserModal");
  elements.openUserImportButton = document.getElementById("openUserImportButton");
  elements.userImportButtonText = elements.openUserImportButton?.querySelector("span");
  elements.userImportInput = document.getElementById("userImportInput");
  elements.importResultModal = document.getElementById("importResultModal");
  elements.importResultBackdrop = document.getElementById("importResultBackdrop");
  elements.importResultMessage = document.getElementById("importResultMessage");
  elements.importResultStats = document.getElementById("importResultStats");
  elements.importWarningSection = document.getElementById("importWarningSection");
  elements.importWarningList = document.getElementById("importWarningList");
  elements.importFailureSection = document.getElementById("importFailureSection");
  elements.importFailureList = document.getElementById("importFailureList");
  elements.closeImportResultButton = document.getElementById("closeImportResultButton");
  elements.sidebarProfileCard = document.getElementById("sidebarProfileCard");
  elements.sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  elements.sidebarUserName = document.getElementById("sidebarUserName");
  elements.sidebarUserRole = document.getElementById("sidebarUserRole");
  elements.sidebarLogoutButton = document.getElementById("sidebarLogoutButton");
  elements.userModal = document.getElementById("userModal");
  elements.modalBackdrop = document.getElementById("modalBackdrop");
  elements.closeUserModalButton = document.getElementById("closeUserModal");
  elements.cancelModalButton = document.getElementById("cancelModalButton");
  elements.userForm = document.getElementById("userForm");
  elements.userFormModeNotice = document.getElementById("userFormModeNotice");
  elements.modalTitleText = document.querySelector("#modalTitle span");
  elements.fullNameInput = document.getElementById("fullNameInput");
  elements.usernameInput = document.getElementById("usernameInput");
  elements.usernameHint = document.getElementById("usernameHint");
  elements.emailInput = document.getElementById("emailInput");
  elements.phoneInput = document.getElementById("phoneInput");
  elements.avatarUrlInput = document.getElementById("avatarUrlInput");
  elements.passwordInput = document.getElementById("passwordInput");
  elements.passwordHint = document.getElementById("passwordHint");
  elements.statusInput = document.getElementById("statusInput");
  elements.roleInput = document.getElementById("roleInput");
  elements.togglePasswordButton = document.getElementById("togglePasswordButton");
  elements.modalSubmitButton = document.querySelector(".modal-submit");
  elements.modalSubmitText = elements.modalSubmitButton?.querySelector("span");
  elements.pageInfo = document.querySelector(".page-badge");
  elements.passwordField = elements.passwordInput?.closest(".form-field");
  elements.statusField = elements.statusInput?.closest(".form-field");
  elements.roleField = elements.roleInput?.closest(".form-field");
}

function showToast(message, type = "success") {
  let toast = document.getElementById("toastNotification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastNotification";
    toast.style.cssText =
      "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;" +
      "padding:.75rem 1.2rem;border-radius:.6rem;font-size:.875rem;" +
      "font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.25);" +
      "transition:opacity .25s,transform .25s;pointer-events:none;";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background = type === "success" ? "#22c55e" : "#ef4444";
  toast.style.color = "#fff";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(.5rem)";
  }, 3000);
}

function showModalError(message) {
  let box = document.getElementById("modalError");
  if (!box) {
    box = document.createElement("p");
    box.id = "modalError";
    box.style.cssText =
      "color:#ef4444;font-size:.825rem;padding:.5rem .8rem;" +
      "background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);" +
      "border-radius:.5rem;margin-bottom:.5rem;";
    elements.userForm.prepend(box);
  }

  box.textContent = message;
  box.hidden = false;
}

function clearModalError() {
  const box = document.getElementById("modalError");
  if (box) box.hidden = true;
}

function clearImportResultContent() {
  if (elements.importResultMessage) {
    elements.importResultMessage.textContent = "";
  }
  if (elements.importResultStats) {
    elements.importResultStats.innerHTML = "";
  }
  if (elements.importWarningList) {
    elements.importWarningList.innerHTML = "";
  }
  if (elements.importFailureList) {
    elements.importFailureList.innerHTML = "";
  }
  if (elements.importWarningSection) {
    elements.importWarningSection.hidden = true;
  }
  if (elements.importFailureSection) {
    elements.importFailureSection.hidden = true;
  }
}

function openImportResultModal() {
  if (!elements.importResultModal || !elements.importResultBackdrop) return;

  elements.importResultModal.hidden = false;
  elements.importResultBackdrop.hidden = false;

  requestAnimationFrame(() => {
    elements.importResultModal.classList.add("is-open");
    elements.importResultBackdrop.classList.add("is-open");
    elements.importResultModal.setAttribute("aria-hidden", "false");
  });
}

function hideImportResult() {
  if (!elements.importResultModal || !elements.importResultBackdrop) return;

  elements.importResultModal.classList.remove("is-open");
  elements.importResultBackdrop.classList.remove("is-open");
  elements.importResultModal.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    elements.importResultModal.hidden = true;
    elements.importResultBackdrop.hidden = true;
    clearImportResultContent();
  }, 220);
}

function setImportLoading(isLoading) {
  state.importing = isLoading;

  if (elements.openUserImportButton) {
    elements.openUserImportButton.disabled = isLoading;
  }

  if (elements.userImportButtonText) {
    elements.userImportButtonText.textContent = isLoading
      ? "Dang import..."
      : "Import Excel";
  }
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function validatePasswordPolicy(password) {
  if (password.length < PASSWORD_POLICY.minLength || password.length > PASSWORD_POLICY.maxLength) {
    return `Mat khau phai dai tu ${PASSWORD_POLICY.minLength} den ${PASSWORD_POLICY.maxLength} ky tu.`;
  }

  if (!/[A-Z]/.test(password)) {
    return "Mat khau phai co it nhat 1 chu in hoa.";
  }

  if (!/[a-z]/.test(password)) {
    return "Mat khau phai co it nhat 1 chu thuong.";
  }

  if (!/[0-9]/.test(password)) {
    return "Mat khau phai co it nhat 1 chu so.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Mat khau phai co it nhat 1 ky tu dac biet.";
  }

  if (/\s/.test(password)) {
    return "Mat khau khong duoc chua khoang trang.";
  }

  return null;
}

function formatStatus(status) {
  const normalizedStatus = normalizeStatus(status);
  const labels = {
    active: "Active",
    locked: "Locked",
    inactive: "Inactive"
  };

  return labels[normalizedStatus] || status;
}

function statusClassName(status) {
  const normalizedStatus = normalizeStatus(status);
  const classes = {
    active: "active",
    locked: "locked",
    inactive: "inactive"
  };

  return classes[normalizedStatus] || "inactive";
}

function formatDate(isoString) {
  if (!isoString) return "-";

  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function buildUserAvatarMarkup(user, displayName) {
  if (user?.avatarUrl) {
    return `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(displayName)}">`;
  }

  return escapeHtml((displayName ?? "?").charAt(0).toUpperCase());
}

function buildUserMeta(user) {
  const metaParts = [];

  if (user?.username) {
    metaParts.push(`@${user.username}`);
  }

  if (user?.email) {
    metaParts.push(user.email);
  }

  if (user?.phone) {
    metaParts.push(user.phone);
  }

  return metaParts.join(" | ");
}

function titleCase(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
}

function formatSidebarRole(role) {
  const roleName = typeof role === "string" ? role : role?.name;

  if (roleName === "admin") {
    return "Administrator";
  }

  if (roleName === "user") {
    return "Standard User";
  }

  return titleCase(roleName) || getRoleLabel(role) || "User";
}

function getRoleLabel(role) {
  if (!role) return "";

  if (typeof role === "string") {
    return role.toUpperCase();
  }

  return role.code || (role.name ? role.name.toUpperCase() : "");
}

function getUserRoleLabel(user) {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles.map((role) => getRoleLabel(role)).filter(Boolean).join(", ");
  }

  return getRoleLabel(user?.role);
}

function getUserRoleValue(user) {
  if (user?.role?.code) {
    return user.role.code;
  }

  if (typeof user?.role === "string") {
    return user.role.toUpperCase();
  }

  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return getRoleLabel(user.roles[0]);
  }

  return "";
}

function getDefaultRoleValue() {
  return state.availableRoles.find((role) => role.name === "user")?.code
    || state.availableRoles[0]?.code
    || "";
}

function renderRoleOptions(selectedRole = "") {
  if (!elements.roleInput) return;

  if (state.availableRoles.length === 0) {
    elements.roleInput.innerHTML = '<option value="">No roles available</option>';
    elements.roleInput.disabled = true;
    return;
  }

  elements.roleInput.disabled = false;
  elements.roleInput.innerHTML = state.availableRoles
    .map((role) => `<option value="${role.code}">${role.code} - ${role.name}</option>`)
    .join("");

  elements.roleInput.value = selectedRole || getDefaultRoleValue();

  if (!elements.roleInput.value) {
    elements.roleInput.value = getDefaultRoleValue();
  }
}

async function fetchRoles() {
  const result = await API.listRoles();
  if (!result) return;

  state.availableRoles = result?.data ?? result ?? [];
  renderRoleOptions();
}

function renderSidebarProfile(user) {
  if (!user) return;

  if (elements.sidebarUserAvatar) {
    elements.sidebarUserAvatar.innerHTML = buildUserAvatarMarkup(
      user,
      user.fullName || user.username
    );
  }

  if (elements.sidebarUserName) {
    elements.sidebarUserName.textContent = user.fullName || user.username || "User";
  }

  if (elements.sidebarUserRole) {
    elements.sidebarUserRole.textContent = formatSidebarRole(user.role);
  }
}

function syncCurrentUser(user) {
  if (!user) return;

  state.currentUser = user;
  renderSidebarProfile(user);
}

async function fetchCurrentUser(options = {}) {
  const { silent = false } = options;

  try {
    const result = await API.getCurrentUser();
    if (!result) return null;

    const user = result?.data ?? result;
    syncCurrentUser(user);
    return user;
  } catch (error) {
    if (!silent) {
      showToast(error.message || "Khong the tai thong tin tai khoan.", "error");
    }
    console.error(error);
    return null;
  }
}

async function fetchAndRenderUsers() {
  setTableLoading(true);

  const params = {
    page: state.currentPage,
    limit: state.limit
  };

  if (state.search) params.search = state.search;
  if (state.status !== "all") params.status = state.status;

  try {
    const result = await API.listUsers(params);
    if (!result) return;

    const users = result.data ?? result;
    const pagination = result.pagination ?? {};

    state.users = users;
    state.total = pagination.total ?? users.length;
    state.totalPages = pagination.totalPages ?? 1;

    renderStats(result);
    renderTable();
    renderPageInfo();
  } catch (err) {
    showToast(err.message || "Khong the tai danh sach nguoi dung.", "error");
    console.error(err);
  } finally {
    setTableLoading(false);
  }
}

function setTableLoading(isLoading) {
  state.loading = isLoading;
  if (!elements.tableBody) return;

  if (isLoading) {
    elements.tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Dang tai du lieu...</td>
      </tr>
    `;
  }
}

function renderStats(apiResult) {
  const stats = apiResult?.stats ?? apiResult?.meta ?? {};
  const users = state.users;

  elements.totalUsersCount.textContent = stats.total ?? state.total ?? users.length;
  elements.activeUsersCount.textContent =
    stats.active ?? users.filter((user) => normalizeStatus(user.status) === "active").length;
  elements.lockedUsersCount.textContent =
    stats.locked ?? users.filter((user) => normalizeStatus(user.status) === "locked").length;
}

function createTableRow(user, index) {
  const userId = user._id ?? user.id;
  const roleLabel = getUserRoleLabel(user);
  const roleMarkup = roleLabel
    ? `<span class="role-pill">${escapeHtml(roleLabel)}</span>`
    : "<span>-</span>";
  const displayName = user.fullName || user.username;
  const userMeta = buildUserMeta(user);
  const isLocked = normalizeStatus(user.status) === "locked";
  const lockLabel = isLocked ? "Unlock user" : "Lock user";
  const lockPath = isLocked
    ? "M17 10V8a5 5 0 0 0-10 0h2a3 3 0 1 1 6 0v2H5v10h14V10h-2Zm-5 7a2 2 0 1 1 2-2 2 2 0 0 1-2 2Z"
    : "M17 10V8a5 5 0 1 0-10 0v2H5v10h14V10h-2Zm-8 0V8a3 3 0 1 1 6 0v2H9Zm3 7a2 2 0 1 1 2-2 2 2 0 0 1-2 2Z";
  const offset = (state.currentPage - 1) * state.limit;
  const canResendInvite = Boolean(user?.email) && !user?.emailVerifiedAt;
  const resendInviteButton = canResendInvite
    ? `
          <button class="action-button" type="button" data-action="resend-invite" data-id="${userId}" aria-label="Resend activation email">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.8A1.8 1.8 0 0 1 4.8 5h14.4A1.8 1.8 0 0 1 21 6.8v10.4a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 17.2V6.8Zm2 .7v.2l7 4.7 7-4.7v-.2H5Zm14 2.1-6.4 4.3a1 1 0 0 1-1.2 0L5 9.6v7.6h14V9.6Z" fill="currentColor"/></svg>
          </button>
        `
    : "";

  return `
    <tr>
      <td>${offset + index + 1}</td>
      <td>
        <div class="user-cell">
          <span class="avatar">${buildUserAvatarMarkup(user, displayName)}</span>
          <div class="user-text">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${escapeHtml(userMeta || "-")}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="roles-cell">${roleMarkup}</div>
      </td>
      <td>${formatDate(user.createdAt ?? user.joined)}</td>
      <td>
        <span class="status-pill ${statusClassName(user.status)}">${formatStatus(user.status)}</span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="action-button" type="button" data-action="edit" data-id="${userId}" aria-label="Edit user">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17.3 9.9-9.9 2.7 2.7L6.7 20H4v-2.7Zm14.7-8.6-1.4 1.4-2.7-2.7L16 6a1.8 1.8 0 0 1 2.7 0l1.4 1.4a1 1 0 0 1 0 1.3Z" fill="currentColor"/></svg>
          </button>
          ${resendInviteButton}
          <button class="action-button" type="button" data-action="toggle-lock" data-id="${userId}" aria-label="${lockLabel}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${lockPath}" fill="currentColor"/></svg>
          </button>
          <button class="action-button danger" type="button" data-action="delete" data-id="${userId}" aria-label="Delete user">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 1h4v2H4V4h4L9 3Zm10 4H5l1 14h12L19 7Zm-7 2v10H10V9h2Zm4 0v10h-2V9h2Z" fill="currentColor"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderTable() {
  if (state.users.length === 0) {
    elements.tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Khong co nguoi dung nao phu hop voi bo loc hien tai.</td>
      </tr>
    `;
    elements.tableSummary.textContent = "0 user(s) total";
    return;
  }

  elements.tableBody.innerHTML = state.users.map(createTableRow).join("");
  elements.tableSummary.textContent = `${state.total} user(s) total`;
}

function renderPageInfo() {
  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Trang ${state.currentPage} / ${state.totalPages}`;
  }
}

function renderImportResult(result) {
  if (!elements.importResultModal) {
    return;
  }

  const summary = result?.summary ?? {};
  const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
  const failures = Array.isArray(result?.failures) ? result.failures : [];
  const statItems = [
    `Sheet: ${summary.sheetName || "-"}`,
    `Tong dong: ${summary.totalRows ?? 0}`,
    `Thanh cong: ${summary.createdCount ?? 0}`,
    `That bai: ${summary.failedCount ?? 0}`
  ];

  elements.importResultMessage.textContent = result?.message || "Import user da hoan tat.";
  elements.importResultStats.innerHTML = statItems
    .map((label) => `<span class="import-stat-chip">${escapeHtml(label)}</span>`)
    .join("");

  if (warnings.length > 0) {
    elements.importWarningSection.hidden = false;
    elements.importWarningList.innerHTML = warnings
      .map((warning) => `<li>${escapeHtml(warning)}</li>`)
      .join("");
  } else {
    elements.importWarningSection.hidden = true;
    elements.importWarningList.innerHTML = "";
  }

  if (failures.length > 0) {
    elements.importFailureSection.hidden = false;
    elements.importFailureList.innerHTML = failures
      .map((failure) => {
        const identity = [failure.username, failure.email].filter(Boolean).join(" / ");
        const prefix = identity
          ? `Dong ${failure.row} (${identity})`
          : `Dong ${failure.row}`;

        return `<li><strong>${escapeHtml(prefix)}:</strong> ${escapeHtml(failure.reason || "Khong ro loi")}</li>`;
      })
      .join("");
  } else {
    elements.importFailureSection.hidden = true;
    elements.importFailureList.innerHTML = "";
  }

  openImportResultModal();
}

function openModal(user, options = {}) {
  const modalMode = options.mode === "profile" ? "profile" : "user";
  const isProfileMode = modalMode === "profile";
  const isEditing = Boolean(user);
  const isCreateMode = !isEditing && !isProfileMode;

  state.modalMode = modalMode;
  state.editingId = user ? (user._id ?? user.id) : null;
  elements.modalTitleText.textContent = isProfileMode
    ? "Cap nhat thong tin ca nhan"
    : isEditing
      ? "Cap nhat nguoi dung"
      : "Them nguoi dung moi";
  elements.fullNameInput.value = user?.fullName || "";
  elements.usernameInput.value = user?.username || "";
  elements.emailInput.value = user?.email || "";
  elements.phoneInput.value = user?.phone || "";
  elements.avatarUrlInput.value = user?.avatarUrl || "";
  elements.usernameInput.readOnly = isEditing || isProfileMode;
  elements.usernameInput.setAttribute("aria-readonly", String(isEditing || isProfileMode));
  elements.emailInput.readOnly = isProfileMode;
  elements.emailInput.setAttribute("aria-readonly", String(isProfileMode));
  elements.emailInput.required = isCreateMode;
  elements.passwordInput.value = "";
  elements.passwordInput.required = false;
  elements.passwordInput.placeholder = isEditing || isProfileMode
    ? "De trong neu khong doi mat khau"
    : "Nhap mat khau...";
  if (elements.passwordField) {
    elements.passwordField.hidden = isCreateMode;
  }
  if (elements.statusField) {
    elements.statusField.hidden = isProfileMode || isCreateMode;
  }
  if (elements.roleField) {
    elements.roleField.hidden = isProfileMode;
  }
  if (elements.userFormModeNotice) {
    elements.userFormModeNotice.hidden = false;
    elements.userFormModeNotice.textContent = isProfileMode
      ? "Ban co the cap nhat ho ten, so dien thoai, avatar va doi mat khau. Email, username, role va status duoc khoa trong che do nay."
      : isCreateMode
        ? "Tai khoan moi se duoc tao o trang thai inactive. He thong se gui email kich hoat de nguoi dung tu dat mat khau va kich hoat tai khoan."
        : "Admin co the cap nhat thong tin, role, status va dat lai mat khau khi can.";
  }
  if (elements.usernameHint) {
    elements.usernameHint.textContent = isEditing || isProfileMode
      ? "Username da co dinh va khong the chinh sua"
      : "Username se khong the thay doi sau khi tao";
  }
  if (elements.passwordHint) {
    elements.passwordHint.textContent = isCreateMode
      ? "Nguoi dung se tu dat mat khau trong email kich hoat."
      : isEditing || isProfileMode
      ? "De trong neu khong doi mat khau. Neu co doi, mat khau phai gom 8-64 ky tu, co chu hoa, chu thuong, so va ky tu dac biet"
      : "8-64 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet";
  }
  if (elements.modalSubmitText) {
    elements.modalSubmitText.textContent = isProfileMode
      ? "Luu thong tin"
      : isCreateMode
        ? "Tao va gui kich hoat"
        : "Luu nguoi dung";
  }
  elements.statusInput.value = normalizeStatus(user?.status || "inactive") || "inactive";
  renderRoleOptions(user ? getUserRoleValue(user) : getDefaultRoleValue());
  elements.statusInput.disabled = isProfileMode;
  elements.roleInput.disabled = isProfileMode;
  clearModalError();

  elements.userModal.hidden = false;
  elements.modalBackdrop.hidden = false;

  requestAnimationFrame(() => {
    elements.userModal.classList.add("is-open");
    elements.modalBackdrop.classList.add("is-open");
    elements.userModal.setAttribute("aria-hidden", "false");
  });

  elements.fullNameInput.focus();
}

function closeModal() {
  elements.userModal.classList.remove("is-open");
  elements.modalBackdrop.classList.remove("is-open");
  elements.userModal.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    elements.userModal.hidden = true;
    elements.modalBackdrop.hidden = true;
  }, 220);

  elements.userForm.reset();
  elements.usernameInput.readOnly = false;
  elements.usernameInput.setAttribute("aria-readonly", "false");
  elements.emailInput.readOnly = false;
  elements.emailInput.setAttribute("aria-readonly", "false");
  elements.emailInput.required = false;
  elements.statusInput.disabled = false;
  elements.roleInput.disabled = false;
  if (elements.passwordField) {
    elements.passwordField.hidden = false;
  }
  if (elements.statusField) {
    elements.statusField.hidden = false;
  }
  if (elements.roleField) {
    elements.roleField.hidden = false;
  }
  if (elements.userFormModeNotice) {
    elements.userFormModeNotice.hidden = true;
    elements.userFormModeNotice.textContent = "";
  }
  elements.passwordInput.required = false;
  if (elements.passwordInput.type === "text") {
    elements.passwordInput.type = "password";
  }
  state.editingId = null;
  state.modalMode = "user";
  renderRoleOptions(getDefaultRoleValue());
  if (elements.usernameHint) {
    elements.usernameHint.textContent = "Username cannot be changed after account creation";
  }
  if (elements.passwordHint) {
    elements.passwordHint.textContent =
      "8-64 characters, include uppercase, lowercase, number, and special character";
  }
  if (elements.modalSubmitText) {
    elements.modalSubmitText.textContent = "Luu nguoi dung";
  }
  clearModalError();
}

function setModalLoading(isLoading) {
  if (!elements.modalSubmitButton) return;

  elements.modalSubmitButton.disabled = isLoading;
  if (elements.modalSubmitText) {
    elements.modalSubmitText.textContent = isLoading
      ? "Dang luu..."
      : state.modalMode === "profile"
        ? "Luu thong tin"
        : !state.editingId
          ? "Tao va gui kich hoat"
        : "Luu nguoi dung";
  }
}

async function saveUser(event) {
  event.preventDefault();
  clearModalError();

  const isProfileMode = state.modalMode === "profile";
  const isEditing = Boolean(state.editingId);
  const isCreateMode = !isEditing && !isProfileMode;
  const targetUserId = state.editingId;
  const fullName = elements.fullNameInput.value.trim();
  const username = elements.usernameInput.value.trim();
  const email = elements.emailInput.value.trim();
  const phone = elements.phoneInput.value.trim();
  const avatarUrl = elements.avatarUrlInput.value.trim();
  const password = elements.passwordInput.value;
  const status = normalizeStatus(elements.statusInput.value);
  const role = elements.roleInput.value.trim();

  if (!fullName) {
    showModalError("Ho ten khong duoc de trong.");
    elements.fullNameInput.focus();
    return;
  }

  if (!isEditing && !username) {
    showModalError("Ten dang nhap khong duoc de trong.");
    elements.usernameInput.focus();
    return;
  }

  if (isCreateMode && !email) {
    showModalError("Email khong duoc de trong khi tao tai khoan.");
    elements.emailInput.focus();
    return;
  }

  if (!isProfileMode && !role) {
    showModalError("Vui long chon role cho tai khoan.");
    elements.roleInput.focus();
    return;
  }

  if (password) {
    const passwordValidationMessage = validatePasswordPolicy(password);

    if (passwordValidationMessage) {
      showModalError(passwordValidationMessage);
      elements.passwordInput.focus();
      return;
    }
  }

  const payload = {
    fullName,
    phone,
    avatarUrl
  };

  if (isCreateMode) {
    payload.email = email;
    payload.role = role;
  } else if (!isProfileMode) {
    payload.email = email;
    payload.status = status;
    payload.role = role;
  }

  if (isCreateMode) {
    payload.username = username;
  }

  if (password) {
    payload.password = password;
  }

  setModalLoading(true);

  try {
    if (isProfileMode) {
      const result = await API.updateCurrentUser(payload);
      if (!result) return;
      syncCurrentUser(result?.data ?? result);
      showToast(result.message || "Cap nhat thong tin ca nhan thanh cong!");
    } else if (isEditing) {
      const result = await API.updateUser(state.editingId, payload);
      if (!result) return;
      showToast(result.message || "Cap nhat nguoi dung thanh cong!");
    } else {
      const result = await API.createUser(payload);
      if (!result) return;
      showToast(result.message || "Tao tai khoan va gui email kich hoat thanh cong!");
    }

    closeModal();
    if (isProfileMode) {
      await fetchCurrentUser({ silent: true });
    } else if (isEditing && targetUserId && targetUserId === state.currentUser?._id) {
      await fetchCurrentUser({ silent: true });
    }
    await fetchAndRenderUsers();
  } catch (err) {
    showModalError(err.message || (isProfileMode ? "Luu thong tin that bai." : "Luu nguoi dung that bai."));
    console.error(err);
  } finally {
    setModalLoading(false);
  }
}

async function handleTableClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const userId = actionButton.dataset.id;
  const action = actionButton.dataset.action;

  if (action === "edit") {
    try {
      const result = await API.getUserById(userId);
      if (!result) return;
      openModal(result?.data ?? result);
    } catch (err) {
      showToast(err.message || "Khong the tai thong tin nguoi dung.", "error");
      console.error(err);
    }
    return;
  }

  if (action === "toggle-lock") {
    const user = state.users.find((item) => (item._id ?? item.id) === userId);
    if (!user) return;

    const isLocked = normalizeStatus(user.status) === "locked";
    const confirmMessage = isLocked
      ? `Mo khoa tai khoan "${user.username}"?`
      : `Khoa tai khoan "${user.username}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      if (isLocked) {
        const result = await API.unlockUser(userId);
        if (!result) return;
        showToast("Mo khoa tai khoan thanh cong!");
      } else {
        const result = await API.lockUser(userId);
        if (!result) return;
        showToast("Khoa tai khoan thanh cong!");
      }

      await fetchAndRenderUsers();
    } catch (err) {
      showToast(err.message || "Thao tac that bai.", "error");
      console.error(err);
    }
    return;
  }

  if (action === "resend-invite") {
    const user = state.users.find((item) => (item._id ?? item.id) === userId);

    if (!user?.email) {
      showToast("Tai khoan nay chua co email de gui kich hoat.", "error");
      return;
    }

    if (!confirm(`Gui lai email kich hoat cho "${user.email}"?`)) {
      return;
    }

    try {
      const result = await API.resendInvite(userId);
      if (!result) return;
      showToast(result.message || "Gui lai email kich hoat thanh cong!");
      await fetchAndRenderUsers();
    } catch (err) {
      showToast(err.message || "Gui lai email kich hoat that bai.", "error");
      console.error(err);
    }
    return;
  }

  if (action === "delete") {
    const user = state.users.find((item) => (item._id ?? item.id) === userId);
    if (!confirm(`Xoa nguoi dung "${user?.username}"? Hanh dong nay khong the hoan tac.`)) {
      return;
    }

    try {
      const result = await API.deleteUser(userId);
      if (!result) return;
      showToast("Xoa nguoi dung thanh cong!");
      await fetchAndRenderUsers();
    } catch (err) {
      showToast(err.message || "Xoa nguoi dung that bai.", "error");
      console.error(err);
    }
  }
}

async function openCurrentUserProfileModal() {
  const user = state.currentUser || await fetchCurrentUser();

  if (!user) {
    return;
  }

  openModal(user, { mode: "profile" });
}

async function handleLogout(event) {
  event.stopPropagation();

  try {
    await API.logout();
    window.location.href = "/login";
  } catch (error) {
    showToast(error.message || "Dang xuat that bai.", "error");
    console.error(error);
  }
}

async function handleImportInputChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    showToast("Chi ho tro file Excel .xlsx hoac .xls.", "error");
    event.target.value = "";
    return;
  }

  setImportLoading(true);

  try {
    const result = await API.importUsers(file);
    if (!result) return;

    const importData = {
      ...(result?.data ?? {}),
      message: result.message
    };
    const createdCount = importData.summary?.createdCount ?? 0;
    const failedCount = importData.summary?.failedCount ?? 0;

    renderImportResult(importData);
    showToast(
      result.message || "Import user thanh cong.",
      createdCount === 0 && failedCount > 0 ? "error" : "success"
    );

    if (createdCount > 0) {
      await fetchAndRenderUsers();
    }
  } catch (error) {
    showToast(error.message || "Import user that bai.", "error");
    console.error(error);
  } finally {
    setImportLoading(false);
    event.target.value = "";
  }
}

let searchDebounceTimer = null;

function bindEvents() {
  elements.openUserModalButton?.addEventListener("click", () => openModal(null));
  elements.openUserImportButton?.addEventListener("click", () => {
    if (state.importing) {
      return;
    }

    elements.userImportInput?.click();
  });
  elements.userImportInput?.addEventListener("change", handleImportInputChange);
  elements.closeImportResultButton?.addEventListener("click", hideImportResult);
  elements.importResultBackdrop?.addEventListener("click", hideImportResult);
  elements.closeUserModalButton?.addEventListener("click", closeModal);
  elements.cancelModalButton?.addEventListener("click", closeModal);
  elements.modalBackdrop?.addEventListener("click", closeModal);
  elements.userForm?.addEventListener("submit", saveUser);
  elements.tableBody?.addEventListener("click", handleTableClick);
  elements.sidebarProfileCard?.addEventListener("click", (event) => {
    if (event.target.closest("#sidebarLogoutButton")) {
      return;
    }

    openCurrentUserProfileModal();
  });
  elements.sidebarProfileCard?.addEventListener("keydown", (event) => {
    if (event.target.closest("#sidebarLogoutButton")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCurrentUserProfileModal();
    }
  });
  elements.sidebarLogoutButton?.addEventListener("click", handleLogout);

  elements.searchInput?.addEventListener("input", (event) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.search = event.target.value.trim();
      state.currentPage = 1;
      fetchAndRenderUsers();
    }, 350);
  });

  elements.statusFilter?.addEventListener("change", (event) => {
    state.status = event.target.value;
    state.currentPage = 1;
    fetchAndRenderUsers();
  });

  elements.togglePasswordButton?.addEventListener("click", () => {
    const shouldShow = elements.passwordInput.type === "password";
    elements.passwordInput.type = shouldShow ? "text" : "password";
    elements.togglePasswordButton.setAttribute(
      "aria-label",
      shouldShow ? "Hide password" : "Show password"
    );
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.importResultModal && !elements.importResultModal.hidden) {
      hideImportResult();
      return;
    }

    if (!elements.userModal.hidden) {
      closeModal();
    }
  });
}

async function initUsersPage() {
  try {
    await loadLayoutFragments();
  } catch (error) {
    console.error("Khong the tai sidebar/header:", error);
  }

  cacheElements();
  bindEvents();

  try {
    await fetchRoles();
  } catch (error) {
    showToast(error.message || "Khong the tai danh sach vai tro.", "error");
    console.error(error);
  }

  await fetchCurrentUser({ silent: true });

  await fetchAndRenderUsers();
}

initUsersPage();

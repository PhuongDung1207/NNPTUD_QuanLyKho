const { Permission, Role, User } = require("../schemas");

const PERMISSION_CODES = {
  USER_READ_SELF: "USER_READ_SELF",
  USER_UPDATE_SELF: "USER_UPDATE_SELF",
  USER_READ: "USER_READ",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_LOCK: "USER_LOCK",
  USER_UNLOCK: "USER_UNLOCK",
  ROLE_READ: "ROLE_READ",
  PERMISSION_READ: "PERMISSION_READ"
};

const permissionDefinitions = [
  {
    name: "Read Own User Profile",
    code: PERMISSION_CODES.USER_READ_SELF,
    module: "users",
    action: "read:self",
    description: "Allow a user to view their own account profile"
  },
  {
    name: "Update Own User Profile",
    code: PERMISSION_CODES.USER_UPDATE_SELF,
    module: "users",
    action: "update:self",
    description: "Allow a user to update their own account profile"
  },
  {
    name: "Read Users",
    code: PERMISSION_CODES.USER_READ,
    module: "users",
    action: "read",
    description: "Allow viewing the users list and user details"
  },
  {
    name: "Create Users",
    code: PERMISSION_CODES.USER_CREATE,
    module: "users",
    action: "create",
    description: "Allow creating new user accounts"
  },
  {
    name: "Update Users",
    code: PERMISSION_CODES.USER_UPDATE,
    module: "users",
    action: "update",
    description: "Allow updating existing user accounts"
  },
  {
    name: "Delete Users",
    code: PERMISSION_CODES.USER_DELETE,
    module: "users",
    action: "delete",
    description: "Allow deleting user accounts"
  },
  {
    name: "Lock Users",
    code: PERMISSION_CODES.USER_LOCK,
    module: "users",
    action: "lock",
    description: "Allow locking user accounts"
  },
  {
    name: "Unlock Users",
    code: PERMISSION_CODES.USER_UNLOCK,
    module: "users",
    action: "unlock",
    description: "Allow unlocking user accounts"
  },
  {
    name: "Read Roles",
    code: PERMISSION_CODES.ROLE_READ,
    module: "roles",
    action: "read",
    description: "Allow viewing system roles"
  },
  {
    name: "Read Permissions",
    code: PERMISSION_CODES.PERMISSION_READ,
    module: "permissions",
    action: "read",
    description: "Allow viewing system permissions"
  }
];

const roleDefinitions = [
  {
    name: "admin",
    code: "ADMIN",
    description: "Administrator role with full user and access-control management",
    permissionCodes: Object.values(PERMISSION_CODES)
  },
  {
    name: "user",
    code: "USER",
    description: "Standard user role with read/update access to own profile only",
    permissionCodes: [PERMISSION_CODES.USER_READ_SELF, PERMISSION_CODES.USER_UPDATE_SELF]
  }
];

let seedPromise = null;

async function seedPermissions() {
  const permissions = await Promise.all(
    permissionDefinitions.map((definition) =>
      Permission.findOneAndUpdate(
        { code: definition.code },
        { $set: definition },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      )
    )
  );

  return new Map(permissions.map((permission) => [permission.code, permission]));
}

async function seedRoles(permissionMap) {
  return Promise.all(
    roleDefinitions.map((definition) => {
      const permissions = definition.permissionCodes
        .map((permissionCode) => permissionMap.get(permissionCode)?._id)
        .filter(Boolean);

      return Role.findOneAndUpdate(
        { name: definition.name },
        {
          $set: {
            name: definition.name,
            code: definition.code,
            description: definition.description,
            permissions
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    })
  );
}

async function getAvailableUsername(baseUsername) {
  let candidate = baseUsername;
  let counter = 0;

  while (await User.exists({ username: candidate })) {
    counter += 1;
    candidate = `${baseUsername}${counter}`;
  }

  return candidate;
}

function parseEmailAddress(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const separatorIndex = normalizedEmail.lastIndexOf("@");

  if (separatorIndex <= 0 || separatorIndex === normalizedEmail.length - 1) {
    return null;
  }

  return {
    localPart: normalizedEmail.slice(0, separatorIndex),
    domain: normalizedEmail.slice(separatorIndex + 1)
  };
}

async function getAvailableEmail(baseEmail, fallbackUsername) {
  const parsedBaseEmail = parseEmailAddress(baseEmail);
  const fallbackEmail = `${fallbackUsername}@warehouse.local`;
  const parsedFallbackEmail = parseEmailAddress(fallbackEmail);
  const parsedEmail = parsedBaseEmail || parsedFallbackEmail;

  if (!parsedEmail) {
    return null;
  }

  let candidate = `${parsedEmail.localPart}@${parsedEmail.domain}`;
  let counter = 0;

  while (await User.exists({ email: candidate })) {
    counter += 1;
    candidate = `${parsedEmail.localPart}${counter}@${parsedEmail.domain}`;
  }

  return candidate;
}

async function ensureDefaultAdminUser() {
  const adminRole = await Role.findOne({ name: "admin" });

  if (!adminRole) {
    return null;
  }

  const adminExists = await User.exists({
    role: adminRole._id,
    deletedAt: null
  });

  if (adminExists) {
    return null;
  }

  const baseUsername = String(process.env.DEFAULT_ADMIN_USERNAME || "admin").trim().toLowerCase();
  const username = await getAvailableUsername(baseUsername || "admin");
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123456";
  const fullName = process.env.DEFAULT_ADMIN_FULLNAME || "System Administrator";
  const preferredEmail = process.env.DEFAULT_ADMIN_EMAIL || "";
  const email = await getAvailableEmail(preferredEmail, username);
  const now = new Date();

  await User.create({
    username,
    password,
    fullName,
    email,
    status: "active",
    emailVerifiedAt: now,
    role: adminRole._id
  });

  return {
    username,
    password,
    email
  };
}

async function seedAccessControlInternal() {
  const permissionMap = await seedPermissions();
  await seedRoles(permissionMap);
  const seededAdmin = await ensureDefaultAdminUser();

  if (seededAdmin) {
    console.log(
      `Seeded default admin account: username=${seededAdmin.username}, password=${seededAdmin.password}, email=${seededAdmin.email}`
    );
  }
}

function seedAccessControl() {
  if (!seedPromise) {
    seedPromise = seedAccessControlInternal().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  return seedPromise;
}

module.exports = {
  PERMISSION_CODES,
  seedAccessControl
};

const { Role, User } = require("../schemas");

const roleDefinitions = [
  {
    name: "admin",
    code: "ADMIN",
    description: "Administrator role with full system access"
  },
  {
    name: "user",
    code: "USER",
    description: "Standard user role"
  }
];

let seedPromise = null;

async function seedRoles() {
  await Promise.all(
    roleDefinitions.map((definition) =>
      Role.findOneAndUpdate(
        { name: definition.name },
        {
          $set: {
            name: definition.name,
            code: definition.code,
            description: definition.description,
            permissions: []
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      )
    )
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

async function seedRolesAndAdminInternal() {
  await seedRoles();
  const seededAdmin = await ensureDefaultAdminUser();

  if (seededAdmin) {
    console.log(
      `Seeded default admin account: username=${seededAdmin.username}, password=${seededAdmin.password}, email=${seededAdmin.email}`
    );
  }
}

function seedRolesAndAdmin() {
  if (!seedPromise) {
    seedPromise = seedRolesAndAdminInternal().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  return seedPromise;
}

module.exports = {
  seedRolesAndAdmin
};

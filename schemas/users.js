const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      maxlength: 160
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    avatarUrl: {
      type: String,
      trim: true
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active"
    },
    lastLoginAt: {
      type: Date
    }
  },
  schemaOptions
);

userSchema.pre("save", async function hashPasswordBeforeSave(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.pre("findOneAndUpdate", async function hashPasswordBeforeUpdate(next) {
  const update = this.getUpdate();
  const nextPassword = update?.password || update?.$set?.password;

  if (!nextPassword) {
    return next();
  }

  const hashedPassword = await bcrypt.hash(nextPassword, 10);

  if (update.password) {
    update.password = hashedPassword;
  }

  if (update.$set?.password) {
    update.$set.password = hashedPassword;
  }

  return next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);


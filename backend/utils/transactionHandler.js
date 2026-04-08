const mongoose = require("mongoose");

/**
 * Checks if the current MongoDB connection supports transactions (i.e., is a replica set or mongos).
 * @returns {Promise<boolean>}
 */
async function supportsTransactions() {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ replSetGetStatus: 1 });
    return !!status.ok;
  } catch (error) {
    // If replSetGetStatus fails, it's likely a standalone instance.
    return false;
  }
}

/**
 * Executes a function within a transaction if supported, otherwise executes it normally.
 * 
 * @param {Function} fn - The function to execute. Receives (session) as argument.
 * @returns {Promise<any>} - The result of the function.
 */
async function withTransaction(fn) {
  const isReplicaSet = await supportsTransactions();

  if (!isReplicaSet) {
    // Fallback for standalone: Execute without session/transaction
    return fn(null);
  }

  // Handle replica set with standard transaction logic
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  withTransaction,
  supportsTransactions
};

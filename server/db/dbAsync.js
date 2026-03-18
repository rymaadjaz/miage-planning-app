const { getDbConnection } = require("./database");

const dbAll = async (sql, params = []) => {
  const db = await getDbConnection();
  try {
    return await db.all(sql, params);
  } finally {
    await db.close();
  }
};

const dbGet = async (sql, params = []) => {
  const db = await getDbConnection();
  try {
    return await db.get(sql, params);
  } finally {
    await db.close();
  }
};

const dbRun = async (sql, params = []) => {
  const db = await getDbConnection();
  try {
    const result = await db.run(sql, params);
    return {
      lastID: result.lastID,
      changes: result.changes,
    };
  } finally {
    await db.close();
  }
};

const dbExec = async (sql) => {
  const db = await getDbConnection();
  try {
    return await db.exec(sql);
  } finally {
    await db.close();
  }
};

module.exports = {
  dbAll,
  dbGet,
  dbRun,
  dbExec,
};
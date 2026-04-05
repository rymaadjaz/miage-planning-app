const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

let notificationSchemaReady = false;

async function ensureNotificationSchema() {
  if (notificationSchemaReady) return;

  const columns = await dbAll(`PRAGMA table_info(Notification)`);
  const hasCohorteId = Array.isArray(columns)
    ? columns.some((column) => String(column.name) === "cohorte_id")
    : false;

  if (!hasCohorteId) {
    await dbRun(`ALTER TABLE Notification ADD COLUMN cohorte_id INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL`);
  }

  notificationSchemaReady = true;
}

exports.findAllByRole = async (role, { cohorteId = null } = {}) => {
  await ensureNotificationSchema();

  if (role === "etudiant" && Number.isInteger(cohorteId)) {
    return dbAll(
      `
      SELECT id, role, status, titre, message, date, iconType, cohorte_id
      FROM Notification
      WHERE role = ?
        AND (cohorte_id IS NULL OR cohorte_id = ?)
      ORDER BY date DESC
      `,
      [role, cohorteId]
    );
  }

  return dbAll(
    `
    SELECT id, role, status, titre, message, date, iconType, cohorte_id
    FROM Notification
    WHERE role = ?
    ORDER BY date DESC
    `,
    [role]
  );
};

exports.findById = async (id) => {
  await ensureNotificationSchema();

  return dbGet(
    `
    SELECT id, role, status, titre, message, date, iconType, cohorte_id
    FROM Notification
    WHERE id = ?
    `,
    [id]
  );
};

exports.create = async ({ role, status, titre, message, date, iconType, cohorte_id = null }) => {
  await ensureNotificationSchema();

  return dbRun(
    `
    INSERT INTO Notification (role, status, titre, message, date, iconType, cohorte_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [role, status, titre, message, date, iconType, cohorte_id]
  );
};

exports.updateStatus = async (id, status) => {
  await ensureNotificationSchema();

  return dbRun(
    `
    UPDATE Notification
    SET status = ?
    WHERE id = ?
    `,
    [status, id]
  );
};

exports.remove = async (id) => {
  await ensureNotificationSchema();

  return dbRun(
    `
    DELETE FROM Notification
    WHERE id = ?
    `,
    [id]
  );
};
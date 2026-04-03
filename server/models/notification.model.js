const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAllByRole = (role) =>
  dbAll(
    `
    SELECT id, role, status, titre, message, date, iconType
    FROM Notification
    WHERE role = ?
    ORDER BY date DESC
    `,
    [role]
  );

exports.findById = (id) =>
  dbGet(
    `
    SELECT id, role, status, titre, message, date, iconType
    FROM Notification
    WHERE id = ?
    `,
    [id]
  );

exports.create = ({ role, status, titre, message, date, iconType }) =>
  dbRun(
    `
    INSERT INTO Notification (role, status, titre, message, date, iconType)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [role, status, titre, message, date, iconType]
  );

exports.updateStatus = (id, status) =>
  dbRun(
    `
    UPDATE Notification
    SET status = ?
    WHERE id = ?
    `,
    [status, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Notification
    WHERE id = ?
    `,
    [id]
  );
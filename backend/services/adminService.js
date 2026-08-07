const pool = require("../config/database");
const bcrypt = require("bcryptjs");

// ==============================
// USER MANAGEMENT
// ==============================

const getAllUsers = async () => {
  const [rows] = await pool.execute(`
    SELECT
      id,
      name,
      email,
      role,
      client_id,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `);

  return rows;
};

const createUser = async ({ name, email, password, role, clientId }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    `
    INSERT INTO users
    (name,email,password,role,client_id,created_at,updated_at)
    VALUES (?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())
    `,
    [name, email, hashedPassword, role, clientId],
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
    client_id: clientId,
  };
};

const updateUser = async (id, fields) => {
  const entries = Object.entries(fields).filter(
    ([, value]) => value !== undefined,
  );

  if (!entries.length) return { id };

  const sets = entries.map(([key]) => `${key}=?`).join(", ");
  const values = entries.map(([, value]) => value);

  values.push(id);

  await pool.execute(
    `
    UPDATE users
    SET ${sets},
        updated_at = UTC_TIMESTAMP()
    WHERE id = ?
    `,
    values,
  );

  return {
    id,
    ...fields,
  };
};

// Hard Delete User
const deleteUser = async (id) => {
  await pool.execute(
    `
    DELETE FROM users
    WHERE id = ?
    `,
    [id],
  );

  return { id };
};

// ==============================
// CLIENT MANAGEMENT
// ==============================

const getAllClients = async () => {
  const [rows] = await pool.execute(`
    SELECT *
    FROM clients
    ORDER BY created_at DESC
  `);

  return rows;
};

const createClient = async ({ organizationName }) => {
  const [result] = await pool.execute(
    `
    INSERT INTO clients
    (organization_name,created_at,updated_at)
    VALUES (?,UTC_TIMESTAMP(),UTC_TIMESTAMP())
    `,
    [organizationName],
  );

  return {
    id: result.insertId,
    organization_name: organizationName,
  };
};

const updateClient = async (id, organizationName) => {
  await pool.execute(
    `
    UPDATE clients
    SET organization_name=?,
        updated_at=UTC_TIMESTAMP()
    WHERE id=?
    `,
    [organizationName, id],
  );

  return {
    id,
    organization_name: organizationName,
  };
};

// Hard Delete Client
const deleteClient = async (id) => {
  await pool.execute(
    `
    DELETE FROM clients
    WHERE id = ?
    `,
    [id],
  );

  return { id };
};

// ==============================
// DASHBOARD
// ==============================

const getDashboardStats = async () => {
  const [[users]] = await pool.execute(`
    SELECT COUNT(*) AS totalUsers
    FROM users
  `);

  const [[clients]] = await pool.execute(`
    SELECT COUNT(*) AS totalClients
    FROM clients
  `);

  const [[agents]] = await pool.execute(`
    SELECT COUNT(*) AS totalAgents
    FROM users
    WHERE role='agent'
  `);

  const [[tickets]] = await pool.execute(`
    SELECT COUNT(*) AS totalTickets
    FROM tickets
    WHERE is_deleted=0
  `);

  const [[open]] = await pool.execute(`
    SELECT COUNT(*) AS openTickets
    FROM tickets
    WHERE status='open'
    AND is_deleted=0
  `);

  const [[pending]] = await pool.execute(`
    SELECT COUNT(*) AS pendingTickets
    FROM tickets
    WHERE status='pending'
    AND is_deleted=0
  `);

  const [[closed]] = await pool.execute(`
    SELECT COUNT(*) AS closedTickets
    FROM tickets
    WHERE status='closed'
    AND is_deleted=0
  `);

  return {
    totalUsers: users.totalUsers,
    totalClients: clients.totalClients,
    totalAgents: agents.totalAgents,
    totalTickets: tickets.totalTickets,
    openTickets: open.openTickets,
    pendingTickets: pending.pendingTickets,
    closedTickets: closed.closedTickets,
  };
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  getDashboardStats,
};

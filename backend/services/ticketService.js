const pool = require("../config/database");
const { calculateSlaDueDate, formatSlaStatus } = require("../utils/sla");

// ==============================
// Create Ticket
// ==============================
const createTicket = async ({
  title,
  description,
  priority,
  clientId,
  attachmentPath = null,
}) => {
  const dueDate = calculateSlaDueDate(priority);

  const [result] = await pool.execute(
    `INSERT INTO tickets
    (title, description, attachment_path, priority, status, client_id, sla_due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [title, description, attachmentPath, priority, "open", clientId, dueDate],
  );

  return {
    id: result.insertId,
    title,
    description,
    attachment_path: attachmentPath,
    priority,
    status: "open",
    client_id: clientId,
    sla_due_date: dueDate,
  };
};

// ==============================
// Get Tickets (Pagination)
// ==============================
const getTicketsForUser = async (user, page = 1, limit = 10, search = "") => {
  const offset = (page - 1) * limit;

  let where = `WHERE t.is_deleted = 0`;
  const params = [];

  if (user.role === "client") {
    where += " AND t.client_id = ?";
    params.push(user.client_id);
  } else if (user.role === "agent") {
    where += " AND (t.assigned_agent_id = ? OR t.assigned_agent_id IS NULL)";
    params.push(user.id);
  }

  // Search by title or description
  if (search) {
    where += `
      AND (
        t.title LIKE ?
        OR t.description LIKE ?
      )
    `;

    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM tickets t
      JOIN clients c ON c.id = t.client_id
      ${where}
    `,
    params,
  );

  const total = countRows[0].total;

  const safeLimit = Number(limit);
  const safeOffset = Number(offset);

  const [rows] = await pool.execute(
    `
    SELECT
      t.*,
      c.organization_name
    FROM tickets t
    JOIN clients c
      ON c.id = t.client_id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
    `,
    params,
  );

  return {
    tickets: rows.map((ticket) => ({
      ...ticket,
      sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status),
    })),

    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ==============================
// Assigned Tickets
// ==============================
const getAssignedTickets = async (user, search = "") => {
  let query = `
    SELECT
      t.*,
      c.organization_name
    FROM tickets t
    JOIN clients c
      ON c.id = t.client_id
    WHERE
      t.assigned_agent_id = ?
      AND t.is_deleted = 0
  `;

  const params = [user.id];

  if (search) {
    query += `
      AND (
        t.title LIKE ?
        OR t.description LIKE ?
      )
    `;

    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  query += `
    ORDER BY t.created_at DESC
  `;

  const [rows] = await pool.execute(query, params);

  return rows.map((ticket) => ({
    ...ticket,
    sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status),
  }));
};

// ==============================
// Unassigned Tickets
// ==============================
const getUnassignedTickets = async (search = "") => {
  let query = `
    SELECT
      t.*,
      c.organization_name
    FROM tickets t
    JOIN clients c
      ON c.id = t.client_id
    WHERE
      t.assigned_agent_id IS NULL
      AND t.is_deleted = 0
  `;

  const params = [];

  if (search) {
    query += `
      AND (
        t.title LIKE ?
        OR t.description LIKE ?
      )
    `;

    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  query += `
    ORDER BY t.created_at DESC
  `;

  const [rows] = await pool.execute(query, params);

  return rows.map((ticket) => ({
    ...ticket,
    sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status),
  }));
};

// ==============================
// Get Ticket By ID
// ==============================
const getTicketById = async (id, user) => {
  const [rows] = await pool.execute(
    `
    SELECT
      t.*,
      c.organization_name
    FROM tickets t
    JOIN clients c
      ON c.id = t.client_id
    WHERE
      t.id = ?
      AND t.is_deleted = 0
    `,
    [id],
  );

  if (!rows.length) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const ticket = rows[0];

  // Client can only view their own tickets
  if (user.role === "client" && ticket.client_id !== user.client_id) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  // Agent can only view tickets assigned to them
  // OR currently unassigned tickets
  if (
    user.role === "agent" &&
    ticket.assigned_agent_id !== null &&
    ticket.assigned_agent_id !== user.id
  ) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  return {
    ...ticket,
    sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status),
  };
};

// ==============================
// Add Comment
// ==============================
const addComment = async ({
  ticketId,
  userId,
  message,
  isInternal = false,
  attachmentPath = null,
}) => {
  try {
    await pool.execute(
      `INSERT INTO comments
      (ticket_id, user_id, message, attachment_path, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [ticketId, userId, message, attachmentPath, isInternal],
    );
  } catch (err) {
    console.error("INSERT COMMENT ERROR:");
    console.error(err);
    throw err;
  }

  // Fetch ticket, client and assigned agent details
  const [rows] = await pool.execute(
    `SELECT
        t.id,
        t.title,

        client.name AS clientName,
        client.email AS clientEmail,

        agent.name AS agentName,
        agent.email AS agentEmail

     FROM tickets t

     JOIN clients c
       ON t.client_id = c.id

     LEFT JOIN users client
       ON client.client_id = c.id
       AND client.role = 'client'

     LEFT JOIN users agent
       ON agent.id = t.assigned_agent_id

     WHERE t.id = ?

     LIMIT 1`,
    [ticketId],
  );

  if (!rows.length) {
    throw new Error("Ticket not found");
  }

  return {
    ticket_id: ticketId,
    user_id: userId,
    title: rows[0].title,
    message,
    attachment_path: attachmentPath,
    is_internal: isInternal,

    clientName: rows[0].clientName,
    clientEmail: rows[0].clientEmail,

    agentName: rows[0].agentName,
    agentEmail: rows[0].agentEmail,
  };
};

// ==============================
// Get Comments
// ==============================
const getComments = async (ticketId, user) => {
  let query = `
    SELECT c.*, u.name
    FROM comments c
    JOIN users u
      ON u.id = c.user_id
    WHERE c.ticket_id = ?
  `;

  const params = [ticketId];

  // Client must never see internal notes
  if (user.role === "client") {
    query += " AND c.is_internal = 0";
  }

  query += " ORDER BY c.created_at ASC";

  const [rows] = await pool.execute(query, params);

  return rows;
};

// ==============================
// Update Ticket Status
// ==============================
// ==============================
// Update Ticket Status
// ==============================
const updateTicketStatus = async (id, status, user) => {
  // First find the ticket
  const [ticketRows] = await pool.execute(
    `
    SELECT
      t.id,
      t.title,
      t.status,
      t.client_id,
      t.assigned_agent_id
    FROM tickets t
    WHERE
      t.id = ?
      AND t.is_deleted = 0
    LIMIT 1
    `,
    [id],
  );

  // Ticket does not exist
  if (!ticketRows.length) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const ticket = ticketRows[0];

  // Only admin or agent can change status
  if (user.role !== "admin" && user.role !== "agent") {
    const error = new Error("Only admin or agent can change ticket status");
    error.statusCode = 403;
    throw error;
  }

  // Agent can change status only for their assigned ticket
  if (
    user.role === "agent" &&
    Number(ticket.assigned_agent_id) !== Number(user.id)
  ) {
    const error = new Error("You are not authorized to update this ticket");
    error.statusCode = 403;
    throw error;
  }

  // Update status
  await pool.execute(
    `
    UPDATE tickets
    SET
      status = ?,
      updated_at = UTC_TIMESTAMP()
    WHERE
      id = ?
      AND is_deleted = 0
    `,
    [status, id],
  );

  // Get client details for notification email
  const [rows] = await pool.execute(
    `
    SELECT
      t.id,
      t.title,
      t.status,
      u.name,
      u.email
    FROM tickets t
    JOIN clients c
      ON t.client_id = c.id
    JOIN users u
      ON u.client_id = c.id
    WHERE
      t.id = ?
      AND u.role = 'client'
    LIMIT 1
    `,
    [id],
  );

  if (!rows.length) {
    const error = new Error("Client not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: rows[0].id,
    title: rows[0].title,
    status: rows[0].status,
    clientName: rows[0].name,
    clientEmail: rows[0].email,
  };
};

// ==============================
// Assign Ticket
// ==============================
const assignTicket = async (id, assignedAgentId) => {
  // ==============================
  // Verify selected user is an Agent
  // ==============================
  const [agents] = await pool.execute(
    `SELECT
        id,
        name,
        email
     FROM users
     WHERE id = ?
       AND role = 'agent'`,
    [assignedAgentId],
  );

  if (!agents.length) {
    const error = new Error("Selected user is not a valid agent");

    error.statusCode = 400;

    throw error;
  }

  // ==============================
  // Verify ticket exists
  // ==============================
  const [tickets] = await pool.execute(
    `SELECT id
     FROM tickets
     WHERE id = ?
       AND is_deleted = 0`,
    [id],
  );

  if (!tickets.length) {
    const error = new Error("Ticket not found");

    error.statusCode = 404;

    throw error;
  }

  // ==============================
  // Update assignment
  // ==============================
  await pool.execute(
    `UPDATE tickets
     SET assigned_agent_id = ?,
         updated_at = UTC_TIMESTAMP()
     WHERE id = ?
       AND is_deleted = 0`,
    [assignedAgentId, id],
  );

  // ==============================
  // Fetch updated ticket + agent
  // ==============================
  const [rows] = await pool.execute(
    `SELECT
        t.id,
        t.title,
        t.priority,
        t.status,

        u.id AS agentId,
        u.name AS agentName,
        u.email AS agentEmail

     FROM tickets t

     JOIN users u
       ON t.assigned_agent_id = u.id

     WHERE
       t.id = ?
       AND u.role = 'agent'
     LIMIT 1`,
    [id],
  );

  if (!rows.length) {
    const error = new Error("Ticket or Agent not found");

    error.statusCode = 404;

    throw error;
  }

  return {
    id: rows[0].id,
    assigned_agent_id: rows[0].agentId,
    agentName: rows[0].agentName,
    agentEmail: rows[0].agentEmail,
    ticketTitle: rows[0].title,
    priority: rows[0].priority,
    status: rows[0].status,
  };
};

// ==============================
// Soft Delete Ticket
// ==============================
const deleteTicket = async (id) => {
  const [result] = await pool.execute(
    `UPDATE tickets
     SET is_deleted = 1,
         updated_at = UTC_TIMESTAMP()
     WHERE id = ?
       AND is_deleted = 0`,
    [id],
  );

  if (result.affectedRows === 0) {
    const error = new Error("Ticket not found");

    error.statusCode = 404;

    throw error;
  }

  return {
    id,
    message: "Ticket deleted successfully",
  };
};

// ==============================
// Agent Dashboard Stats
// ==============================
const getAgentDashboardStats = async (agentId) => {
  const [[assigned]] = await pool.execute(
    `
    SELECT COUNT(*) AS assignedTickets
    FROM tickets
    WHERE assigned_agent_id = ?
      AND is_deleted = 0
    `,
    [agentId],
  );

  const [[pending]] = await pool.execute(
    `
    SELECT COUNT(*) AS pendingTickets
    FROM tickets
    WHERE assigned_agent_id = ?
      AND status = 'pending'
      AND is_deleted = 0
    `,
    [agentId],
  );

  const [[closed]] = await pool.execute(
    `
    SELECT COUNT(*) AS closedTickets
    FROM tickets
    WHERE assigned_agent_id = ?
      AND status = 'closed'
      AND is_deleted = 0
    `,
    [agentId],
  );

  return {
    assignedTickets: assigned.assignedTickets,
    pendingTickets: pending.pendingTickets,
    closedTickets: closed.closedTickets,
  };
};

// ==============================
// Client Dashboard Stats
// ==============================
const getClientDashboardStats = async (clientId) => {
  const [[total]] = await pool.execute(
    `
    SELECT COUNT(*) AS totalTickets
    FROM tickets
    WHERE client_id = ?
      AND is_deleted = 0
    `,
    [clientId],
  );

  const [[open]] = await pool.execute(
    `
    SELECT COUNT(*) AS openTickets
    FROM tickets
    WHERE client_id = ?
      AND status = 'open'
      AND is_deleted = 0
    `,
    [clientId],
  );

  const [[pending]] = await pool.execute(
    `
    SELECT COUNT(*) AS pendingTickets
    FROM tickets
    WHERE client_id = ?
      AND status = 'pending'
      AND is_deleted = 0
    `,
    [clientId],
  );

  const [[closed]] = await pool.execute(
    `
    SELECT COUNT(*) AS closedTickets
    FROM tickets
    WHERE client_id = ?
      AND status = 'closed'
      AND is_deleted = 0
    `,
    [clientId],
  );

  return {
    totalTickets: total.totalTickets,
    openTickets: open.openTickets,
    pendingTickets: pending.pendingTickets,
    closedTickets: closed.closedTickets,
  };
};

// ==============================
// EXPORTS
// ==============================
module.exports = {
  createTicket,
  getTicketsForUser,
  getTicketById,
  addComment,
  getComments,
  updateTicketStatus,
  assignTicket,
  deleteTicket,
  getAssignedTickets,
  getUnassignedTickets,
  getAgentDashboardStats,
  getClientDashboardStats,
};

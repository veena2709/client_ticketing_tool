const pool = require('../config/database');
const { calculateSlaDueDate, formatSlaStatus } = require('../utils/sla');

// ==============================
// Create Ticket
// ==============================
const createTicket = async ({
  title,
  description,
  priority,
  clientId,
  attachmentPath = null
}) => {
  const dueDate = calculateSlaDueDate(priority);

  const [result] = await pool.execute(
    `INSERT INTO tickets
    (title, description, attachment_path, priority, status, client_id, sla_due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [
      title,
      description,
      attachmentPath,
      priority,
      'open',
      clientId,
      dueDate
    ]
  );

  return {
    id: result.insertId,
    title,
    description,
    attachment_path: attachmentPath,
    priority,
    status: 'open',
    client_id: clientId,
    sla_due_date: dueDate
  };
};

// ==============================
// Get Tickets
// ==============================
const getTicketsForUser = async (user) => {
  let query = `
    SELECT t.*, c.organization_name
    FROM tickets t
    JOIN clients c ON c.id = t.client_id
    WHERE t.is_deleted = 0
  `;

  const params = [];

  if (user.role === 'client') {
    query += ' AND t.client_id = ?';
    params.push(user.client_id);
  } else if (user.role === 'agent') {
    query += ' AND (t.assigned_agent_id = ? OR t.assigned_agent_id IS NULL)';
    params.push(user.id);
  }

  query += ' ORDER BY t.created_at DESC';

  const [rows] = await pool.execute(query, params);

  return rows.map(ticket => ({
    ...ticket,
    sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status)
  }));
};

// ==============================
// Get Ticket By ID
// ==============================
const getTicketById = async (id, user) => {
  const [rows] = await pool.execute(
    `SELECT t.*, c.organization_name
     FROM tickets t
     JOIN clients c ON c.id = t.client_id
     WHERE t.id = ?
     AND t.is_deleted = 0`,
    [id]
  );

  if (!rows.length) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }

  const ticket = rows[0];

  if (user.role === 'client' && ticket.client_id !== user.client_id) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  if (
    user.role === 'agent' &&
    ticket.assigned_agent_id !== user.id &&
    ticket.assigned_agent_id !== null
  ) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  return {
    ...ticket,
    sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status)
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
  attachmentPath = null
}) => {

  // Insert Comment
  await pool.execute(
    `INSERT INTO comments
      (ticket_id, user_id, message, attachment_path, is_internal, created_at)
     VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [
      ticketId,
      userId,
      message,
      attachmentPath,
      isInternal
    ]
  );

  // Fetch ticket, client and assigned agent details
  const [rows] = await pool.execute(
    `SELECT
        t.id,
        t.title,

        client.name  AS clientName,
        client.email AS clientEmail,

        agent.name   AS agentName,
        agent.email  AS agentEmail

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
    [ticketId]
  );

  if (!rows.length) {
    throw new Error('Ticket not found');
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
    agentEmail: rows[0].agentEmail
  };
};

// ==============================
// Get Comments
// ==============================
const getComments = async (ticketId, user) => {
  let query = `
    SELECT c.*, u.name
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.ticket_id = ?
  `;

  const params = [ticketId];

  if (user.role === 'client') {
    query += ' AND c.is_internal = 0';
  }

  query += ' ORDER BY c.created_at ASC';

  const [rows] = await pool.execute(query, params);

  return rows;
};

// ==============================
// Update Ticket Status
// ==============================
const updateTicketStatus = async (id, status) => {

  await pool.execute(
    `UPDATE tickets
     SET status = ?,
         updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [status, id]
  );

  const [rows] = await pool.execute(
    `SELECT
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
        AND u.role='client'
     LIMIT 1`,
    [id]
  );

  if (!rows.length) {
    throw new Error("Client not found");
  }

  return {
    id: rows[0].id,
    title: rows[0].title,
    status: rows[0].status,
    clientName: rows[0].name,
    clientEmail: rows[0].email
  };
};

// ==============================
// Assign Ticket
// ==============================
const assignTicket = async (id, assignedAgentId) => {
  // Update assignment
  await pool.execute(
    `UPDATE tickets
     SET assigned_agent_id = ?,
         updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [assignedAgentId, id]
  );

  // Fetch agent and ticket details
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
     WHERE t.id = ?`,
    [id]
  );

  if (!rows.length) {
    const error = new Error('Ticket or Agent not found');
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
    status: rows[0].status
  };
};

// ==============================
// Soft Delete Ticket
// ==============================
const deleteTicket = async (id) => {
  await pool.execute(
    `UPDATE tickets
     SET is_deleted = 1,
         updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [id]
  );

  return {
    id,
    message: 'Ticket deleted successfully'
  };
};

module.exports = {
  createTicket,
  getTicketsForUser,
  getTicketById,
  addComment,
  getComments,
  updateTicketStatus,
  assignTicket,
  deleteTicket
};
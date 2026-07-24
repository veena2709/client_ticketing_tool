const pool = require('../config/database');
const { calculateSlaDueDate, formatSlaStatus } = require('../utils/sla');

const createTicket = async ({ title, description, priority, clientId }) => {
  const dueDate = calculateSlaDueDate(priority);
  const [result] = await pool.execute(
    'INSERT INTO tickets (title, description, priority, status, client_id, sla_due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())',
    [title, description, priority, 'open', clientId, dueDate]
  );

  return { id: result.insertId, title, description, priority, status: 'open', client_id: clientId, sla_due_date: dueDate };
};

const getTicketsForUser = async (user) => {
  let query = 'SELECT t.*, c.organization_name FROM tickets t JOIN clients c ON c.id = t.client_id';
  const params = [];

  if (user.role === 'client') {
    query += ' WHERE t.client_id = ?';
    params.push(user.client_id);
  } else if (user.role === 'agent') {
    query += ' WHERE (t.assigned_agent_id = ? OR t.assigned_agent_id IS NULL)';
    params.push(user.id);
  }

  query += ' ORDER BY t.created_at DESC';
  const [rows] = await pool.execute(query, params);

  return rows.map((ticket) => ({
    ...ticket,
    sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status)
  }));
};

const getTicketById = async (id, user) => {
  let query = 'SELECT t.*, c.organization_name FROM tickets t JOIN clients c ON c.id = t.client_id WHERE t.id = ?';
  const [rows] = await pool.execute(query, [id]);
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

  if (user.role === 'agent' && ticket.assigned_agent_id !== user.id && ticket.assigned_agent_id !== null) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  return { ...ticket, sla_status: formatSlaStatus(ticket.sla_due_date, ticket.status) };
};

const addComment = async ({ ticketId, userId, message, isInternal = false }) => {
  await pool.execute('INSERT INTO comments (ticket_id, user_id, message, is_internal, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())', [ticketId, userId, message, isInternal]);
  return { ticket_id: ticketId, user_id: userId, message, is_internal: isInternal };
};

const getComments = async (ticketId, user) => {
  let query = 'SELECT c.*, u.name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.ticket_id = ?';
  const params = [ticketId];

  if (user.role === 'client') {
    query += ' AND c.is_internal = 0';
  }

  const [rows] = await pool.execute(query, params);
  return rows;
};

const updateTicketStatus = async (id, status) => {
  await pool.execute('UPDATE tickets SET status = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?', [status, id]);
  return { id, status };
};

const assignTicket = async (id, assignedAgentId) => {
  await pool.execute('UPDATE tickets SET assigned_agent_id = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?', [assignedAgentId, id]);
  return { id, assigned_agent_id: assignedAgentId };
};

module.exports = { createTicket, getTicketsForUser, getTicketById, addComment, getComments, updateTicketStatus, assignTicket };

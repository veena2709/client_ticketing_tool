const { sendResponse } = require('../utils/response');
const { createTicket, getTicketsForUser, getTicketById, addComment, getComments, updateTicketStatus, assignTicket } = require('../services/ticketService');

const create = async (req, res) => {
  try {
    if (!req.user.client_id) {
      const error = new Error('User must have a client organization to create tickets');
      error.statusCode = 400;
      throw error;
    }
    const ticket = await createTicket({ title: req.body.title, description: req.body.description, priority: req.body.priority, clientId: req.user.client_id });
    return sendResponse(res, 201, true, ticket, 'Ticket created successfully');
  } catch (error) {
    return sendResponse(res, error.statusCode || 500, false, null, error.message || 'Failed to create ticket');
  }
};

const list = async (req, res) => {
  try {
    const tickets = await getTicketsForUser(req.user);
    return sendResponse(res, 200, true, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message || 'Failed to retrieve tickets');
  }
};

const detail = async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id, req.user);
    const comments = await getComments(req.params.id, req.user);
    return sendResponse(res, 200, true, { ticket, comments }, 'Ticket retrieved successfully');
  } catch (error) {
    return sendResponse(res, error.statusCode || 500, false, null, error.message || 'Failed to retrieve ticket');
  }
};

const reply = async (req, res) => {
  try {
    const comment = await addComment({ ticketId: req.params.id, userId: req.user.id, message: req.body.message, isInternal: false });
    return sendResponse(res, 201, true, comment, 'Reply added successfully');
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message || 'Failed to add reply');
  }
};

const internalNote = async (req, res) => {
  try {
    const comment = await addComment({ ticketId: req.params.id, userId: req.user.id, message: req.body.message, isInternal: true });
    return sendResponse(res, 201, true, comment, 'Internal note added successfully');
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message || 'Failed to add note');
  }
};

const status = async (req, res) => {
  try {
    const result = await updateTicketStatus(req.params.id, req.body.status);
    return sendResponse(res, 200, true, result, 'Status updated successfully');
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message || 'Failed to update status');
  }
};

const assign = async (req, res) => {
  try {
    const result = await assignTicket(req.params.id, req.body.assigned_agent_id);
    return sendResponse(res, 200, true, result, 'Ticket assigned successfully');
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message || 'Failed to assign ticket');
  }
};

module.exports = { create, list, detail, reply, internalNote, status, assign };

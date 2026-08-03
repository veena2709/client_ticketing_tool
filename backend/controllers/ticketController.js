const { sendResponse } = require('../utils/response');
const { sendEmail } = require('../utils/email');

const {
  createTicket,
  getTicketsForUser,
  getTicketById,
  addComment,
  getComments,
  updateTicketStatus,
  assignTicket,
  deleteTicket
} = require('../services/ticketService');

// ==============================
// Create Ticket
// ==============================
const create = async (req, res) => {
  try {
    if (!req.user.client_id) {
      const error = new Error(
        'User must have a client organization to create tickets'
      );
      error.statusCode = 400;
      throw error;
    }

    const ticket = await createTicket({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      clientId: req.user.client_id,
      attachmentPath: req.file ? req.file.filename : null
    });

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      subject: `Ticket Created Successfully (#${ticket.id})`,
      html: `
        <h2>Your ticket has been created successfully 🎉</h2>

        <p><strong>Ticket ID:</strong> ${ticket.id}</p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Description:</strong> ${ticket.description}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>

        <br>

        <p>Our support team will review your request shortly.</p>

        <br>

        <p>Thank you,</p>
        <b>Support Ticket Team</b>
      `
    });

    return sendResponse(
      res,
      201,
      true,
      ticket,
      'Ticket created successfully'
    );
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || 'Failed to create ticket'
    );
  }
};

// ==============================
// Get All Tickets
// ==============================
const list = async (req, res) => {
  try {
    const tickets = await getTicketsForUser(req.user);

    return sendResponse(
      res,
      200,
      true,
      tickets,
      'Tickets retrieved successfully'
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || 'Failed to retrieve tickets'
    );
  }
};

// ==============================
// Get Ticket Details
// ==============================
const detail = async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id, req.user);
    const comments = await getComments(req.params.id, req.user);

    return sendResponse(
      res,
      200,
      true,
      {
        ticket,
        comments
      },
      'Ticket retrieved successfully'
    );
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || 'Failed to retrieve ticket'
    );
  }
};


// ==============================
// Reply to Ticket
// ==============================
const reply = async (req, res) => {
  try {
    const comment = await addComment({
      ticketId: req.params.id,
      userId: req.user.id,
      message: req.body.message,
      isInternal: false,
      attachmentPath: req.file ? req.file.filename : null
    });

    // Send email notification
    if (req.user.role === 'client') {
      // Client replied → notify assigned agent
      if (comment.agentEmail) {
        await sendEmail({
          to: comment.agentEmail,
          subject: `New Reply on Ticket #${comment.ticket_id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
              <h2>Support Ticket System</h2>

              <p>Hello <strong>${comment.agentName}</strong>,</p>

              <p>A client has replied to a support ticket assigned to you.</p>

              <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;">
                <tr>
                  <td><strong>Ticket ID</strong></td>
                  <td>${comment.ticket_id}</td>
                </tr>
                <tr>
                  <td><strong>Title</strong></td>
                  <td>${comment.title}</td>
                </tr>
                <tr>
                  <td><strong>Reply</strong></td>
                  <td>${comment.message}</td>
                </tr>
              </table>

              <br>

              <p>Please login to the Support Ticket System to continue assisting the client.</p>

              <br>

              <strong>Support Ticket Team</strong>
            </div>
          `
        });
      }
    } else if (req.user.role === 'agent') {
      // Agent replied → notify client
      if (comment.clientEmail) {
        await sendEmail({
          to: comment.clientEmail,
          subject: `Update on Your Ticket #${comment.ticket_id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
              <h2>Support Ticket System</h2>

              <p>Hello <strong>${comment.clientName}</strong>,</p>

              <p>Your support ticket has received a new reply.</p>

              <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;">
                <tr>
                  <td><strong>Ticket ID</strong></td>
                  <td>${comment.ticket_id}</td>
                </tr>
                <tr>
                  <td><strong>Title</strong></td>
                  <td>${comment.title}</td>
                </tr>
                <tr>
                  <td><strong>Reply</strong></td>
                  <td>${comment.message}</td>
                </tr>
              </table>

              <br>

              <p>Please login to the Support Ticket System to view the complete conversation.</p>

              <br>

              <strong>Support Ticket Team</strong>
            </div>
          `
        });
      }
    }

    return sendResponse(
      res,
      201,
      true,
      comment,
      'Reply added successfully'
    );

  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || 'Failed to add reply'
    );
  }
};
// ==============================
// Internal Note
// ==============================
const internalNote = async (req, res) => {
  try {
    const comment = await addComment({
      ticketId: req.params.id,
      userId: req.user.id,
      message: req.body.message,
      isInternal: true,
      attachmentPath: req.file ? req.file.filename : null
    });

    return sendResponse(
      res,
      201,
      true,
      comment,
      'Internal note added successfully'
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || 'Failed to add note'
    );
  }
};

// ==============================
// Update Ticket Status
// ==============================
// ==============================
// Update Ticket Status
// ==============================
const status = async (req, res) => {
  try {
    const result = await updateTicketStatus(
      req.params.id,
      req.body.status
    );

    // Send Status Update Email
    await sendEmail({
      to: result.clientEmail,
      subject: `Ticket #${result.id} Status Updated`,
      html: `
        <h2>Hello ${result.clientName},</h2>

        <p>Your support ticket status has been updated.</p>

        <hr>

        <p><strong>Ticket ID:</strong> ${result.id}</p>
        <p><strong>Title:</strong> ${result.title}</p>
        <p><strong>New Status:</strong> ${result.status}</p>

        <br>

        <p>Thank you for using our Support Ticket System.</p>

        <p>Regards,<br>
        <strong>Support Ticket Team</strong></p>
      `
    });

    return sendResponse(
      res,
      200,
      true,
      result,
      'Status updated successfully'
    );

  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || 'Failed to update status'
    );
  }
};

// ==============================
// Assign Ticket
// ==============================
// ==============================
// Assign Ticket
// ==============================
const assign = async (req, res) => {
  try {
    const result = await assignTicket(
      req.params.id,
      req.body.assigned_agent_id
    );

    // Send email to assigned agent
    await sendEmail({
      to: result.agentEmail,
      subject: `New Ticket Assigned (#${result.id})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px;">
          <h2 style="color:#2563eb;">Support Ticket System</h2>

          <p>Hello <strong>${result.agentName}</strong>,</p>

          <p>A new support ticket has been assigned to you.</p>

          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td><strong>Ticket ID</strong></td>
              <td>#${result.id}</td>
            </tr>
            <tr>
              <td><strong>Title</strong></td>
              <td>${result.ticketTitle}</td>
            </tr>
            <tr>
              <td><strong>Priority</strong></td>
              <td>${result.priority}</td>
            </tr>
            <tr>
              <td><strong>Status</strong></td>
              <td>${result.status}</td>
            </tr>
          </table>

          <br>

          <p>Please log in to the Support Ticket System and start working on this ticket.</p>

          <br>

          <p>Regards,</p>
          <strong>Support Ticket Team</strong>
        </div>
      `
    });

    return sendResponse(
      res,
      200,
      true,
      result,
      'Ticket assigned successfully'
    );

  } catch (error) {
    console.error('Assignment Error:', error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || 'Failed to assign ticket'
    );
  }
};

// ==============================
// Soft Delete Ticket
// ==============================
const remove = async (req, res) => {
  try {
    const result = await deleteTicket(req.params.id);

    return sendResponse(
      res,
      200,
      true,
      result,
      'Ticket deleted successfully'
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || 'Failed to delete ticket'
    );
  }
};

module.exports = {
  create,
  list,
  detail,
  reply,
  internalNote,
  status,
  assign,
  remove
};
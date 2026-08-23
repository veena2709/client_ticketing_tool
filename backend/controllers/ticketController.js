const { sendResponse } = require("../utils/response");
const { sendEmail } = require("../utils/email");

const {
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
} = require("../services/ticketService");

// ==============================
// Helper - Escape HTML
// ==============================
const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ==============================
// Create Ticket
// ==============================
const create = async (req, res) => {
  try {
    if (!req.user.client_id) {
      const error = new Error(
        "User must have a client organization to create tickets",
      );

      error.statusCode = 400;
      throw error;
    }

    const ticket = await createTicket({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      clientId: req.user.client_id,
      attachmentPath: req.file ? req.file.filename : null,
    });

    await sendEmail({
      to: req.user.email,
      subject: `Ticket Created Successfully (#${ticket.id})`,
      html: `
        <h2>Your ticket has been created successfully 🎉</h2>

        <p>
          <strong>Ticket ID:</strong>
          ${escapeHtml(ticket.id)}
        </p>

        <p>
          <strong>Title:</strong>
          ${escapeHtml(ticket.title)}
        </p>

        <p>
          <strong>Description:</strong>
          ${escapeHtml(ticket.description)}
        </p>

        <p>
          <strong>Priority:</strong>
          ${escapeHtml(ticket.priority)}
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHtml(ticket.status)}
        </p>

        <br>

        <p>
          Our support team will review your request shortly.
        </p>

        <br>

        <p>Thank you,</p>
        <b>Support Ticket Team</b>
      `,
    });

    return sendResponse(res, 201, true, ticket, "Ticket created successfully");
  } catch (error) {
    console.error("CREATE TICKET ERROR:");
    console.error(error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to create ticket",
    );
  }
};

// ==============================
// Get All Tickets
// ==============================
const list = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const result = await getTicketsForUser(req.user, page, limit, search);

    return sendResponse(
      res,
      200,
      true,
      result,
      "Tickets retrieved successfully",
    );
  } catch (error) {
    console.log("========== ERROR ==========");
    console.error(error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to retrieve tickets",
    );
  }
};

// ==============================
// Assigned Tickets
// ==============================
const assignedTickets = async (req, res) => {
  try {
    // Only agent can access assigned tickets
    if (req.user.role !== "agent") {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only agents can access assigned tickets",
      );
    }

    const search = req.query.search || "";

    const tickets = await getAssignedTickets(req.user, search);

    return sendResponse(
      res,
      200,
      true,
      tickets,
      "Assigned tickets retrieved successfully",
    );
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to retrieve assigned tickets",
    );
  }
};

// ==============================
// Unassigned Tickets
// ==============================
const unassignedTickets = async (req, res) => {
  try {
    // Only agent can access unassigned tickets
    if (req.user.role !== "agent") {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only agents can access unassigned tickets",
      );
    }

    const search = req.query.search || "";

    const tickets = await getUnassignedTickets(search);

    return sendResponse(
      res,
      200,
      true,
      tickets,
      "Unassigned tickets retrieved successfully",
    );
  } catch (error) {
    console.error(error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to retrieve unassigned tickets",
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
        comments,
      },
      "Ticket retrieved successfully",
    );
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to retrieve ticket",
    );
  }
};

// ==============================
// Reply to Ticket
// ==============================
const reply = async (req, res) => {
  try {
    if (!req.body.message || !req.body.message.trim()) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "Reply message cannot be empty",
      );
    }

    const comment = await addComment({
      ticketId: req.params.id,
      userId: req.user.id,
      message: req.body.message.trim(),
      isInternal: false,
      attachmentPath: req.file ? req.file.filename : null,
    });

    // ==============================
    // Client replied → notify agent
    // ==============================
    if (req.user.role === "client") {
      if (comment.agentEmail) {
        await sendEmail({
          to: comment.agentEmail,
          subject: `New Reply on Ticket #${comment.ticket_id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">

              <h2>Support Ticket System</h2>

              <p>
                Hello <strong>${escapeHtml(comment.agentName)}</strong>,
              </p>

              <p>
                A client has replied to a support ticket assigned to you.
              </p>

              <table
                border="1"
                cellpadding="10"
                cellspacing="0"
                style="border-collapse:collapse;width:100%;"
              >

                <tr>
                  <td><strong>Ticket ID</strong></td>
                  <td>${escapeHtml(comment.ticket_id)}</td>
                </tr>

                <tr>
                  <td><strong>Title</strong></td>
                  <td>${escapeHtml(comment.title)}</td>
                </tr>

                <tr>
                  <td><strong>Reply</strong></td>
                  <td>${escapeHtml(comment.message)}</td>
                </tr>

              </table>

              <br>

              <p>
                Please login to the Support Ticket System
                to continue assisting the client.
              </p>

              <br>

              <strong>Support Ticket Team</strong>

            </div>
          `,
        });
      }
    }

    // ==============================
    // Agent replied → notify client
    // ==============================
    else if (req.user.role === "agent") {
      if (comment.clientEmail) {
        await sendEmail({
          to: comment.clientEmail,
          subject: `Update on Your Ticket #${comment.ticket_id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">

              <h2>Support Ticket System</h2>

              <p>
                Hello <strong>${escapeHtml(comment.clientName)}</strong>,
              </p>

              <p>
                Your support ticket has received a new reply.
              </p>

              <table
                border="1"
                cellpadding="10"
                cellspacing="0"
                style="border-collapse:collapse;width:100%;"
              >

                <tr>
                  <td><strong>Ticket ID</strong></td>
                  <td>${escapeHtml(comment.ticket_id)}</td>
                </tr>

                <tr>
                  <td><strong>Title</strong></td>
                  <td>${escapeHtml(comment.title)}</td>
                </tr>

                <tr>
                  <td><strong>Reply</strong></td>
                  <td>${escapeHtml(comment.message)}</td>
                </tr>

              </table>

              <br>

              <p>
                Please login to the Support Ticket System
                to view the complete conversation.
              </p>

              <br>

              <strong>Support Ticket Team</strong>

            </div>
          `,
        });
      }
    }

    return sendResponse(res, 201, true, comment, "Reply added successfully");
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to add reply",
    );
  }
};

// ==============================
// Internal Note
// ==============================
const internalNote = async (req, res) => {
  try {
    // Only Admin and Agent can create internal notes
    if (!["admin", "agent"].includes(req.user.role)) {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only admin or agent can add internal notes",
      );
    }

    if (!req.body.message || !req.body.message.trim()) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "Internal note cannot be empty",
      );
    }

    const comment = await addComment({
      ticketId: req.params.id,
      userId: req.user.id,
      message: req.body.message.trim(),
      isInternal: true,
      attachmentPath: req.file ? req.file.filename : null,
    });

    return sendResponse(
      res,
      201,
      true,
      comment,
      "Internal note added successfully",
    );
  } catch (error) {
    console.error("INTERNAL NOTE ERROR:", error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to add note",
    );
  }
};

// ==============================
// Update Ticket Status
// ==============================
const status = async (req, res) => {
  try {
    const allowedStatuses = ["open", "pending", "closed"];

    const newStatus = req.body.status;

    if (!allowedStatuses.includes(newStatus)) {
      return sendResponse(res, 400, false, null, "Invalid ticket status");
    }

    if (req.user.role !== "admin" && req.user.role !== "agent") {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only admin or agent can change ticket status",
      );
    }

    const result = await updateTicketStatus(req.params.id, newStatus, req.user);

    return sendResponse(res, 200, true, result, "Status updated successfully");
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to update status",
    );
  }
};

// ==============================
// Assign Ticket
// ==============================
const assign = async (req, res) => {
  try {
    // Only Admin can assign tickets
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only admin can assign tickets",
      );
    }

    const { assigned_agent_id } = req.body;

    if (!assigned_agent_id) {
      return sendResponse(res, 400, false, null, "Agent ID is required");
    }

    const result = await assignTicket(req.params.id, assigned_agent_id);

    // Send email to assigned agent
    await sendEmail({
      to: result.agentEmail,
      subject: `New Ticket Assigned (#${result.id})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px;">

          <h2 style="color:#2563eb;">
            Support Ticket System
          </h2>

          <p>
            Hello <strong>${escapeHtml(result.agentName)}</strong>,
          </p>

          <p>
            A new support ticket has been assigned to you.
          </p>

          <table
            border="1"
            cellpadding="10"
            cellspacing="0"
            style="border-collapse: collapse;"
          >

            <tr>
              <td><strong>Ticket ID</strong></td>
              <td>#${escapeHtml(result.id)}</td>
            </tr>

            <tr>
              <td><strong>Title</strong></td>
              <td>${escapeHtml(result.ticketTitle)}</td>
            </tr>

            <tr>
              <td><strong>Priority</strong></td>
              <td>${escapeHtml(result.priority)}</td>
            </tr>

            <tr>
              <td><strong>Status</strong></td>
              <td>${escapeHtml(result.status)}</td>
            </tr>

          </table>

          <br>

          <p>
            Please log in to the Support Ticket System
            and start working on this ticket.
          </p>

          <br>

          <p>Regards,</p>

          <strong>Support Ticket Team</strong>

        </div>
      `,
    });

    return sendResponse(res, 200, true, result, "Ticket assigned successfully");
  } catch (error) {
    console.error("ASSIGNMENT ERROR:", error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to assign ticket",
    );
  }
};

// ==============================
// Soft Delete Ticket
// ==============================
const remove = async (req, res) => {
  try {
    // Only Admin can delete tickets
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only admin can delete tickets",
      );
    }

    const result = await deleteTicket(req.params.id);

    return sendResponse(res, 200, true, result, "Ticket deleted successfully");
  } catch (error) {
    console.error("DELETE TICKET ERROR:", error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to delete ticket",
    );
  }
};

// ==============================
// Agent Dashboard
// ==============================
const agentDashboard = async (req, res) => {
  try {
    if (req.user.role !== "agent") {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Only agents can access agent dashboard",
      );
    }

    const stats = await getAgentDashboardStats(req.user.id);

    return sendResponse(
      res,
      200,
      true,
      stats,
      "Agent dashboard retrieved successfully",
    );
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to retrieve agent dashboard",
    );
  }
};

// ==============================
// Client Dashboard
// ==============================
const clientDashboard = async (req, res) => {
  try {
    const stats = await getClientDashboardStats(req.user.client_id);

    return sendResponse(
      res,
      200,
      true,
      stats,
      "Client dashboard retrieved successfully",
    );
  } catch (error) {
    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Failed to retrieve client dashboard",
    );
  }
};

// ==============================
// Export Controllers
// ==============================
module.exports = {
  create,
  list,
  assignedTickets,
  unassignedTickets,
  detail,
  reply,
  internalNote,
  status,
  assign,
  remove,
  agentDashboard,
  clientDashboard,
};

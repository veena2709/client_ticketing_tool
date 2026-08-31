const cron = require("node-cron");
const pool = require("../config/database");
const { sendEmail } = require("../utils/email");

// ==============================
// Helper - Escape HTML
// ==============================
const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

console.log("SLA Reminder Job Started");

// ==============================
// Check SLA tickets every 5 minutes
// ==============================
cron.schedule("*/5 * * * *", async () => {
  console.log("Checking SLA tickets...");

  try {
    const [tickets] = await pool.execute(`
      SELECT
        t.id,
        t.title,
        t.priority,
        t.status,
        t.sla_due_date,
        u.name AS agentName,
        u.email AS agentEmail
      FROM tickets t
      JOIN users u
        ON t.assigned_agent_id = u.id
      WHERE
        t.status = 'open'
        AND t.assigned_agent_id IS NOT NULL
        AND t.sla_due_date > UTC_TIMESTAMP()
        AND t.sla_due_date <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)
        AND t.sla_reminder_sent_at IS NULL
    `);

    console.log(`SLA tickets found: ${tickets.length}`);

    for (const ticket of tickets) {
      await sendEmail({
        to: ticket.agentEmail,

        subject: `SLA Reminder - Ticket #${ticket.id}`,

        html: `
          <h2>Hello ${escapeHtml(ticket.agentName)},</h2>

          <p>
            This ticket is approaching its SLA deadline.
          </p>

          <hr>

          <p>
            <b>Ticket ID:</b> ${escapeHtml(ticket.id)}
          </p>

          <p>
            <b>Title:</b> ${escapeHtml(ticket.title)}
          </p>

          <p>
            <b>Priority:</b> ${escapeHtml(ticket.priority)}
          </p>

          <p>
            <b>SLA Due:</b> ${escapeHtml(ticket.sla_due_date)}
          </p>

          <hr>

          <p>
            Please resolve this ticket before the SLA expires.
          </p>

          <br>

          <p>Support Ticketing System</p>
        `,
      });

      // Mark reminder as sent
      await pool.execute(
        `UPDATE tickets
         SET sla_reminder_sent_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [ticket.id],
      );

      console.log(
        `Reminder sent for Ticket ${ticket.id} -> ${ticket.agentEmail}`,
      );
    }
  } catch (err) {
    console.error("SLA Reminder Error:", err);
  }
});

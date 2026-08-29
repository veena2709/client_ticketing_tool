const cron = require("node-cron");
const pool = require("../config/database");
const { sendEmail } = require("../utils/email");

console.log("SLA Reminder Job Started");

cron.schedule("*/5 * * * *", async () => {
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
        AND t.sla_due_date <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)
        AND t.sla_reminder_sent_at IS NULL
    `);

    for (const ticket of tickets) {
      await sendEmail({
        to: ticket.agentEmail,
        subject: `SLA Reminder - Ticket #${ticket.id}`,
        html: `
          <h2>Hello ${ticket.agentName},</h2>

          <p>This ticket is approaching its SLA deadline.</p>

          <hr>

          <p><b>Ticket ID:</b> ${ticket.id}</p>
          <p><b>Title:</b> ${ticket.title}</p>
          <p><b>Priority:</b> ${ticket.priority}</p>
          <p><b>SLA Due:</b> ${ticket.sla_due_date}</p>

          <hr>

          <p>Please resolve this ticket before the SLA expires.</p>

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
    }
  } catch (err) {
    console.error("SLA Reminder Error:", err);
  }
});

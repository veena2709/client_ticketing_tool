require("dotenv").config();
console.log("🔥 SERVER IS LOADING APP FROM:", require.resolve("./app"));
const app = require("./app");

// Start SLA Reminder Job
require("./jobs/slaReminder");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

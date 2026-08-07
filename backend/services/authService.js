const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
console.log("AUTH SERVICE LOADED");

// ==========================
// Register User
// ==========================
const registerUser = async ({
  name,
  email,
  password,
  role = "client",
  clientId = null,
}) => {
  email = email.trim().toLowerCase();
  password = password.trim();

  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );

  if (existing.length) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (role === "client" && !clientId) {
    const [clientResult] = await pool.execute(
      "INSERT INTO clients (organization_name, created_at, updated_at) VALUES (?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
      [`${name}'s Organization`],
    );

    clientId = clientResult.insertId;
  }

  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password, role, client_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
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

// ==========================
// Login User
// ==========================
const loginUser = async ({ email, password }) => {
  console.log("========== loginUser() ==========");

  email = email.trim().toLowerCase();
  password = password.trim();

  console.log("Email:", email);

  console.log("Database Configuration");
  console.log("HOST:", process.env.DB_HOST);
  console.log("PORT:", process.env.DB_PORT);
  console.log("USER:", process.env.DB_USER);
  console.log("PASSWORD:", process.env.DB_PASSWORD);
  console.log("DATABASE:", process.env.DB_NAME);

  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);

  console.log("Database Result:");
  console.log(rows);

  if (!rows.length) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const user = rows[0];

  console.log("User Found:", user.email);

  const isValid = await bcrypt.compare(password, user.password);

  console.log("Password Match:", isValid);

  if (!isValid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    },
  );

  console.log("Login Successful");

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      client_id: user.client_id,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
};

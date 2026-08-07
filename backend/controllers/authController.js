const { sendResponse } = require("../utils/response");
const { registerUser, loginUser } = require("../services/authService");
const { validationResult } = require("express-validator");
const { sendEmail } = require("../utils/email");

const signup = async (req, res) => {
  try {
    console.log("Signup request body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return sendResponse(
        res,
        400,
        false,
        null,
        "Validation failed",
        errors.array(),
      );
    }

    const user = await registerUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || "client",
      clientId: req.body.client_id || null,
    });

    // Send Welcome Email
    await sendEmail({
      to: user.email,
      subject: "Welcome to Support Ticket System",
      html: `
        <h2>Welcome ${user.name}! 🎉</h2>

        <p>Your account has been created successfully.</p>

        <p>You can now login and start using the <b>Support Ticket System</b>.</p>

        <br>

        <p>Thank you,</p>
        <b>Support Ticket Team</b>
      `,
    });

    return sendResponse(res, 201, true, user, "User created successfully");
  } catch (error) {
    console.error("Signup error:", error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Signup failed",
    );
  }
};

const login = async (req, res) => {
  console.log("LOGIN API CALLED");

  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "Validation failed",
        errors.array(),
      );
    }

    const result = await loginUser({
      email: req.body.email,
      password: req.body.password,
    });

    return sendResponse(res, 200, true, result, "Login successful");
  } catch (error) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);

    return sendResponse(
      res,
      error.statusCode || 500,
      false,
      null,
      error.message || "Login failed",
    );
  }
};

module.exports = {
  signup,
  login,
};

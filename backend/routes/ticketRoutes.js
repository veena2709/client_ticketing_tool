const express = require("express");
console.log("🔥 TICKET ROUTES FILE LOADED");
const router = express.Router();
const upload = require("../middlewares/upload");

const {
  create,
  list,
  detail,
  reply,
  internalNote,
  status,
  assign,
  remove,
} = require("../controllers/ticketController");

const { authenticate, authorize } = require("../middlewares/auth");

const {
  ticketValidation,
  commentValidation,
  assignValidation,
} = require("../validations/auth");

const { validateRequest } = require("../middlewares/validate");

// =============================
// Create Ticket
// =============================
router.post(
  "/",
  authenticate,
  authorize("client"),
  upload.single("attachment"),
  ticketValidation,
  validateRequest,
  create,
);

// =============================
// Get All Tickets
// =============================
router.get("/", authenticate, authorize("client", "agent", "admin"), list);

// =============================
// Get Ticket Details
// =============================
router.get("/:id", authenticate, authorize("client", "agent", "admin"), detail);

// =============================
// Reply to Ticket
// =============================
router.post(
  "/:id/reply",
  authenticate,
  authorize("client", "agent", "admin"),
  upload.single("attachment"),
  commentValidation,
  validateRequest,
  reply,
);

// =============================
// Internal Note
// =============================
router.post(
  "/:id/internal-note",
  authenticate,
  authorize("agent", "admin"),
  upload.single("attachment"),
  commentValidation,
  validateRequest,
  internalNote,
);

// =============================
// Update Ticket Status
// =============================
router.patch("/:id/status", authenticate, authorize("agent", "admin"), status);

// =============================
// Assign Ticket
// =============================
router.patch(
  "/:id/assign",
  authenticate,
  authorize("admin"),
  (req, res, next) => {
    console.log("🔥 ASSIGN ROUTE REACHED");
    console.log("🔥 BODY INSIDE ROUTE:", req.body);
    next();
  },
  assign,
);

// =============================
// Soft Delete Ticket
// =============================
router.delete("/:id", authenticate, authorize("admin"), remove);

module.exports = router;

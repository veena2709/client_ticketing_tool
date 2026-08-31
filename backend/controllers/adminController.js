const { sendResponse } = require("../utils/response");

const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  getDashboardStats,
} = require("../services/adminService");

// ==========================
// Users
// ==========================

const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    return sendResponse(res, 200, true, users, "Users retrieved successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to retrieve users",
    );
  }
};

const createUserHandler = async (req, res) => {
  try {
    const user = await createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      clientId: req.body.client_id || null,
    });

    return sendResponse(res, 201, true, user, "User created successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to create user",
    );
  }
};

const updateUserHandler = async (req, res) => {
  try {
    const user = await updateUser(req.params.id, {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      client_id: req.body.client_id,
    });

    return sendResponse(res, 200, true, user, "User updated successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to update user",
    );
  }
};

const deleteUserHandler = async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);

    return sendResponse(res, 200, true, result, "User deleted successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to delete user",
    );
  }
};

// ==========================
// Clients
// ==========================

const listClients = async (req, res) => {
  try {
    const clients = await getAllClients();

    return sendResponse(
      res,
      200,
      true,
      clients,
      "Clients retrieved successfully",
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to retrieve clients",
    );
  }
};

const createClientHandler = async (req, res) => {
  try {
    const client = await createClient({
      organizationName: req.body.organization_name,
    });

    return sendResponse(res, 201, true, client, "Client created successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to create client",
    );
  }
};

const updateClientHandler = async (req, res) => {
  try {
    const client = await updateClient(
      req.params.id,
      req.body.organization_name,
    );

    return sendResponse(res, 200, true, client, "Client updated successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to update client",
    );
  }
};

const deleteClientHandler = async (req, res) => {
  try {
    const result = await deleteClient(req.params.id);

    return sendResponse(res, 200, true, result, "Client deleted successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      null,
      error.message || "Failed to delete client",
    );
  }
};

// ==========================
// Dashboard Statistics
// ==========================

const dashboard = async (req, res) => {
  try {
    const stats = await getDashboardStats();

    return sendResponse(
      res,
      200,
      true,
      stats,
      "Dashboard data fetched successfully",
    );
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

module.exports = {
  listUsers,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listClients,
  createClientHandler,
  updateClientHandler,
  deleteClientHandler,
  dashboard,
};

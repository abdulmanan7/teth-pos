import { RequestHandler } from "express";
import Staff from "../db/models/Staff";
import crypto from "crypto";

// Get all staff members
export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const staff = await Staff.find().select("-pin");
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// Get single staff member
export const getStaffById: RequestHandler = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select("-pin");
    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// Create new staff member
export const createStaff: RequestHandler = async (req, res) => {
  try {
    const { name, role, pin, email, phone, notes } = req.body;

    if (!name || !role || !pin) {
      res.status(400).json({ error: "Name, role, and PIN are required" });
      return;
    }

    if (pin.length < 4 || pin.length > 6) {
      res.status(400).json({ error: "PIN must be 4-6 digits" });
      return;
    }

    const staff = new Staff({
      name,
      role,
      pin,
      email,
      phone,
      notes,
      status: "active",
    });

    await staff.save();
    res.status(201).json(staff);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Failed to create staff" });
    }
  }
};

// Update staff member
export const updateStaff: RequestHandler = async (req, res) => {
  try {
    const { name, role, email, phone, notes, status } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, role, email, phone, notes, status },
      { new: true }
    ).select("-pin");

    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: "Failed to update staff" });
  }
};

// Delete staff member
export const deleteStaff: RequestHandler = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }

    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete staff" });
  }
};

// Staff login with Email and PIN
export const loginStaff: RequestHandler = async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!pin) {
      res.status(400).json({ error: "PIN is required" });
      return;
    }

    const staff = await Staff.findOne({ email, pin, status: "active" });

    if (!staff) {
      res.status(401).json({ error: "Invalid email or PIN" });
      return;
    }

    // Generate session ID
    const sessionId = crypto.randomBytes(16).toString("hex");
    const now = new Date();

    // Update staff login status
    staff.is_logged_in = true;
    staff.last_login = now;
    staff.login_session_id = sessionId;
    await staff.save();

    res.json({
      _id: staff._id,
      name: staff.name,
      role: staff.role,
      sessionId,
      loginTime: now,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

// Staff logout
export const logoutStaff: RequestHandler = async (req, res) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      res.status(400).json({ error: "Staff ID is required" });
      return;
    }

    const staff = await Staff.findByIdAndUpdate(
      staffId,
      {
        is_logged_in: false,
        last_logout: new Date(),
        login_session_id: null,
      },
      { new: true }
    ).select("-pin");

    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }

    res.json({ message: "Logged out successfully", staff });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get currently logged in staff
export const getLoggedInStaff: RequestHandler = async (req, res) => {
  try {
    const staff = await Staff.findOne({ is_logged_in: true }).select("-pin");

    if (!staff) {
      res.status(404).json({ error: "No staff currently logged in" });
      return;
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logged in staff" });
  }
};

// Change PIN
export const changePin: RequestHandler = async (req, res) => {
  try {
    const { staffId, oldPin, newPin } = req.body;

    if (!staffId || !oldPin || !newPin) {
      res.status(400).json({ error: "Staff ID, old PIN, and new PIN are required" });
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      res.status(400).json({ error: "New PIN must be 4-6 digits" });
      return;
    }

    const staff = await Staff.findById(staffId);

    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }

    if (staff.pin !== oldPin) {
      res.status(401).json({ error: "Old PIN is incorrect" });
      return;
    }

    staff.pin = newPin;
    await staff.save();

    res.json({ message: "PIN changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to change PIN" });
  }
};

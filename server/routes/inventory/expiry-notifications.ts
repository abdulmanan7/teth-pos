import { RequestHandler } from "express";
import { ExpiryNotification } from "../../db/models/ExpiryNotification";
import { LotNumber } from "../../db/models/LotNumber";
import { ProductBatch } from "../../db/models/ProductBatch";

// Retry helper
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Max retries exceeded");
}

// Get all notifications
export const getAllNotifications: RequestHandler = async (req, res) => {
  try {
    const notifications = await withRetry(async () =>
      (ExpiryNotification.find() as any).sort({ expiry_date: 1 }).exec()
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get active notifications
export const getActiveNotifications: RequestHandler = async (req, res) => {
  try {
    const notifications = await withRetry(async () =>
      (ExpiryNotification.find({ status: "active" }) as any)
        .sort({ expiry_date: 1 })
        .exec()
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching active notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get notifications by type
export const getNotificationsByType: RequestHandler = async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ["expired", "expiring_soon", "upcoming"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid notification type" });
    }

    const notifications = await withRetry(async () =>
      (ExpiryNotification.find({ notification_type: type }) as any)
        .sort({ expiry_date: 1 })
        .exec()
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications by type:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get notifications by status
export const getNotificationsByStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["active", "acknowledged", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const notifications = await withRetry(async () =>
      (ExpiryNotification.find({ status }) as any)
        .sort({ expiry_date: 1 })
        .exec()
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications by status:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get notification by ID
export const getNotificationById: RequestHandler = async (req, res) => {
  try {
    const notification = await withRetry(async () =>
      (ExpiryNotification.findById(req.params.id) as any).exec()
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({ error: "Failed to fetch notification" });
  }
};

// Check and create expiry notifications
export const checkAndCreateNotifications: RequestHandler = async (req, res) => {
  try {
    const notifications: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all lot numbers with expiry dates
    const lots = await withRetry(async () =>
      (LotNumber.find({ expiry_date: { $exists: true } }) as any).exec()
    );

    // Get all product batches with expiry dates (including market purchases)
    const batches = await withRetry(async () =>
      (ProductBatch.find({ 
        expiry_date: { $exists: true },
        status: "active" // Only check active batches
      }) as any).exec()
    );

    // Process lot numbers
    for (const lot of lots) {
      if (!lot.expiry_date) continue;

      const expiryDate = new Date(lot.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let notificationType: "expired" | "expiring_soon" | "upcoming";

      if (daysUntilExpiry < 0) {
        notificationType = "expired";
      } else if (daysUntilExpiry <= 30) {
        notificationType = "expiring_soon";
      } else if (daysUntilExpiry <= 60) {
        notificationType = "upcoming";
      } else {
        continue; // Skip if more than 60 days away
      }

      // Check if notification already exists
      const existingNotification = await withRetry(async () =>
        (ExpiryNotification.findOne({
          lot_id: lot._id,
          notification_type: notificationType,
          status: { $in: ["active", "acknowledged"] },
        }) as any).exec()
      );

      if (!existingNotification) {
        const newNotification = new ExpiryNotification({
          lot_id: lot._id,
          product_id: lot.product_id,
          warehouse_id: lot.warehouse_id,
          notification_type: notificationType,
          expiry_date: lot.expiry_date,
          days_until_expiry: daysUntilExpiry,
          quantity: lot.quantity,
          status: "active",
        });
        await withRetry(() => newNotification.save());
        notifications.push(newNotification);
      }
    }

    // Process product batches
    for (const batch of batches) {
      if (!batch.expiry_date) continue;

      const expiryDate = new Date(batch.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let notificationType: "expired" | "expiring_soon" | "upcoming";

      if (daysUntilExpiry < 0) {
        notificationType = "expired";
      } else if (daysUntilExpiry <= 30) {
        notificationType = "expiring_soon";
      } else if (daysUntilExpiry <= 60) {
        notificationType = "upcoming";
      } else {
        continue; // Skip if more than 60 days away
      }

      // Check if notification already exists for this batch
      const existingNotification = await withRetry(async () =>
        (ExpiryNotification.findOne({
          batch_id: batch._id,
          notification_type: notificationType,
          status: { $in: ["active", "acknowledged"] },
        }) as any).exec()
      );

      if (!existingNotification) {
        const newNotification = new ExpiryNotification({
          batch_id: batch._id,
          product_id: batch.product_id,
          warehouse_id: batch.warehouse_id,
          notification_type: notificationType,
          expiry_date: batch.expiry_date,
          days_until_expiry: daysUntilExpiry,
          quantity: batch.quantity,
          status: "active",
        });
        await withRetry(() => newNotification.save());
        notifications.push(newNotification);
      }
    }

    res.json({
      message: "Expiry check completed",
      notifications_created: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error checking expiry dates:", error);
    res.status(500).json({ error: "Failed to check expiry dates" });
  }
};

// Acknowledge notification
export const acknowledgeNotification: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledged_by, notes } = req.body;

    const notification = await withRetry(async () =>
      (ExpiryNotification.findById(id) as any).exec()
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.status = "acknowledged";
    notification.acknowledged_by = acknowledged_by || "system";
    notification.acknowledged_date = new Date();
    if (notes) notification.notes = notes;

    const updatedNotification = await withRetry(() => notification.save());
    res.json(updatedNotification);
  } catch (error) {
    console.error("Error acknowledging notification:", error);
    res.status(500).json({ error: "Failed to acknowledge notification" });
  }
};

// Resolve notification
export const resolveNotification: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_type, notes } = req.body;

    if (!resolution_type) {
      return res.status(400).json({ error: "Resolution type is required" });
    }

    const validTypes = ["used", "disposed", "transferred", "other"];
    if (!validTypes.includes(resolution_type)) {
      return res.status(400).json({ error: "Invalid resolution type" });
    }

    const notification = await withRetry(async () =>
      (ExpiryNotification.findById(id) as any).exec()
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.status = "resolved";
    notification.resolution_type = resolution_type;
    notification.resolved_date = new Date();
    if (notes) notification.notes = notes;

    const updatedNotification = await withRetry(() => notification.save());
    res.json(updatedNotification);
  } catch (error) {
    console.error("Error resolving notification:", error);
    res.status(500).json({ error: "Failed to resolve notification" });
  }
};

// Delete notification
export const deleteNotification: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNotification = await withRetry(async () =>
      (ExpiryNotification.findByIdAndDelete(id) as any).exec()
    );

    if (!deletedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Get expiry summary
export const getExpirySummary: RequestHandler = async (req, res) => {
  try {
    const expiredCount = await withRetry(async () =>
      (ExpiryNotification.countDocuments({
        notification_type: "expired",
        status: "active",
      }) as any)
    );

    const expiringSoonCount = await withRetry(async () =>
      (ExpiryNotification.countDocuments({
        notification_type: "expiring_soon",
        status: "active",
      }) as any)
    );

    const upcomingCount = await withRetry(async () =>
      (ExpiryNotification.countDocuments({
        notification_type: "upcoming",
        status: "active",
      }) as any)
    );

    const totalActive = await withRetry(async () =>
      (ExpiryNotification.countDocuments({ status: "active" }) as any)
    );

    res.json({
      expired: expiredCount,
      expiring_soon: expiringSoonCount,
      upcoming: upcomingCount,
      total_active: totalActive,
    });
  } catch (error) {
    console.error("Error getting expiry summary:", error);
    res.status(500).json({ error: "Failed to get expiry summary" });
  }
};

// Get critical expiries (expired + expiring soon)
export const getCriticalExpiries: RequestHandler = async (req, res) => {
  try {
    const notifications = await withRetry(async () =>
      (ExpiryNotification.find({
        notification_type: { $in: ["expired", "expiring_soon"] },
        status: "active",
      }) as any)
        .sort({ expiry_date: 1 })
        .exec()
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching critical expiries:", error);
    res.status(500).json({ error: "Failed to fetch critical expiries" });
  }
};

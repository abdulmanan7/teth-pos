import { RequestHandler } from "express";
import TaxRate from "../db/models/TaxRate";

const normalizeRate = (value: any) => {
  const numericRate = Number(value);
  if (!Number.isFinite(numericRate)) {
    throw new Error("Tax rate must be a valid number");
  }
  if (numericRate < 0) {
    throw new Error("Tax rate cannot be negative");
  }
  // Accept values provided either as percentage (e.g. 5) or decimal (0.05)
  return numericRate > 1 ? numericRate / 100 : numericRate;
};

const ensureDefaultExists = async () => {
  const defaultExists = await TaxRate.exists({ isDefault: true });
  if (!defaultExists) {
    const firstRate = await TaxRate.findOne().sort({ createdAt: 1 });
    if (firstRate) {
      firstRate.isDefault = true;
      await firstRate.save();
    }
  }
};

export const getTaxRates: RequestHandler = async (_req, res) => {
  try {
    const taxRates = await TaxRate.find().sort({ isDefault: -1, createdAt: -1 });
    res.json(taxRates);
  } catch (error) {
    console.error("Error fetching tax rates:", error);
    res.status(500).json({ error: "Failed to fetch tax rates" });
  }
};

export const createTaxRate: RequestHandler = async (req, res) => {
  try {
    const { name, rate, description, isDefault } = req.body;

    if (!name || rate === undefined) {
      return res.status(400).json({ error: "Name and rate are required" });
    }

    const existingWithName = await TaxRate.findOne({ name: name.trim() });
    if (existingWithName) {
      return res.status(400).json({ error: "A tax rate with this name already exists" });
    }

    let normalizedRate: number;
    try {
      normalizedRate = normalizeRate(rate);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    if (normalizedRate > 1) {
      return res.status(400).json({ error: "Tax rate cannot exceed 100%" });
    }

    const taxRate = new TaxRate({
      name: name.trim(),
      rate: Math.round(normalizedRate * 10000) / 10000,
      description,
      isDefault: Boolean(isDefault),
    });

    await taxRate.save();

    if (taxRate.isDefault) {
      await TaxRate.updateMany({ _id: { $ne: taxRate._id } }, { isDefault: false });
    } else {
      await ensureDefaultExists();
    }

    res.status(201).json(taxRate);
  } catch (error) {
    console.error("Error creating tax rate:", error);
    res.status(500).json({ error: "Failed to create tax rate" });
  }
};

export const updateTaxRate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate, description, isDefault } = req.body;

    const taxRate = await TaxRate.findById(id);
    if (!taxRate) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    if (name) {
      const existingWithName = await TaxRate.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existingWithName) {
        return res.status(400).json({ error: "A tax rate with this name already exists" });
      }
      taxRate.name = name.trim();
    }

    if (rate !== undefined) {
      let normalizedRate: number;
      try {
        normalizedRate = normalizeRate(rate);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
      if (normalizedRate > 1) {
        return res.status(400).json({ error: "Tax rate cannot exceed 100%" });
      }
      taxRate.rate = Math.round(normalizedRate * 10000) / 10000;
    }

    if (description !== undefined) {
      taxRate.description = description;
    }

    if (typeof isDefault === "boolean") {
      taxRate.isDefault = isDefault;
    }

    await taxRate.save();

    if (taxRate.isDefault) {
      await TaxRate.updateMany({ _id: { $ne: taxRate._id } }, { isDefault: false });
    } else {
      await ensureDefaultExists();
    }

    res.json(taxRate);
  } catch (error) {
    console.error("Error updating tax rate:", error);
    res.status(500).json({ error: "Failed to update tax rate" });
  }
};

export const deleteTaxRate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const taxRate = await TaxRate.findByIdAndDelete(id);
    if (!taxRate) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    await ensureDefaultExists();

    res.json({ message: "Tax rate deleted successfully" });
  } catch (error) {
    console.error("Error deleting tax rate:", error);
    res.status(500).json({ error: "Failed to delete tax rate" });
  }
};

export const setDefaultTaxRate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const taxRate = await TaxRate.findById(id);
    if (!taxRate) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    await TaxRate.updateMany({}, { isDefault: false });
    taxRate.isDefault = true;
    await taxRate.save();

    res.json(taxRate);
  } catch (error) {
    console.error("Error setting default tax rate:", error);
    res.status(500).json({ error: "Failed to set default tax rate" });
  }
};

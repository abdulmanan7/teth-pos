import { RequestHandler } from "express";
import BrandingConfig from "../db/models/BrandingConfig";

// Get branding configuration
export const getBrandingConfig: RequestHandler = async (req, res) => {
  try {
    let config = await BrandingConfig.findOne();

    if (!config) {
      // Return default config if none exists
      return res.json({
        storeName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        website: "",
        taxId: "",
        businessLicense: "",
        description: "",
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Error fetching branding config:", error);
    res.status(500).json({ error: "Failed to fetch branding configuration" });
  }
};

// Save or update branding configuration
export const saveBrandingConfig: RequestHandler = async (req, res) => {
  try {
    const {
      storeName,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      taxId,
      businessLicense,
      description,
      logo,
    } = req.body;

    // Validate required fields
    if (!storeName || !phone || !email || !address || !city || !state || !zipCode || !country) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let config = await BrandingConfig.findOne();

    if (!config) {
      // Create new config
      config = new BrandingConfig({
        storeName,
        phone,
        email,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        taxId,
        businessLicense,
        description,
        logo,
      });
    } else {
      // Update existing config
      config.storeName = storeName;
      config.phone = phone;
      config.email = email;
      config.address = address;
      config.city = city;
      config.state = state;
      config.zipCode = zipCode;
      config.country = country;
      config.website = website;
      config.taxId = taxId;
      config.businessLicense = businessLicense;
      config.description = description;
      if (logo) config.logo = logo;
    }

    await config.save();
    res.json(config);
  } catch (error) {
    console.error("Error saving branding config:", error);
    res.status(500).json({ error: "Failed to save branding configuration" });
  }
};

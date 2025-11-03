import { useState, useEffect } from "react";
import { useElectronApi } from "./useElectronApi";

export interface BrandingConfig {
  _id?: string;
  storeName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website?: string;
  taxId?: string;
  businessLicense?: string;
  description?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useBrandingConfig() {
  const { get } = useElectronApi();
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await get("/api/branding/config");
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [get]);

  return { config, loading, error };
}

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useNotifications } from "@/utils/notifications";
import type { Warehouse } from "@shared/api";

interface WarehousesManagerProps {
  isDarkTheme?: boolean;
  onClose: () => void;
}

export default function WarehousesManager({ isDarkTheme = true, onClose }: WarehousesManagerProps) {
  const notify = useNotifications();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/warehouses");
          setWarehouses(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      notify.error("Name and code are required");
      return;
    }

    try {
      if (editingId) {
        await put(`/api/inventory/warehouses/${editingId}`, formData);
      } else {
        await post("/api/inventory/warehouses", formData);
      }
      resetForm();
      await fetchWarehouses();
    } catch (error) {
      console.error("Error saving warehouse:", error);
      notify.error("Failed to save warehouse");
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || "",
      city: warehouse.city || "",
      state: warehouse.state || "",
      zip_code: warehouse.zip_code || "",
      phone: warehouse.phone || "",
      email: warehouse.email || "",
    });
    setEditingId(warehouse._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      try {
        await deleteRequest(`/api/inventory/warehouses/${id}`);
        await fetchWarehouses();
      } catch (error) {
        console.error("Error deleting warehouse:", error);
        notify.error("Failed to delete warehouse");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      phone: "",
      email: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          <Building2 className="w-6 h-6" />
          Warehouse Management
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Warehouse
        </Button>
      </div>

      {showForm && (
        <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Warehouse Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
              <Input
                type="text"
                placeholder="Code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
            </div>
            <Input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
              <Input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
              <Input
                type="text"
                placeholder="ZIP Code"
                value={formData.zip_code}
                onChange={(e) =>
                  setFormData({ ...formData, zip_code: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {editingId ? "Update" : "Create"} Warehouse
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                className={`flex-1 ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          <p>No warehouses found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse._id}
              className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
            >
              <div className="flex-1">
                <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{warehouse.name}</h4>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  {warehouse.code}
                  {warehouse.city && ` • ${warehouse.city}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(warehouse)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(warehouse._id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

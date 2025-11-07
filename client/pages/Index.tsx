import { useState, useEffect, useMemo, useCallback } from "react";
import logoSvg from "@/assets/logo.svg";
import {
  ShoppingCart,
  Users,
  Package,
  Clock,
  BarChart3,
  Plus,
  Trash2,
  Search,
  Save,
  RotateCcw,
  X,
  ChevronDown,
  Settings,
  Activity,
  Moon,
  Sun,
  Printer,
  Percent,
  Tag,
  Calculator,
} from "lucide-react";
import ProductsModal from "@/components/modals/ProductsModal";
import CustomersModal from "@/components/modals/CustomersModal";
import OrdersModal from "@/components/modals/OrdersModal";
import OrderHistoryModal from "@/components/modals/OrderHistoryModal";
import SalesReportModal from "@/components/modals/SalesReportModal";
import AdminModal from "@/components/modals/AdminModal";
import StaffLoginModal from "@/components/modals/StaffLoginModal";
import StaffManagementModal from "@/components/modals/StaffManagementModal";
import ResumeOrderModal from "@/components/modals/ResumeOrderModal";
import PaymentModalComponent from "@/components/modals/PaymentModalComponent";
import ReturnsModal from "@/components/modals/ReturnsModal";
import DiscountModalComponent from "@/components/modals/DiscountModalComponent";
import AccountingModal from "@/components/modals/AccountingModal";
import ThermalReceipt from "@/components/receipts/ThermalReceipt";
import InventoryWidgets from "@/components/dashboard/InventoryWidgets";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";
import { useAuthCheck, useFilter } from "@/hooks";
import { showNotification, storage } from "@/utils";
import type {
  Product as ApiProduct,
  Customer as ApiCustomer,
  StaffLoginResponse,
  Order,
  DiscountConfig,
  TaxRateConfig,
} from "@shared/api";

type ModalType =
  | "products"
  | "customers"
  | "orders"
  | "history"
  | "sales"
  | "resume"
  | "payment"
  | "security"
  | "admin"
  | "dashboard"
  | "returns"
  | "accounting"
  | null;

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  sku?: string;
  hasSerialNumbers?: boolean;
  status?: string;
  matchedLot?: string | null;
  matchedSerial?: string | null;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
}

interface DraftOrder {
  id: string;
  customer: string;
  items: CartItem[];
  notes: string;
  createdAt: string;
  total: number;
}

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;
const TAX_SELECTION_KEY = "selectedTaxRateId";
const CUSTOM_TAX_VALUE_KEY = "customTaxRateValue";
const CUSTOM_TAX_OPTION = "__custom__";

const calculateItemTotals = (item: CartItem) => {
  const subtotal = roundToTwo(item.price * item.quantity);
  let discountAmount = 0;

  if (item.discount && item.discount.value > 0) {
    discountAmount =
      item.discount.type === "percentage"
        ? subtotal * (item.discount.value / 100)
        : item.discount.value;
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
  }

  discountAmount = roundToTwo(discountAmount);
  const totalAfterDiscount = roundToTwo(subtotal - discountAmount);

  return {
    subtotal,
    discountAmount,
    totalAfterDiscount,
  };
};

const calculateCheckoutDiscountAmount = (
  baseAmount: number,
  discount?: DiscountConfig | null
) => {
  if (!discount || discount.value <= 0) {
    return 0;
  }

  let discountAmount =
    discount.type === "percentage"
      ? baseAmount * (discount.value / 100)
      : discount.value;

  if (discountAmount > baseAmount) {
    discountAmount = baseAmount;
  }

  return roundToTwo(discountAmount);
};

interface StaffMember {
  id: number;
  name: string;
  role: string;
}

// Static demo data removed - all data now fetched from MongoDB
// Products fetched from GET /api/products
// Customers fetched from GET /api/customers

export default function Index() {
  const { get, post } = useElectronApi();
  const { config: branding } = useBrandingConfig();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState("Walk-in");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountingItemId, setDiscountingItemId] = useState<string | null>(null);
  const [showCheckoutDiscountModal, setShowCheckoutDiscountModal] = useState(false);
  const [checkoutDiscount, setCheckoutDiscount] = useState<DiscountConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffLoginResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [taxRates, setTaxRates] = useState<TaxRateConfig[]>([]);
  const [selectedTaxRateId, setSelectedTaxRateId] = useState<string>(CUSTOM_TAX_OPTION);
  const [taxRateLabel, setTaxRateLabel] = useState<string | null>(null);
  const [taxRatesLoading, setTaxRatesLoading] = useState(false);
  const [taxRatesError, setTaxRatesError] = useState<string | null>(null);
  const [clickingProductId, setClickingProductId] = useState<string | null>(null); // Track which product is being clicked
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Load theme from localStorage on mount, default to dark
    const savedTheme = storage.get<boolean>("isDarkTheme");
    return savedTheme !== undefined ? savedTheme : true;
  });

  const {
    itemsWithTotals,
    subtotalBeforeDiscount,
    itemDiscountTotal,
    subtotalAfterItemDiscount,
    checkoutDiscountAmount,
    taxableAmount,
    tax,
    total,
  } = useMemo(() => {
    const itemsWithTotals = cartItems.map((item) => {
      const { subtotal, discountAmount, totalAfterDiscount } = calculateItemTotals(item);
      return {
        ...item,
        subtotal,
        discountAmount,
        totalAfterDiscount,
      };
    });

    const subtotalBeforeDiscount = roundToTwo(
      itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0)
    );
    const itemDiscountTotal = roundToTwo(
      itemsWithTotals.reduce((sum, item) => sum + item.discountAmount, 0)
    );
    const subtotalAfterItemDiscount = roundToTwo(subtotalBeforeDiscount - itemDiscountTotal);
    const checkoutDiscountAmount = calculateCheckoutDiscountAmount(
      subtotalAfterItemDiscount,
      checkoutDiscount
    );
    const taxableAmount = roundToTwo(
      Math.max(0, subtotalAfterItemDiscount - checkoutDiscountAmount)
    );
    const tax = roundToTwo(taxableAmount * taxRate);
    const total = roundToTwo(taxableAmount + tax);

    return {
      itemsWithTotals,
      subtotalBeforeDiscount,
      itemDiscountTotal,
      subtotalAfterItemDiscount,
      checkoutDiscountAmount,
      taxableAmount,
      tax,
      total,
    };
  }, [cartItems, checkoutDiscount, taxRate]);

  const applyPresetTaxRate = useCallback((rate: TaxRateConfig) => {
    setSelectedTaxRateId(rate._id);
    setTaxRate(rate.rate);
    setTaxRateLabel(rate.name);
    storage.set(TAX_SELECTION_KEY, rate._id);
    storage.remove(CUSTOM_TAX_VALUE_KEY);
  }, []);

  const fetchTaxRates = useCallback(async () => {
    try {
      setTaxRatesLoading(true);
      setTaxRatesError(null);
      const data = await get("/api/tax-rates");
      const list = Array.isArray(data) ? (data as TaxRateConfig[]) : [];
      setTaxRates(list);

      if (!list.length) {
        setSelectedTaxRateId(CUSTOM_TAX_OPTION);
        setTaxRateLabel(null);
        storage.set(TAX_SELECTION_KEY, CUSTOM_TAX_OPTION);
        return;
      }

      const storedSelection = storage.get<string>(TAX_SELECTION_KEY);
      if (storedSelection && storedSelection !== CUSTOM_TAX_OPTION) {
        const matched = list.find((rate) => rate._id === storedSelection);
        if (matched) {
          applyPresetTaxRate(matched);
          return;
        }
      }

      if (storedSelection === CUSTOM_TAX_OPTION) {
        const storedCustom = storage.get<number>(CUSTOM_TAX_VALUE_KEY, 0) ?? 0;
        setSelectedTaxRateId(CUSTOM_TAX_OPTION);
        setTaxRate(Number.isFinite(storedCustom) ? storedCustom : 0);
        setTaxRateLabel(null);
        return;
      }

      const defaultRate = list.find((rate) => rate.isDefault) ?? list[0];
      if (defaultRate) {
        applyPresetTaxRate(defaultRate);
      }
    } catch (error) {
      console.error("Failed to load tax rates", error);
      setTaxRates([]);
      setTaxRatesError("Failed to load tax presets. Using custom rate.");
      setSelectedTaxRateId(CUSTOM_TAX_OPTION);
      setTaxRateLabel(null);
      showNotification.error("Failed to load tax rates");
    } finally {
      setTaxRatesLoading(false);
    }
  }, [applyPresetTaxRate, get]);

  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  const handleTaxRateSelect = (value: string) => {
    if (value === CUSTOM_TAX_OPTION) {
      setSelectedTaxRateId(CUSTOM_TAX_OPTION);
      setTaxRateLabel(null);
      storage.set(TAX_SELECTION_KEY, CUSTOM_TAX_OPTION);
      const storedCustom = storage.get<number>(CUSTOM_TAX_VALUE_KEY, taxRate) ?? taxRate;
      setTaxRate(Number.isFinite(storedCustom) ? storedCustom : 0);
      return;
    }

    const matched = taxRates.find((rate) => rate._id === value);
    if (matched) {
      applyPresetTaxRate(matched);
      return;
    }

    // Fallback to custom mode if preset disappeared between renders
    setSelectedTaxRateId(CUSTOM_TAX_OPTION);
    setTaxRateLabel(null);
  };

  const handleCustomTaxRateChange = (rawValue: string) => {
    const parsed = parseFloat(rawValue);
    const safePercent = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const normalized = safePercent / 100;
    setTaxRate(normalized);
    if (selectedTaxRateId !== CUSTOM_TAX_OPTION) {
      setSelectedTaxRateId(CUSTOM_TAX_OPTION);
    }
    setTaxRateLabel(null);
    storage.set(TAX_SELECTION_KEY, CUSTOM_TAX_OPTION);
    storage.set(CUSTOM_TAX_VALUE_KEY, normalized);
  };

  const handleRetryFetchTaxRates = () => {
    if (!taxRatesLoading) {
      fetchTaxRates();
    }
  };
  useEffect(() => {
    const savedDrafts = storage.get<DraftOrder[]>("draftOrders", []);
    if (savedDrafts && savedDrafts.length > 0) {
      setDraftOrders(savedDrafts);
    }

    // Restore staff session from localStorage
    const savedStaff = storage.get<StaffLoginResponse>("currentStaff");
    if (savedStaff) {
      setCurrentStaff(savedStaff);
    }
  }, []);

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    storage.set("isDarkTheme", isDarkTheme);
  }, [isDarkTheme]);

  // Fetch products, customers, and recent orders from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, customersData, ordersData] = await Promise.all([
          get("/api/products"),
          get("/api/customers"),
          get("/api/orders"),
        ]);
        
        // Convert API products to local format
        const formattedProducts = productsData.map((p: ApiProduct) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
          status: p.status,
        }));
        
        // Get 5 most recent orders (sorted by createdAt descending)
        const recent = ordersData
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setProducts(formattedProducts);
        setCustomers(customersData);
        setRecentOrders(recent);
      } catch (error) {
        // No fallback - data must come from MongoDB
        setProducts([]);
        setCustomers([]);
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [get]);

  // Save draft orders to localStorage
  const saveDraftsToStorage = (drafts: DraftOrder[]) => {
    storage.set("draftOrders", drafts);
  };

  const closeModal = () => setActiveModal(null);

  // Soft refresh - refetch recent orders without page reload
  const fetchRecentOrders = async () => {
    try {
      const ordersData = await get("/api/orders");
      const recent = ordersData
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentOrders(recent);
    } catch (error) {
      console.error("Error refetching recent orders:", error);
    }
  };

  // Search products by name, SKU, lot number, or serial number
  const searchProductsAPI = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await get(`/api/products/search?q=${encodeURIComponent(query)}`);
      
      // Convert API products to local format
      const formattedResults = response.results.map((p: any) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category,
        status: p.status,
        sku: p.sku,
        hasSerialNumbers: p.hasSerialNumbers,
        matchedLot: p.matchedLot,
        matchedSerial: p.matchedSerial,
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchProductsAPI(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Use search results if searching, otherwise filter local products
  const filteredProducts = (searchTerm.trim().length >= 2 && searchResults.length > 0) 
    ? searchResults.filter((product: any) => {
        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;
        const hasStock = product.stock > 0 || (product.hasSerialNumbers === true);
        const isActive = !product.status || product.status === "active";
        
        return matchesCategory && hasStock && isActive;
      })
    : products.filter((product: any) => {
        const searchLower = searchTerm.toLowerCase();
        // Search by product name, SKU, or barcode (local fallback)
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower));
        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;
        // Show products with stock > 0 OR products with serial numbers (even if stock is 0)
        const hasStock = product.stock > 0 || (product.hasSerialNumbers === true);
        // Only show active products (exclude inactive and discontinued)
        const isActive = !product.status || product.status === "active";
        return matchesSearch && matchesCategory && hasStock && isActive;
      });

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const addToCart = (product: Product) => {
    // Prevent double-click (debounce for 200ms)
    if (clickingProductId === product.id) {
      return;
    }

    // Check if staff is logged in
    if (!currentStaff) {
      showNotification.loginRequired("add items to cart");
      setActiveModal("security");
      return;
    }

    // Set clicking state
    setClickingProductId(product.id);

    // Reset after 200ms
    setTimeout(() => {
      setClickingProductId(null);
    }, 200);

    const existing = cartItems.find((item) => item.productId === product.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  const applyItemDiscount = (productId: string, discount: DiscountConfig | null) => {
    setCartItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;
        if (!discount || discount.value <= 0) {
          const { discount: _removed, ...rest } = item;
          return rest;
        }
        return { ...item, discount };
      })
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // Round to 2 decimal places to avoid floating point precision issues
    const roundedQuantity = Math.round(quantity * 100) / 100;
    
    if (roundedQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId ? { ...item, quantity: roundedQuantity } : item
        )
      );
    }
  };

  const saveDraftOrder = () => {
    if (cartItems.length === 0) {
      showNotification.emptyDraft();
      return;
    }

    const newDraft: DraftOrder = {
      id: Date.now().toString(),
      customer: selectedCustomer || "Walk-in",
      items: itemsWithTotals,
      notes: "",
      createdAt: new Date().toLocaleString(),
      total: total,
    };

    const updated = [...draftOrders, newDraft];
    setDraftOrders(updated);
    saveDraftsToStorage(updated);

    // Clear the screen for new customer
    setSelectedCustomer("Walk-in");
    setCartItems([]);
    setSearchTerm("");
    setCustomerSearch("");

    showNotification.draftSaved();
  };

  const resumeDraftOrder = (draft: DraftOrder) => {
    setSelectedCustomer(draft.customer);
    setCartItems(draft.items);

    // Remove the draft from the list
    const updated = draftOrders.filter((d) => d.id !== draft.id);
    setDraftOrders(updated);
    saveDraftsToStorage(updated);

    closeModal();
  };

  const handleCreateOrder = () => {
    if (!currentStaff) {
      showNotification.loginRequired("process payments");
      setActiveModal("security");
      return;
    }

    if (cartItems.length === 0) {
      showNotification.emptyCart();
      return;
    }
    setActiveModal("payment");
  };

  const handlePayment = async (paymentMethod: string) => {
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Prepare order data
      const orderData = {
        orderNumber,
        customer: selectedCustomer || "Walk-in",
        items: itemsWithTotals.map((item) => {
          const payload: any = {
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            discountAmount: item.discountAmount,
            totalAfterDiscount: item.totalAfterDiscount,
          };
          if (item.discount) {
            payload.discount = item.discount;
          }
          return payload;
        }),
        subtotal: subtotalBeforeDiscount,
        itemDiscountTotal,
        subtotalAfterDiscount: subtotalAfterItemDiscount,
        checkoutDiscount: checkoutDiscount ?? undefined,
        checkoutDiscountAmount,
        totalBeforeTax: taxableAmount,
        taxRate,
        taxRateId: selectedTaxRateId !== CUSTOM_TAX_OPTION ? selectedTaxRateId : undefined,
        taxRateLabel: taxRateLabel ?? undefined,
        taxAmount: tax,
        total: total,
        staffId: currentStaff?._id,
        staffName: currentStaff?.name,
        paymentMethod,
      };

      // Create order and deduct stock
      const response = await post("/api/orders", orderData);

      if (response.success) {
        // Set the completed order for receipt printing
        // The actual order data is in response.order, not the response itself
        const orderForReceipt = response.order || response.data || response;
        setCompletedOrder(orderForReceipt);
        setShowReceipt(true);
        
        // Clear cart and reset
        setSelectedCustomer("Walk-in");
        setCartItems([]);
        setCheckoutDiscount(null);
        closeModal();
        
        // Soft refresh - refetch recent orders without hard page reload
        setTimeout(() => {
          fetchRecentOrders();
        }, 500);
      } else {
        showNotification.error(response.error || "Failed to create order");
      }
    } catch (error: any) {
      showNotification.error(error.message || "Unknown error");
    }
  };

  return (
    <>
      <div className={`flex flex-col h-screen ${isDarkTheme ? 'bg-slate-900 dark' : 'bg-slate-100 light'}`}>
        {/* Header */}
        <header className={`${isDarkTheme ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} border-b px-6 py-3 shadow-lg`}>
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoSvg} alt="Teth POS Logo" className="h-12 flex-shrink-0" />
              {/* Logo: use logo-dark when dark theme, else use logo */}
            </div>

            {/* Right - Staff & Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {currentStaff && (
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDarkTheme ? 'bg-white/10 border-white/20' : 'bg-slate-200 border-slate-300'}`}>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className={`text-xs font-semibold truncate max-w-[120px] ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>
                    {currentStaff.name}
                  </span>
                </div>
              )}
              {/* Accounts Button */}
              {currentStaff && currentStaff.role === "Admin" && (
                <button
                  onClick={() => setActiveModal("accounting")}
                  className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                  title="Accounting"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              )}
              {/* Theme Switcher */}
              <button
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveModal("dashboard")}
                className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                title="Dashboard"
              >
                <Activity className="w-4 h-4" />
              </button>
              {currentStaff && currentStaff.role === "Admin" && (
                <button
                  onClick={() => setActiveModal("admin")}
                  className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                  title="Admin"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              {/* Left Column - Customer Info (Optional) */}
              <div className="hidden lg:block space-y-4">
                {/* Customer Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm">Customer</span>
                    <Search className="w-4 h-4 text-slate-400" />
                  </button>
                  {showCustomerDropdown && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                      <div className="p-2 border-b border-slate-200">
                        <input
                          type="text"
                          placeholder="Search customer..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer("Walk-in");
                          setShowCustomerDropdown(false);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 text-sm border-b border-slate-200"
                      >
                        👤 Walk-in (No name)
                      </button>
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer._id}
                          onClick={() => {
                            setSelectedCustomer(customer.name);
                            setShowCustomerDropdown(false);
                            setCustomerSearch("");
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 text-sm border-b border-slate-200 last:border-0"
                        >
                          👤 {customer.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`rounded-lg border p-4 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <Users className={`w-8 h-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      {selectedCustomer}
                    </h3>
                    {selectedCustomer !== "Walk-in" && (
                      <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Loyalty program</p>
                    )}
                  </div>

                  {selectedCustomer !== "Walk-in" && (
                    <div className="space-y-3 text-xs">
                      <div className={`flex justify-between p-2 rounded ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                        <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>STORE</span>
                        <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>0.00</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                        <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>REWARD</span>
                        <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>4200</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                        <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>VISIT</span>
                        <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>19</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Quick Access to Modals */}
                <div className="mb-6 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActiveModal("products")}
                    className={`rounded-lg p-3 font-medium text-sm transition-all flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                  >
                    <Package className="w-5 h-5" />
                    <span>Products</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("customers")}
                    className={`rounded-lg p-3 font-medium text-sm transition-all flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Customers</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("orders")}
                    className={`rounded-lg p-3 font-medium text-sm transition-all flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'}`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Orders</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("history")}
                    className={`rounded-lg p-3 font-medium text-sm transition-all flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                  >
                    <Clock className="w-5 h-5" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("sales")}
                    className={`rounded-lg p-3 font-medium text-sm transition-all flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Sales</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("resume")}
                    className={`rounded-lg p-3 font-medium text-sm transition-all flex flex-col items-center gap-1 relative ${isDarkTheme ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Resume</span>
                    {draftOrders.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {draftOrders.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Recent Orders Section */}
                <div className={`rounded-lg border p-4 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>📋 Recent Orders ({recentOrders.length})</h3>
                  <div className="space-y-2">
                    {recentOrders.length === 0 ? (
                      <p className={`text-xs text-center py-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>No orders yet</p>
                    ) : (
                      recentOrders.map((order: any, index: number) => {
                        const timeAgo = (() => {
                          const now = new Date();
                          const orderTime = new Date(order.createdAt);
                          const diffMs = now.getTime() - orderTime.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffDays = Math.floor(diffMs / 86400000);
                          
                          if (diffMins < 1) return "just now";
                          if (diffMins < 60) return `${diffMins}m ago`;
                          if (diffHours < 24) return `${diffHours}h ago`;
                          return `${diffDays}d ago`;
                        })();

                        return (
                          <div key={order._id} className={`p-2 rounded border transition-colors ${isDarkTheme ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{order.orderNumber}</p>
                                <p className={`text-xs truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{order.customer}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <p className={`text-xs font-bold ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>Rs {order.total.toFixed(2)}</p>
                                <button
                                  onClick={() => {
                                    setCompletedOrder(order);
                                    setShowReceipt(true);
                                  }}
                                  className={`p-1 rounded transition-colors ${isDarkTheme ? 'hover:bg-slate-600 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                                  title="Print receipt"
                                >
                                  <Printer className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>{timeAgo}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Center Column - Product Grid */}
              <div className="lg:col-span-2">
                {/* Product Search and Category Filter */}
                <div className="mb-6 flex gap-3">
                  {/* Product Search Input - Barcode Scanner Compatible */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Search by name, SKU, lot number, or serial number (↓ to select, Enter to add)"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedProductIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        const maxIndex = Math.min(filteredProducts.length - 1, 9);
                        
                        // Arrow Down - move to next product
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setSelectedProductIndex((prev) =>
                            prev < maxIndex ? prev + 1 : 0
                          );
                        }
                        // Arrow Up - move to previous product
                        else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSelectedProductIndex((prev) =>
                            prev > 0 ? prev - 1 : maxIndex
                          );
                        }
                        // Enter - add selected product
                        else if (e.key === "Enter") {
                          e.preventDefault();
                          if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
                            addToCart(filteredProducts[selectedProductIndex]);
                            setSearchTerm("");
                            setSelectedProductIndex(-1);
                          } else if (filteredProducts.length > 0) {
                            addToCart(filteredProducts[0]);
                            setSearchTerm("");
                            setSelectedProductIndex(-1);
                          }
                        }
                        // Escape - clear search
                        else if (e.key === "Escape") {
                          setSearchTerm("");
                          setSelectedProductIndex(-1);
                        }
                      }}
                      autoFocus
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 font-medium"
                    />
                    {/* Search Results - Show below input */}
                    {searchTerm && filteredProducts.length > 0 && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-white border-2 border-slate-300 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                        <div className="sticky top-0 bg-slate-100 px-4 py-2 border-b border-slate-300">
                          <p className="text-xs font-semibold text-slate-600">
                            ↓↑ Navigate • Enter to add • Esc to clear
                          </p>
                        </div>
                        {filteredProducts.slice(0, 10).map((product, index) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              addToCart(product);
                              setSearchTerm("");
                              setSelectedProductIndex(-1);
                            }}
                            className={`w-full text-left px-4 py-3 focus:outline-none text-sm border-b border-slate-200 last:border-0 flex justify-between items-center transition-colors ${
                              selectedProductIndex === index
                                ? "bg-blue-500 text-white font-semibold"
                                : "hover:bg-blue-100 text-slate-700"
                            }`}
                            tabIndex={-1}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                <span className={`text-xs ${
                                  selectedProductIndex === index ? "text-blue-100" : "text-slate-500"
                                }`}>({index + 1})</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs ${
                                  selectedProductIndex === index ? "text-blue-100" : "text-slate-500"
                                }`}>
                                  Stock: {product.stock}
                                </span>
                                {product.matchedLot && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    selectedProductIndex === index 
                                      ? "bg-blue-400 text-white" 
                                      : "bg-purple-100 text-purple-700"
                                  }`}>
                                    📦 Lot: {product.matchedLot}
                                  </span>
                                )}
                                {product.matchedSerial && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    selectedProductIndex === index 
                                      ? "bg-blue-400 text-white" 
                                      : "bg-green-100 text-green-700"
                                  }`}>
                                    🔢 Serial: {product.matchedSerial}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`font-bold text-sm ${
                              selectedProductIndex === index ? "text-blue-100" : "text-blue-600"
                            }`}>
                              Rs {product.price.toFixed(2)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {loading ? (
                    <div className="col-span-full text-center py-8 text-slate-400">
                      <p>Loading products...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-slate-400">
                      <p>No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isClicking = clickingProductId === product.id;
                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className={`border rounded-lg p-2 transition-all group relative ${
                            isDarkTheme
                              ? `bg-slate-700 border-slate-600 ${
                                  isClicking ? "scale-98" : "hover:bg-slate-600"
                                }`
                              : `bg-slate-100 border-slate-300 ${
                                  isClicking ? "scale-98" : "hover:bg-slate-200"
                                }`
                          }`}
                        >
                          <h4 className={`text-xs font-semibold text-left line-clamp-2 mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-sm ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                              Rs {product.price.toFixed(2)}
                            </span>
                            <Plus className={`w-3 h-3 transition-opacity ${
                              isDarkTheme ? 'text-green-400' : 'text-green-600'
                            } ${
                              isClicking ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`} />
                          </div>
                          {/* Stock Display */}
                          <div className={`text-xs mt-1 text-left ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                            Stock: <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{product.stock}</span>
                          </div>
                          {product.stock <= 0 && (
                            <div className="absolute top-0.5 right-0.5 bg-red-700 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                              Out
                            </div>
                          )}
                          {product.stock > 0 && product.stock < 10 && (
                            <div className="absolute top-0.5 right-0.5 bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded">
                              Low
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column - Order Summary & Payment */}
              <div className={`rounded-lg border p-6 flex flex-col sticky top-6 h-fit max-h-[calc(100vh-120px)] ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>TOTAL</h3>

                {/* Items List */}
                <div className="flex-1 overflow-auto mb-4 space-y-2 min-h-0">
                  {cartItems.length === 0 ? (
                    <div className={`text-center py-8 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No items</p>
                    </div>
                  ) : (
                    itemsWithTotals.map((item) => (
                      <div key={item.productId} className={`p-2 rounded border ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className={`font-semibold text-xs flex-1 line-clamp-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setDiscountingItemId(item.productId);
                                setShowDiscountModal(true);
                              }}
                              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                                item.discount
                                  ? isDarkTheme
                                    ? 'bg-green-600/50 text-green-300 hover:bg-green-600'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : isDarkTheme
                                  ? 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                              title="Apply discount"
                            >
                              <Percent className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className={`font-bold ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                              Rs {item.totalAfterDiscount.toFixed(2)}
                            </span>
                            {item.discountAmount > 0 && (
                              <span className={`text-xs ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                                -Rs {item.discountAmount.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, Math.max(0.1, item.quantity - 0.1))
                              }
                              className={`px-1.5 py-0.5 rounded font-bold text-xs ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              key={`qty-${item.productId}-${item.quantity}`}
                              defaultValue={item.quantity}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  updateQuantity(item.productId, value);
                                } else {
                                  updateQuantity(item.productId, 0.1);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              step="0.1"
                              className={`w-12 text-center rounded px-0.5 py-0.5 text-xs ${isDarkTheme ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                              min="0.1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 0.1)
                              }
                              className={`px-1.5 py-0.5 rounded font-bold text-xs ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Auth Status */}
                {!currentStaff && (
                  <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-xs font-semibold">
                      ⚠️ Please login to process transactions
                    </p>
                  </div>
                )}

                {/* Tax Rate Control */}
                <div className={`border-t pt-4 mb-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                  <label className={`block text-xs font-semibold mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    TAX RATE
                  </label>
                  {taxRatesError && (
                    <div className={`flex items-center justify-between text-xs mb-2 rounded border px-3 py-2 ${isDarkTheme ? 'border-red-500/40 bg-red-900/40 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                      <span>{taxRatesError}</span>
                      <button
                        type="button"
                        onClick={handleRetryFetchTaxRates}
                        className={`ml-2 text-xs font-semibold underline ${isDarkTheme ? 'text-red-200 hover:text-red-100' : 'text-red-700 hover:text-red-800'}`}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <select
                      value={selectedTaxRateId}
                      onChange={(e) => handleTaxRateSelect(e.target.value)}
                      disabled={taxRatesLoading}
                      className={`w-full border rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                    >
                      {taxRates.map((rate) => (
                        <option key={rate._id} value={rate._id}>
                          {rate.name} ({(rate.rate * 100).toFixed(2)}%)
                        </option>
                      ))}
                      <option value={CUSTOM_TAX_OPTION}>Custom</option>
                    </select>
                    {selectedTaxRateId === CUSTOM_TAX_OPTION && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={(taxRate * 100).toFixed(2)}
                          onChange={(e) => handleCustomTaxRateChange(e.target.value)}
                          className={`flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                          placeholder="0"
                        />
                        <span className={`text-sm font-semibold py-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkout Discount */}
                <div className={`border-t pt-4 mb-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                  <button
                    onClick={() => setShowCheckoutDiscountModal(true)}
                    className={`w-full py-2 px-3 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      checkoutDiscount
                        ? isDarkTheme
                          ? 'bg-green-600/50 text-green-300 hover:bg-green-600'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        : isDarkTheme
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    {checkoutDiscount
                      ? `Checkout Discount: ${checkoutDiscount.type === 'percentage' ? `${checkoutDiscount.value}%` : `Rs ${checkoutDiscount.value}`}`
                      : 'Add Checkout Discount'}
                  </button>
                </div>

                {/* Summary */}
                <div className={`border-t pt-4 space-y-2 mb-6 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                  <div className={`flex justify-between text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span>Subtotal</span>
                    <span>Rs {subtotalBeforeDiscount.toFixed(2)}</span>
                  </div>
                  {itemDiscountTotal > 0 && (
                    <div className={`flex justify-between text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                      <span>Item Discounts</span>
                      <span>-Rs {itemDiscountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span>Subtotal After Discounts</span>
                    <span>Rs {subtotalAfterItemDiscount.toFixed(2)}</span>
                  </div>
                  {checkoutDiscountAmount > 0 && (
                    <div className={`flex justify-between text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                      <span>
                        Checkout Discount
                        {checkoutDiscount && checkoutDiscount.type === 'percentage'
                          ? ` (${checkoutDiscount.value}%)`
                          : ''}
                      </span>
                      <span>-Rs {checkoutDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span>
                      Tax ({(taxRate * 100).toFixed(1)}%{taxRateLabel ? ` • ${taxRateLabel}` : ""})
                    </span>
                    <span>Rs {tax.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between text-2xl font-bold pt-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    <span>Total</span>
                    <span>Rs {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => setActiveModal("security")}
                      className={`px-3 py-2 rounded font-semibold text-sm transition-colors flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-400 hover:bg-slate-500 text-white'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <div className="text-xs">Security</div>
                    </button>
                    <button
                      onClick={() => setActiveModal("returns")}
                      className={`px-3 py-2 rounded font-semibold text-sm transition-colors flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1 .12-4.49"></path>
                      </svg>
                      <div className="text-xs">Returns</div>
                    </button>
                    <button
                      onClick={saveDraftOrder}
                      disabled={cartItems.length === 0}
                      className={`px-3 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50 flex flex-col items-center gap-1 ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      <div className="text-xs">Draft</div>
                    </button>
                  </div>
                  <button
                    onClick={handleCreateOrder}
                    disabled={cartItems.length === 0 || !currentStaff}
                    title={!currentStaff ? "Please login to process payments" : cartItems.length === 0 ? "Add items to cart" : "Process payment"}
                    className={`w-full px-4 py-3 rounded font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${isDarkTheme ? 'bg-lime-500 hover:bg-lime-600 text-slate-900' : 'bg-lime-600 hover:bg-lime-700 text-white'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                      <circle cx="17" cy="17" r="3"></circle>
                    </svg>
                    {!currentStaff ? "LOGIN REQUIRED" : "PAY"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {activeModal === "products" && <ProductsModal isDarkTheme={isDarkTheme} onClose={closeModal} onProductsUpdated={(updatedProducts: any) => setProducts(updatedProducts)} />}
      {activeModal === "customers" && <CustomersModal isDarkTheme={isDarkTheme} onClose={closeModal} />}
      {activeModal === "orders" && <OrdersModal isDarkTheme={isDarkTheme} onClose={closeModal} />}
      {activeModal === "history" && <OrderHistoryModal isDarkTheme={isDarkTheme} onClose={closeModal} />}
      {activeModal === "sales" && <SalesReportModal isDarkTheme={isDarkTheme} onClose={closeModal} />}
      {activeModal === "dashboard" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`bg-${isDarkTheme ? 'slate-800' : 'white'} rounded-lg border border-${isDarkTheme ? 'slate-700' : 'slate-200'} shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col`}>
            <div className="flex items-center justify-between p-6 border-b border-${isDarkTheme ? 'slate-700' : 'slate-200'}">
              <h2 className={`text-2xl font-bold text-${isDarkTheme ? 'white' : 'slate-900'} flex items-center gap-2`}>
                <Activity className="w-7 h-7 text-green-400" />
                Inventory Dashboard
              </h2>
              <button
                onClick={closeModal}
                className="text-${isDarkTheme ? 'slate-400' : 'slate-600'} hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className={`flex-1 overflow-auto p-6 bg-${isDarkTheme ? 'slate-800' : 'white'} ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              <InventoryWidgets isDarkTheme={isDarkTheme} />
            </div>
            <div className="border-t border-${isDarkTheme ? 'slate-700' : 'slate-200'} p-6 flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {activeModal === "resume" && (
        <ResumeOrderModal
          isDarkTheme={isDarkTheme}
          draftOrders={draftOrders}
          onResume={resumeDraftOrder}
          onClose={closeModal}
        />
      )}
      {activeModal === "payment" && (
        <PaymentModalComponent
          isDarkTheme={isDarkTheme}
          total={total}
          customer={selectedCustomer}
          staff={null}
          onPayment={handlePayment}
          onClose={closeModal}
        />
      )}
      {showReceipt && completedOrder && branding && (
        <ThermalReceipt
          order={completedOrder}
          brandingConfig={{
            storeName: branding.storeName,
            phone: branding.phone,
            city: branding.city,
            email: branding.email,
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
      {showDiscountModal && discountingItemId && (
        <DiscountModalComponent
          isDarkTheme={isDarkTheme}
          itemName={cartItems.find((item) => item.productId === discountingItemId)?.name}
          subtotal={
            (cartItems.find((item) => item.productId === discountingItemId)?.price || 0) *
            (cartItems.find((item) => item.productId === discountingItemId)?.quantity || 1)
          }
          currentDiscount={cartItems.find((item) => item.productId === discountingItemId)?.discount}
          onApply={(discount) => {
            applyItemDiscount(discountingItemId, discount);
            setShowDiscountModal(false);
            setDiscountingItemId(null);
          }}
          onClose={() => {
            setShowDiscountModal(false);
            setDiscountingItemId(null);
          }}
        />
      )}
      {showCheckoutDiscountModal && (
        <DiscountModalComponent
          isDarkTheme={isDarkTheme}
          itemName="Checkout Discount"
          subtotal={subtotalAfterItemDiscount}
          currentDiscount={checkoutDiscount}
          onApply={(discount) => {
            setCheckoutDiscount(discount);
            setShowCheckoutDiscountModal(false);
          }}
          onClose={() => setShowCheckoutDiscountModal(false)}
        />
      )}
      {activeModal === "security" && (
        <StaffLoginModal
          isDarkTheme={isDarkTheme}
          onClose={closeModal}
          onLoginSuccess={(staff) => {
            setCurrentStaff(staff);
            // Save staff session to localStorage
            storage.set("currentStaff", staff);
            closeModal();
          }}
          currentStaff={currentStaff}
        />
      )}
      {activeModal === "admin" && <AdminModal isDarkTheme={isDarkTheme} onClose={closeModal} userRole={currentStaff?.role} />}
      {activeModal === "returns" && <ReturnsModal isDarkTheme={isDarkTheme} onClose={closeModal} />}
      {activeModal === "accounting" && <AccountingModal isDarkTheme={isDarkTheme} onClose={closeModal} />}
    </>
  );
}

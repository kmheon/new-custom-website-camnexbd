import { create } from 'zustand';
import { CartItem, Product, SiteSettings, User, Role, Customer } from '../types';
import { cartService, cmsService } from '../services';
import { apiFetch, fetchCsrfToken, setCachedCsrfToken } from '../services/apiClient';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  loadCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number, formFactor?: string, pkgConfig?: any) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  loadCart: async () => {
    set({ isLoading: true });
    try {
      const items = await cartService.getCart();
      set({ items });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product: Product, quantity = 1, formFactor, pkgConfig) => {
    const unitPrice = product.pricing.salePrice || product.pricing.regularPrice || 0;
    const items = await cartService.addItem({
      productId: product.id,
      product,
      quantity,
      selectedFormFactor: formFactor as any,
      pricePerUnit: unitPrice,
      packageConfig: pkgConfig
    });
    set({ items });
  },

  updateQuantity: async (lineId: string, quantity: number) => {
    const items = await cartService.updateQuantity(lineId, quantity);
    set({ items });
  },

  removeItem: async (lineId: string) => {
    const items = await cartService.removeItem(lineId);
    set({ items });
  },

  clearCart: async () => {
    await cartService.clearCart();
    set({ items: [] });
  },

  totalCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },

  subtotal: () => {
    return get().items.reduce((acc, item) => acc + (item.pricePerUnit * item.quantity), 0);
  }
}));

// ----------------------------------------------------------------------------
// Compare Store
// ----------------------------------------------------------------------------
interface CompareState {
  productIds: string[];
  addProduct: (id: string) => boolean;
  removeProduct: (id: string) => void;
  clearCompare: () => void;
  hasProduct: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  productIds: [],
  addProduct: (id: string) => {
    const current = get().productIds;
    if (current.includes(id)) return true;
    if (current.length >= 4) return false;
    set({ productIds: [...current, id] });
    return true;
  },
  removeProduct: (id: string) => {
    set({ productIds: get().productIds.filter(i => i !== id) });
  },
  clearCompare: () => set({ productIds: [] }),
  hasProduct: (id: string) => get().productIds.includes(id)
}));

// ----------------------------------------------------------------------------
// Admin & Auth Store (Real Sessions + RBAC)
// ----------------------------------------------------------------------------
interface AdminAuthState {
  currentUser: User | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  currentUser: null,
  isAdminAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    try {
      const data = await apiFetch<{ authenticated: boolean; user: any }>('/auth/me');
      if (data && data.authenticated && data.user && data.user.role === 'admin') {
        set({ currentUser: data.user, isAdminAuthenticated: true, error: null });
        return true;
      }
      set({ currentUser: null, isAdminAuthenticated: false });
      return false;
    } catch (_) {
      set({ currentUser: null, isAdminAuthenticated: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await fetchCsrfToken();
      const data = await apiFetch<{ success: boolean; user: any; csrfToken?: string }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data && data.csrfToken) {
        setCachedCsrfToken(data.csrfToken);
      }

      set({ currentUser: data.user, isAdminAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (_) {
    } finally {
      set({ currentUser: null, isAdminAuthenticated: false });
    }
  }
}));

// ----------------------------------------------------------------------------
// Customer Auth Store (Private Order History)
// ----------------------------------------------------------------------------
interface CustomerAuthState {
  currentCustomer: Customer | null;
  isCustomerAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkCustomerAuth: () => Promise<boolean>;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, password: string, email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMyOrders: () => Promise<any[]>;
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  currentCustomer: null,
  isCustomerAuthenticated: false,
  isLoading: false,
  error: null,

  checkCustomerAuth: async () => {
    try {
      const data = await apiFetch<{ authenticated: boolean; user: any }>('/auth/me');
      if (data && data.authenticated && data.user && data.user.role === 'customer') {
        set({
          currentCustomer: {
            id: data.user.id,
            name: data.user.name,
            phone: '',
            email: data.user.email,
            customerType: 'individual',
            addresses: [],
            createdAt: ''
          },
          isCustomerAuthenticated: true,
          error: null
        });
        return true;
      }
      set({ currentCustomer: null, isCustomerAuthenticated: false });
      return false;
    } catch (_) {
      set({ currentCustomer: null, isCustomerAuthenticated: false });
      return false;
    }
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      await fetchCsrfToken();
      const data = await apiFetch<{ success: boolean; customer: Customer; csrfToken?: string }>('/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });

      if (data && data.csrfToken) {
        setCachedCsrfToken(data.csrfToken);
      }

      set({ currentCustomer: data.customer, isCustomerAuthenticated: true, isLoading: false, error: null });
      useWishlistStore.getState().mergeGuestWishlist();
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (name, phone, password, email) => {
    set({ isLoading: true, error: null });
    try {
      await fetchCsrfToken();
      const data = await apiFetch<{ success: boolean; customer: Customer; csrfToken?: string }>('/auth/customer/register', {
        method: 'POST',
        body: JSON.stringify({ name, phone, password, email })
      });

      if (data && data.csrfToken) {
        setCachedCsrfToken(data.csrfToken);
      }

      set({ currentCustomer: data.customer, isCustomerAuthenticated: true, isLoading: false, error: null });
      useWishlistStore.getState().mergeGuestWishlist();
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (_) {
    } finally {
      set({ currentCustomer: null, isCustomerAuthenticated: false });
    }
  },

  fetchMyOrders: async () => {
    return apiFetch<any[]>('/customer/orders');
  }
}));

// ----------------------------------------------------------------------------
// Site Settings Store
// ----------------------------------------------------------------------------
interface SettingsState {
  settings: SiteSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loadSettings: async () => {
    const s = await cmsService.getSiteSettings();
    set({ settings: s });
  },
  updateSettings: async (newSettings) => {
    const updated = await cmsService.updateSiteSettings(newSettings);
    set({ settings: updated });
  }
}));

// ----------------------------------------------------------------------------
// Wishlist Store
// ----------------------------------------------------------------------------
const WISHLIST_STORAGE_KEY = 'camnex_wishlist_items';

function getStoredWishlist(): string[] {
  try {
    const val = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return val ? JSON.parse(val) : [];
  } catch (_) {
    return [];
  }
}

function saveStoredWishlist(items: string[]): void {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
}

interface WishlistState {
  wishlistIds: string[];
  wishlistProducts: Product[];
  isLoading: boolean;
  toastMessage: string | null;
  loadWishlist: (isLoggedIn?: boolean) => Promise<void>;
  toggleWishlist: (product: Product, isLoggedIn?: boolean) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string, isLoggedIn?: boolean) => Promise<void>;
  mergeGuestWishlist: () => Promise<void>;
  clearToast: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistIds: getStoredWishlist(),
  wishlistProducts: [],
  isLoading: false,
  toastMessage: null,

  count: () => get().wishlistIds.length,

  isInWishlist: (productId: string) => {
    return get().wishlistIds.includes(productId);
  },

  clearToast: () => {
    set({ toastMessage: null });
  },

  loadWishlist: async (isLoggedIn = false) => {
    if (!isLoggedIn) {
      const ids = getStoredWishlist();
      set({ wishlistIds: ids });
      return;
    }
    set({ isLoading: true });
    try {
      const products = await apiFetch<Product[]>('/wishlist');
      const ids = products.map(p => p.id);
      saveStoredWishlist(ids);
      set({ wishlistIds: ids, wishlistProducts: products });
    } catch (_) {
      const ids = getStoredWishlist();
      set({ wishlistIds: ids });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (product: Product, isLoggedIn = false) => {
    const current = get().wishlistIds;
    const exists = current.includes(product.id);
    let nextIds: string[];
    let isAdded = false;

    if (exists) {
      nextIds = current.filter(id => id !== product.id);
      set({
        wishlistIds: nextIds,
        wishlistProducts: get().wishlistProducts.filter(p => p.id !== product.id),
        toastMessage: `${product.name} removed from your wishlist.`
      });
      isAdded = false;
    } else {
      nextIds = [...current, product.id];
      set({
        wishlistIds: nextIds,
        wishlistProducts: [...get().wishlistProducts, product],
        toastMessage: `${product.name} added to your wishlist.`
      });
      isAdded = true;
    }

    saveStoredWishlist(nextIds);

    if (isLoggedIn) {
      try {
        await fetchCsrfToken();
        if (exists) {
          await apiFetch(`/wishlist/${product.id}`, { method: 'DELETE' });
        } else {
          await apiFetch(`/wishlist/${product.id}`, { method: 'PUT' });
        }
      } catch (_) {
        // Fallback to local storage if API call fails
      }
    }

    return isAdded;
  },

  removeFromWishlist: async (productId: string, isLoggedIn = false) => {
    const nextIds = get().wishlistIds.filter(id => id !== productId);
    set({
      wishlistIds: nextIds,
      wishlistProducts: get().wishlistProducts.filter(p => p.id !== productId)
    });
    saveStoredWishlist(nextIds);

    if (isLoggedIn) {
      try {
        await fetchCsrfToken();
        await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
      } catch (_) {}
    }
  },

  mergeGuestWishlist: async () => {
    const localIds = getStoredWishlist();
    if (localIds.length === 0) return;
    try {
      await fetchCsrfToken();
      await apiFetch('/wishlist/merge', {
        method: 'POST',
        body: JSON.stringify({ productIds: localIds })
      });
      // Refresh list after merge
      const products = await apiFetch<Product[]>('/wishlist');
      const ids = products.map(p => p.id);
      saveStoredWishlist(ids);
      set({ wishlistIds: ids, wishlistProducts: products });
    } catch (_) {}
  }
}));


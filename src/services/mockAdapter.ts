import {
  IProductService,
  ICategoryService,
  IBrandService,
  ISpecTemplateService,
  IPackageService,
  ICartService,
  IOrderService,
  IQuoteService,
  ICmsService,
  IProductResearchService,
  ProductFilterParams,
  PaginatedResult
} from '../api/contracts';
import {
  Product,
  Category,
  Brand,
  SpecTemplate,
  SecurityPackage,
  CartItem,
  Order,
  QuoteRequest,
  SiteSettings,
  HomepageSection,
  BlogPost,
  ProjectCaseStudy,
  Testimonial,
  FaqItem,
  ProductResearchResult,
  DeliveryMethod,
  InstallationOption,
  HeroSlide,
  HeroFeatureHighlight
} from '../types';
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_SPEC_TEMPLATES,
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_PACKAGES,
  INITIAL_BLOG_POSTS,
  INITIAL_PROJECTS,
  INITIAL_TESTIMONIALS,
  INITIAL_FAQS,
  INITIAL_CTA_DATA,
  INITIAL_HERO_SLIDES
} from './seedData';

const STORAGE_KEYS = {
  SETTINGS: 'camnex_settings_v1',
  SECTIONS: 'camnex_sections_v1',
  SLIDES: 'camnex_hero_slides_v1',
  TEMPLATES: 'camnex_templates_v1',
  BRANDS: 'camnex_brands_v1',
  CATEGORIES: 'camnex_categories_v1',
  PRODUCTS: 'camnex_products_v1',
  PACKAGES: 'camnex_packages_v1',
  CART: 'camnex_cart_v1',
  ORDERS: 'camnex_orders_v1',
  QUOTES: 'camnex_quotes_v1',
  BLOG: 'camnex_blog_v1',
  PROJECTS: 'camnex_projects_v1',
  TESTIMONIALS: 'camnex_testimonials_v1',
  FAQS: 'camnex_faqs_v1'
};

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// ----------------------------------------------------------------------------
// Product Service Implementation
// ----------------------------------------------------------------------------
export class MockProductService implements IProductService {
  async getProducts(params?: ProductFilterParams): Promise<PaginatedResult<Product>> {
    let list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    if (params?.categorySlug) {
      const categories = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      const cat = categories.find(c => c.slug === params.categorySlug || c.id === params.categorySlug);
      if (cat) {
        list = list.filter(p => p.categoryId === cat.id || p.category.toLowerCase() === cat.name.toLowerCase());
      }
    }

    if (params?.brandSlug) {
      const brands = getStorage<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
      const b = brands.find(br => br.slug === params.brandSlug);
      if (b) {
        list = list.filter(p => p.brandId === b.id);
      }
    }

    if (params?.search) {
      const s = params.search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.modelNumber.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        p.shortDescription.toLowerCase().includes(s)
      );
    }

    if (params?.minPrice !== undefined) {
      list = list.filter(p => (p.pricing.regularPrice ?? 0) >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      list = list.filter(p => (p.pricing.regularPrice ?? 0) <= params.maxPrice!);
    }

    // Dynamic spec filter matching
    if (params?.specFilters && Object.keys(params.specFilters).length > 0) {
      list = list.filter(p => {
        for (const [key, filterVal] of Object.entries(params.specFilters!)) {
          if (!filterVal) continue;
          const pVal = p.specifications?.[key];
          if (pVal === undefined) return false;
          if (String(pVal).toLowerCase() !== String(filterVal).toLowerCase()) {
            return false;
          }
        }
        return true;
      });
    }

    // Sorting
    if (params?.sortBy === 'price_asc') {
      list.sort((a, b) => (a.pricing.regularPrice ?? 999999) - (b.pricing.regularPrice ?? 999999));
    } else if (params?.sortBy === 'price_desc') {
      list.sort((a, b) => (b.pricing.regularPrice ?? 0) - (a.pricing.regularPrice ?? 0));
    } else if (params?.sortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params?.sortBy === 'popular') {
      list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return { items, total, page, totalPages };
  }

  async getProductById(id: string): Promise<Product | null> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return list.find(p => p.id === id || p.sku === id) || null;
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return list.find(p => p.sku === sku) || null;
  }

  async getFeaturedProducts(limit = 4): Promise<Product[]> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return list.filter(p => p.isFeatured).slice(0, limit);
  }

  async getPopularProducts(limit = 4): Promise<Product[]> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return list.filter(p => p.isPopular).slice(0, limit);
  }

  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const target = list.find(p => p.id === productId);
    if (!target) return list.slice(0, limit);
    return list.filter(p => p.id !== productId && p.categoryId === target.categoryId).slice(0, limit);
  }

  async getCompatibleAccessories(productId: string): Promise<Product[]> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    // Return connectors, power or DVRs
    return list.filter(p => p.id !== productId).slice(0, 3);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newProduct);
    setStorage(STORAGE_KEYS.PRODUCTS, list);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    const updated: Product = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    setStorage(STORAGE_KEYS.PRODUCTS, list);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    let list = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    list = list.filter(p => p.id !== id);
    setStorage(STORAGE_KEYS.PRODUCTS, list);
    return true;
  }

  async getAvailableSpecFiltersForCategory(categorySlug: string): Promise<Record<string, string[]>> {
    const categories = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const cat = categories.find(c => c.slug === categorySlug || c.id === categorySlug);
    const templates = getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
    const tpl = templates.find(t => t.categorySlug === categorySlug || (cat && (t.categorySlug === cat.slug || t.id === cat.specTemplateId)));
    if (!tpl) return {};

    const products = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = cat ? products.filter(p => p.categoryId === cat.id || p.category.toLowerCase() === cat.name.toLowerCase()) : products;

    const result: Record<string, string[]> = {};
    for (const field of tpl.fields) {
      if (field.filterable) {
        const uniqueValues = new Set<string>();
        filtered.forEach(p => {
          const val = p.specifications?.[field.key];
          if (val !== undefined && val !== null && val !== '') {
            uniqueValues.add(String(val));
          }
        });
        if (uniqueValues.size > 0) {
          result[field.key] = Array.from(uniqueValues);
        }
      }
    }
    return result;
  }
}

// ----------------------------------------------------------------------------
// Category & Brand Services
// ----------------------------------------------------------------------------
export class MockCategoryService implements ICategoryService {
  async getCategories(): Promise<Category[]> {
    return getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const list = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    return list.find(c => c.slug === slug || c.id === slug) || null;
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const list = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const newCat: Category = { ...category, id: `cat-${Date.now()}` };
    list.push(newCat);
    setStorage(STORAGE_KEYS.CATEGORIES, list);
    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const list = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    list[idx] = { ...list[idx], ...updates };
    setStorage(STORAGE_KEYS.CATEGORIES, list);
    return list[idx];
  }

  async deleteCategory(id: string): Promise<boolean> {
    let list = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    list = list.filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.CATEGORIES, list);
    return true;
  }
}

export class MockBrandService implements IBrandService {
  async getBrands(): Promise<Brand[]> {
    return getStorage<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const list = getStorage<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    return list.find(b => b.slug === slug) || null;
  }

  async createBrand(brand: Omit<Brand, 'id'>): Promise<Brand> {
    const list = getStorage<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    const newB: Brand = { ...brand, id: `b-${Date.now()}` };
    list.push(newB);
    setStorage(STORAGE_KEYS.BRANDS, list);
    return newB;
  }

  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
    const list = getStorage<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Brand not found');
    list[idx] = { ...list[idx], ...updates };
    setStorage(STORAGE_KEYS.BRANDS, list);
    return list[idx];
  }
}

// ----------------------------------------------------------------------------
// Specification Template Service
// ----------------------------------------------------------------------------
export class MockSpecTemplateService implements ISpecTemplateService {
  async getTemplates(): Promise<SpecTemplate[]> {
    return getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
  }

  async getTemplateById(id: string): Promise<SpecTemplate | null> {
    const list = getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
    return list.find(t => t.id === id) || null;
  }

  async getTemplateByCategorySlug(categorySlug: string): Promise<SpecTemplate | null> {
    const list = getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
    const direct = list.find(t => t.categorySlug === categorySlug || t.id === categorySlug);
    if (direct) return direct;

    const categories = getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const cat = categories.find(c => c.slug === categorySlug || c.id === categorySlug);
    if (cat) {
      return list.find(t => t.categorySlug === cat.slug || t.id === cat.specTemplateId) || null;
    }
    return null;
  }

  async saveTemplate(template: SpecTemplate): Promise<SpecTemplate> {
    const list = getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
    const idx = list.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      list[idx] = template;
    } else {
      list.push(template);
    }
    setStorage(STORAGE_KEYS.TEMPLATES, list);
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    let list = getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
    list = list.filter(t => t.id !== id);
    setStorage(STORAGE_KEYS.TEMPLATES, list);
    return true;
  }
}

// ----------------------------------------------------------------------------
// Package Builder Service
// ----------------------------------------------------------------------------
export class MockPackageService implements IPackageService {
  async getPackages(): Promise<SecurityPackage[]> {
    return getStorage<SecurityPackage[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
  }

  async getPackageBySlug(slug: string): Promise<SecurityPackage | null> {
    const list = getStorage<SecurityPackage[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
    return list.find(p => p.slug === slug) || null;
  }

  async calculatePackagePrice(config: {
    packageId: string;
    cameraCount: number;
    formFactor: string;
  }): Promise<{
    totalPrice: number | null;
    quotationRequired?: boolean;
    quotationReason?: string | null;
    components: Array<{
      role?: string;
      name: string;
      model: string;
      sku?: string;
      qty: number;
      unitPrice?: number | null;
      lineTotal?: number | null;
    }>;
  }> {
    const { cameraCount, formFactor } = config;
    const count = cameraCount || 4;
    const ff = (formFactor || 'bullet').toLowerCase();

    const camSku = (ff === 'dome' || ff === 'turret') ? 'prod-hik-dome-2mp' : 'prod-hik-irpf-2mp';
    const dvrSku = count <= 4 ? 'prod-hik-dvr-4ch' : count <= 8 ? 'prod-hik-dvr-8ch' : 'prod-hik-dvr-16ch';
    const hddSku = count <= 4 ? 'prod-wd-purple-500gb' : count <= 8 ? 'prod-wd-purple-1tb' : 'prod-wd-purple-2tb';
    const cableMeters = count * 10;
    const powerSku = count > 8 ? 'acc-power-16ch' : 'acc-power';

    const products = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const findProduct = (idOrSku: string) => products.find(p => p.id === idOrSku || p.sku === idOrSku);

    const plan = [
      { role: 'camera', sku: camSku, qty: count, fallback: `Hikvision 2MP ${ff.toUpperCase()} Camera` },
      { role: 'recorder', sku: dvrSku, qty: 1, fallback: `Hikvision Turbo HD DVR (${count > 8 ? '16-Ch' : count > 4 ? '8-Ch' : '4-Ch'})` },
      { role: 'storage', sku: hddSku, qty: 1, fallback: `Western Digital Purple Surveillance HDD (${count >= 16 ? '2TB' : count >= 8 ? '1TB' : '500GB'})` },
      { role: 'cable', sku: 'cable-cat6', qty: cableMeters, fallback: `Pure Copper Cat6 UTP Cable (${cableMeters}m)` },
      { role: 'power', sku: powerSku, qty: 1, fallback: 'Centralized 12V Regulated DC Power Supply Unit' },
      { role: 'connectors', sku: 'acc-balun', qty: count, fallback: `HD Video Baluns & DC Connectors (${count} Sets)` }
    ];

    let quotationRequired = false;
    let totalPrice = 0;
    const missing: string[] = [];

    const components = plan.map(item => {
      const prod = findProduct(item.sku);
      const name = prod?.name || item.fallback;
      const model = prod?.modelNumber || item.sku;
      const unitPrice = (prod?.pricing?.regularPrice && prod.pricing.regularPrice > 0) ? prod.pricing.regularPrice : null;

      if (unitPrice === null) {
        quotationRequired = true;
        missing.push(name);
        return {
          role: item.role,
          name,
          model,
          sku: item.sku,
          qty: item.qty,
          unitPrice: null,
          lineTotal: null
        };
      } else {
        const lineTotal = unitPrice * item.qty;
        totalPrice += lineTotal;
        return {
          role: item.role,
          name,
          model,
          sku: item.sku,
          qty: item.qty,
          unitPrice,
          lineTotal
        };
      }
    });

    return {
      totalPrice: quotationRequired ? null : totalPrice,
      quotationRequired,
      quotationReason: quotationRequired ? `One or more components (${missing.join(', ')}) require custom pricing quotation.` : null,
      components
    };
  }

  async savePackage(pkg: SecurityPackage): Promise<SecurityPackage> {
    const list = getStorage<SecurityPackage[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
    const idx = list.findIndex(p => p.id === pkg.id);
    if (idx !== -1) {
      list[idx] = pkg;
    } else {
      list.push(pkg);
    }
    setStorage(STORAGE_KEYS.PACKAGES, list);
    return pkg;
  }
}

// ----------------------------------------------------------------------------
// Cart Service Implementation
// ----------------------------------------------------------------------------
export class MockCartService implements ICartService {
  async getCart(): Promise<CartItem[]> {
    return getStorage<CartItem[]>(STORAGE_KEYS.CART, []);
  }

  async addItem(item: Omit<CartItem, 'id'>): Promise<CartItem[]> {
    const cart = getStorage<CartItem[]>(STORAGE_KEYS.CART, []);
    const existing = cart.find(c => c.productId === item.productId && c.selectedFormFactor === item.selectedFormFactor);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({ ...item, id: `line-${Date.now()}` });
    }
    setStorage(STORAGE_KEYS.CART, cart);
    return cart;
  }

  async updateQuantity(lineId: string, quantity: number): Promise<CartItem[]> {
    let cart = getStorage<CartItem[]>(STORAGE_KEYS.CART, []);
    if (quantity <= 0) {
      cart = cart.filter(c => c.id !== lineId);
    } else {
      const line = cart.find(c => c.id === lineId);
      if (line) line.quantity = quantity;
    }
    setStorage(STORAGE_KEYS.CART, cart);
    return cart;
  }

  async removeItem(lineId: string): Promise<CartItem[]> {
    let cart = getStorage<CartItem[]>(STORAGE_KEYS.CART, []);
    cart = cart.filter(c => c.id !== lineId);
    setStorage(STORAGE_KEYS.CART, cart);
    return cart;
  }

  async clearCart(): Promise<void> {
    setStorage(STORAGE_KEYS.CART, []);
  }

  async calculateSummary(items: CartItem[], deliveryMethod: DeliveryMethod, installation: InstallationOption) {
    const subtotal = items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'store_pickup' ? 0 : deliveryMethod === 'outside_dhaka' ? 150 : 100;
    const installationFee = installation.requested ? installation.estimatedFee : 0;
    const tax = 0; // Tax configuration
    const total = subtotal + deliveryFee + installationFee + tax;
    return { subtotal, deliveryFee, installationFee, tax, total };
  }
}

// ----------------------------------------------------------------------------
// Order Service Implementation
// ----------------------------------------------------------------------------
export class MockOrderService implements IOrderService {
  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'timeline' | 'status'>): Promise<Order> {
    const list = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CNX-ORD-${dateCode}-${rand}`;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      status: 'pending',
      timeline: [
        { status: 'pending', title: 'Order Placed', note: 'Order received and awaiting engineer confirmation', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    };

    list.unshift(newOrder);
    setStorage(STORAGE_KEYS.ORDERS, list);
    return newOrder;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const list = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    return list.find(o => o.id === id || o.orderNumber === id) || null;
  }

  async getOrderByNumber(orderNumber: string, phone?: string): Promise<Order | null> {
    const list = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const match = list.find(o => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
    if (!match) return null;
    if (phone && !match.customerPhone.includes(phone.trim())) {
      return null;
    }
    return match;
  }

  async getAllOrders(): Promise<Order[]> {
    return getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<Order> {
    const list = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const idx = list.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    list[idx].status = status as any;
    list[idx].timeline.push({
      status,
      title: `Status updated to ${status}`,
      note,
      timestamp: new Date().toISOString()
    });
    setStorage(STORAGE_KEYS.ORDERS, list);
    return list[idx];
  }

  async updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order> {
    const list = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const idx = list.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    list[idx].paymentStatus = paymentStatus as any;
    setStorage(STORAGE_KEYS.ORDERS, list);
    return list[idx];
  }
}

// ----------------------------------------------------------------------------
// Quotes & Service Requests
// ----------------------------------------------------------------------------
export class MockQuoteService implements IQuoteService {
  async createQuote(data: Omit<QuoteRequest, 'id' | 'quoteNumber' | 'createdAt' | 'status'>): Promise<QuoteRequest> {
    const list = getStorage<QuoteRequest[]>(STORAGE_KEYS.QUOTES, []);
    const rand = Math.floor(1000 + Math.random() * 9000);
    const quoteNumber = `CNX-QTE-${Date.now().toString().slice(-4)}-${rand}`;

    const newQuote: QuoteRequest = {
      ...data,
      id: `qte-${Date.now()}`,
      quoteNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    list.unshift(newQuote);
    setStorage(STORAGE_KEYS.QUOTES, list);
    return newQuote;
  }

  async getQuotes(): Promise<QuoteRequest[]> {
    return getStorage<QuoteRequest[]>(STORAGE_KEYS.QUOTES, []);
  }

  async getQuoteById(id: string): Promise<QuoteRequest | null> {
    const list = getStorage<QuoteRequest[]>(STORAGE_KEYS.QUOTES, []);
    return list.find(q => q.id === id || q.quoteNumber === id) || null;
  }

  async updateQuoteStatus(id: string, status: QuoteRequest['status']): Promise<QuoteRequest> {
    const list = getStorage<QuoteRequest[]>(STORAGE_KEYS.QUOTES, []);
    const idx = list.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quote not found');
    list[idx].status = status;
    setStorage(STORAGE_KEYS.QUOTES, list);
    return list[idx];
  }
}

// ----------------------------------------------------------------------------
// CMS & Site Settings Service
// ----------------------------------------------------------------------------
export class MockCmsService implements ICmsService {
  async getSiteSettings(): Promise<SiteSettings> {
    const s = getStorage<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SITE_SETTINGS);
    if (!s.footer) {
      s.footer = INITIAL_SITE_SETTINGS.footer;
    }
    return s;
  }

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = getStorage<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SITE_SETTINGS);
    const updated = { ...current, ...settings };
    setStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  async getHomepageSections(): Promise<HomepageSection[]> {
    const list = getStorage<HomepageSection[]>(STORAGE_KEYS.SECTIONS, INITIAL_HOMEPAGE_SECTIONS);
    const ctaSec = list.find(s => s.type === 'quote_cta');
    if (ctaSec && !ctaSec.ctaData) {
      ctaSec.ctaData = INITIAL_CTA_DATA;
    }
    return list;
  }

  async updateHomepageSections(sections: HomepageSection[]): Promise<HomepageSection[]> {
    setStorage(STORAGE_KEYS.SECTIONS, sections);
    return sections;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return getStorage<BlogPost[]>(STORAGE_KEYS.BLOG, INITIAL_BLOG_POSTS);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const list = getStorage<BlogPost[]>(STORAGE_KEYS.BLOG, INITIAL_BLOG_POSTS);
    return list.find(b => b.slug === slug) || null;
  }

  async saveBlogPost(post: BlogPost): Promise<BlogPost> {
    const list = getStorage<BlogPost[]>(STORAGE_KEYS.BLOG, INITIAL_BLOG_POSTS);
    const idx = list.findIndex(b => b.id === post.id);
    if (idx !== -1) {
      list[idx] = post;
    } else {
      list.push(post);
    }
    setStorage(STORAGE_KEYS.BLOG, list);
    return post;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    let list = getStorage<BlogPost[]>(STORAGE_KEYS.BLOG, INITIAL_BLOG_POSTS);
    list = list.filter(b => b.id !== id);
    setStorage(STORAGE_KEYS.BLOG, list);
    return true;
  }

  async getProjects(): Promise<ProjectCaseStudy[]> {
    return getStorage<ProjectCaseStudy[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return getStorage<Testimonial[]>(STORAGE_KEYS.TESTIMONIALS, INITIAL_TESTIMONIALS);
  }

  async getFaqs(): Promise<FaqItem[]> {
    return getStorage<FaqItem[]>(STORAGE_KEYS.FAQS, INITIAL_FAQS);
  }

  async saveFaq(faq: FaqItem): Promise<FaqItem> {
    const list = getStorage<FaqItem[]>(STORAGE_KEYS.FAQS, INITIAL_FAQS);
    const idx = list.findIndex(f => f.id === faq.id);
    if (idx !== -1) {
      list[idx] = faq;
    } else {
      list.push(faq);
    }
    setStorage(STORAGE_KEYS.FAQS, list);
    return faq;
  }

  async deleteFaq(id: string): Promise<boolean> {
    let list = getStorage<FaqItem[]>(STORAGE_KEYS.FAQS, INITIAL_FAQS);
    list = list.filter(f => f.id !== id);
    setStorage(STORAGE_KEYS.FAQS, list);
    return true;
  }

  async getHeroSlides(): Promise<HeroSlide[]> {
    return getStorage<HeroSlide[]>(STORAGE_KEYS.SLIDES, INITIAL_HERO_SLIDES);
  }

  async saveHeroSlide(slide: HeroSlide): Promise<HeroSlide> {
    const list = getStorage<HeroSlide[]>(STORAGE_KEYS.SLIDES, INITIAL_HERO_SLIDES);
    const idx = list.findIndex(s => s.id === slide.id);
    if (idx !== -1) {
      list[idx] = slide;
    } else {
      list.push(slide);
    }
    setStorage(STORAGE_KEYS.SLIDES, list);
    return slide;
  }

  async deleteHeroSlide(id: string): Promise<void> {
    let list = getStorage<HeroSlide[]>(STORAGE_KEYS.SLIDES, INITIAL_HERO_SLIDES);
    list = list.filter(s => s.id !== id);
    setStorage(STORAGE_KEYS.SLIDES, list);
  }

  async resolveDisplaySlides(): Promise<HeroSlide[]> {
    const slides = getStorage<HeroSlide[]>(STORAGE_KEYS.SLIDES, INITIAL_HERO_SLIDES);
    const now = new Date().toISOString();

    // 1. Filter enabled and schedule
    const activeConfigs = slides
      .filter(s => s.enabled)
      .filter(s => !s.startDate || s.startDate <= now)
      .filter(s => !s.endDate || s.endDate >= now)
      .sort((a, b) => a.order - b.order);

    const allProducts = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const allTemplates = getStorage<SpecTemplate[]>(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);

    const resolved: HeroSlide[] = [];

    for (const slide of activeConfigs) {
      if (slide.sourceMode === 'manual') {
        resolved.push(slide);
      } else if (slide.sourceMode === 'product' && slide.productId) {
        const prod = allProducts.find(p => p.id === slide.productId && p.status === 'active' && p.websiteVisible);
        if (!prod || (!prod.primaryImage && !slide.image)) continue;

        const resolvedSlide = this.buildSlideFromProduct(slide, prod, allTemplates);
        resolved.push(resolvedSlide);
      } else if (slide.sourceMode === 'collection') {
        const rule = slide.collectionRule || 'featured';
        const limit = slide.collectionCount || 3;

        let matched = allProducts.filter(p => p.status === 'active' && p.websiteVisible && (p.primaryImage || p.images?.length > 0));
        if (rule === 'newest') {
          matched = matched.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        } else if (rule === 'featured') {
          matched = matched.filter(p => p.isFeatured);
        } else if (rule === 'hot') {
          matched = matched.filter(p => p.isPopular);
        } else if (rule === 'category' && slide.categorySlug) {
          matched = matched.filter(p => p.categoryId === slide.categorySlug || p.category.toLowerCase().includes(slide.categorySlug.toLowerCase()));
        }

        matched.slice(0, limit).forEach((p, idx) => {
          const autoSlide = this.buildSlideFromProduct({
            ...slide,
            id: `${slide.id}-col-${p.id}`,
            title: `${p.name} (Auto Collection)`,
            order: slide.order * 10 + idx
          }, p, allTemplates);
          resolved.push(autoSlide);
        });
      }
    }

    return resolved;
  }

  private buildSlideFromProduct(config: HeroSlide, prod: Product, templates: SpecTemplate[]): HeroSlide {
    // 1. Image resolution
    const image = config.overrides?.image || config.image || prod.primaryImage || (prod.images && prod.images[0]) || '/images/hero/hikvision-bullet.jpg';

    // 2. Headline & description
    const cleanHeadline = prod.name.toLowerCase().startsWith((prod.brand || '').toLowerCase())
      ? prod.name
      : `${prod.brand ? prod.brand + ' ' : ''}${prod.name}`;
    const headline = config.overrides?.headline || cleanHeadline;
    const description = config.overrides?.description || prod.shortDescription || prod.description;

    // 3. Badge
    let badge = config.overrides?.badge || config.badge;
    if (!badge) {
      const createdTime = prod.createdAt ? new Date(prod.createdAt).getTime() : 0;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - createdTime < thirtyDaysMs) {
        badge = 'New';
      } else if (prod.isFeatured) {
        badge = 'Featured';
      } else {
        badge = 'Hot';
      }
    }

    // 4. Highlights extraction from category spec template
    let highlights: HeroFeatureHighlight[] = config.overrides?.highlights || [];
    if (!highlights || highlights.length === 0) {
      const template = templates.find(t => t.categorySlug === prod.categoryId || t.name.toLowerCase() === prod.category.toLowerCase());
      if (template) {
        const flaggedFields = template.fields.filter(f => f.showInHighlights);
        for (const field of flaggedFields) {
          const val = prod.specifications && prod.specifications[field.key];
          if (val !== undefined && val !== null && String(val).trim()) {
            let icon = 'shield';
            if (field.key.includes('res')) icon = 'camera';
            else if (field.key.includes('vision') || field.key.includes('lens')) icon = 'eye';
            else if (field.key.includes('port') || field.key.includes('speed') || field.key.includes('wifi')) icon = 'wifi';
            else if (field.key.includes('poe') || field.key.includes('power')) icon = 'zap';
            else if (field.key.includes('ch') || field.key.includes('tech') || field.key.includes('bio')) icon = 'cpu';

            highlights.push({
              icon,
              value: String(val),
              label: field.name
            });
            if (highlights.length >= 4) break;
          }
        }
      }

      // Fallback to keyFeatures if template fields were insufficient
      if (highlights.length === 0 && prod.keyFeatures && prod.keyFeatures.length > 0) {
        highlights = prod.keyFeatures.slice(0, 4).map((feat, idx) => ({
          icon: idx === 0 ? 'camera' : idx === 1 ? 'eye' : idx === 2 ? 'shield' : 'cpu',
          value: feat.split(':')[1]?.trim() || feat.slice(0, 20),
          label: feat.split(':')[0]?.trim() || 'Feature'
        }));
      }
    }

    // 5. Price
    const priceText = config.overrides?.priceText || (prod.pricing.regularPrice ? `৳${prod.pricing.regularPrice.toLocaleString()}` : undefined);

    return {
      ...config,
      badge,
      headline,
      description,
      image,
      priceText,
      buttonText: config.overrides?.buttonText || config.buttonText || 'View Product',
      buttonLink: config.overrides?.buttonLink || config.buttonLink || `/product/${prod.id}`,
      secondaryText: config.overrides?.secondaryText || config.secondaryText || (prod.pricing.regularPrice ? 'Add to cart' : 'Request quotation'),
      secondaryLink: config.overrides?.secondaryLink || config.secondaryLink || (prod.pricing.regularPrice ? '/cart' : '/quote'),
      highlights: highlights.slice(0, 4)
    };
  }

  async clearDemoData(): Promise<void> {
    // Only keep real user entered data; clear sample data
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS).filter(p => !p.isDemo);
    setStorage(STORAGE_KEYS.PRODUCTS, prods);

    const pkgs = getStorage<SecurityPackage[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES).filter(p => !p.isDemo);
    setStorage(STORAGE_KEYS.PACKAGES, pkgs);

    const projs = getStorage<ProjectCaseStudy[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS).filter(p => !p.isDemo);
    setStorage(STORAGE_KEYS.PROJECTS, projs);

    const tests = getStorage<Testimonial[]>(STORAGE_KEYS.TESTIMONIALS, INITIAL_TESTIMONIALS).filter(t => !t.isDemo);
    setStorage(STORAGE_KEYS.TESTIMONIALS, tests);

    const settings = getStorage<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SITE_SETTINGS);
    settings.sampleDataBanner = false;
    setStorage(STORAGE_KEYS.SETTINGS, settings);
  }

  async resetToInitialSeeds(): Promise<void> {
    setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SITE_SETTINGS);
    setStorage(STORAGE_KEYS.SECTIONS, INITIAL_HOMEPAGE_SECTIONS);
    setStorage(STORAGE_KEYS.TEMPLATES, INITIAL_SPEC_TEMPLATES);
    setStorage(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    setStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStorage(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
    setStorage(STORAGE_KEYS.BLOG, INITIAL_BLOG_POSTS);
    setStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    setStorage(STORAGE_KEYS.TESTIMONIALS, INITIAL_TESTIMONIALS);
    setStorage(STORAGE_KEYS.FAQS, INITIAL_FAQS);
  }
}

// ----------------------------------------------------------------------------
// Product Research Assistant (Mode A & Mode B)
// ----------------------------------------------------------------------------
export class MockProductResearchService implements IProductResearchService {
  async startResearch(brand: string, modelNumber: string): Promise<ProductResearchResult> {
    // Simulated research job fetching official manufacturer specs
    await new Promise(res => setTimeout(res, 800));

    const isHik = brand.toLowerCase().includes('hikvision') || modelNumber.toLowerCase().startsWith('ds-');
    const isZk = brand.toLowerCase().includes('zkteco') || modelNumber.toLowerCase().startsWith('mb') || modelNumber.toLowerCase().startsWith('k40');

    if (isHik) {
      return {
        jobId: `job-${Date.now()}`,
        modelQuery: modelNumber,
        brand: 'Hikvision',
        suggestedName: {
          value: `Hikvision ${modelNumber} Professional Surveillance Unit`,
          sourceUrl: 'https://www.hikvision.com/en/products',
          confidence: 'high',
          status: 'pending'
        },
        suggestedCategory: {
          value: 'CCTV Cameras',
          sourceUrl: 'https://www.hikvision.com/en/products',
          confidence: 'high',
          status: 'pending'
        },
        suggestedShortDesc: {
          value: `Official Hikvision ${modelNumber} security device with smart day/night monitoring and enterprise durability.`,
          sourceUrl: 'https://www.hikvision.com/datasheets',
          confidence: 'high',
          status: 'pending'
        },
        suggestedKeyFeatures: {
          value: [
            'High sensitivity progressive scan imaging sensor',
            'Smart IR illumination / ColorVu day-night filter',
            'IP67 weatherproof housing for outdoor installation',
            'Hik-Connect smartphone remote cloud monitoring'
          ],
          sourceUrl: 'https://www.hikvision.com/datasheets',
          confidence: 'high',
          status: 'pending'
        },
        suggestedSpecs: {
          resolution: { value: '2MP (1080p)', sourceUrl: 'Official Datasheet p.2', confidence: 'high', status: 'pending' },
          form_factor: { value: 'Bullet', sourceUrl: 'Official Datasheet p.1', confidence: 'high', status: 'pending' },
          night_vision: { value: 'IR Night Vision (up to 20m)', sourceUrl: 'Official Datasheet p.3', confidence: 'medium', status: 'pending' },
          lens: { value: '3.6mm (Standard)', sourceUrl: 'Official Datasheet p.2', confidence: 'high', status: 'pending' },
          ip_rating: { value: 'IP67 Weatherproof', sourceUrl: 'Official Datasheet p.4', confidence: 'high', status: 'pending' }
        },
        suggestedDocuments: {
          value: [
            { title: `${modelNumber} Technical Specification Sheet`, url: `https://www.hikvision.com/docs/${modelNumber}.pdf`, type: 'datasheet' }
          ],
          confidence: 'high',
          status: 'pending'
        },
        datasheetUrl: `https://www.hikvision.com/docs/${modelNumber}.pdf`,
        sourcePriorityRanked: [
          'Official Hikvision Manufacturer Portal (Verified)',
          'Authorized Bangladesh Distributor Technical Library',
          'Global Product Catalog Archive'
        ]
      };
    } else if (isZk) {
      return {
        jobId: `job-${Date.now()}`,
        modelQuery: modelNumber,
        brand: 'ZKTeco',
        suggestedName: {
          value: `ZKTeco ${modelNumber} Biometric Terminal`,
          sourceUrl: 'https://www.zkteco.com/products',
          confidence: 'high',
          status: 'pending'
        },
        suggestedCategory: {
          value: 'Access Control & Biometrics',
          confidence: 'high',
          status: 'pending'
        },
        suggestedShortDesc: {
          value: `Multi-biometric terminal for employee attendance tracking and electric door lock management.`,
          confidence: 'high',
          status: 'pending'
        },
        suggestedKeyFeatures: {
          value: [
            'High-speed optical fingerprint / face recognition algorithm',
            'TCP/IP network and USB client connection',
            'Time-attendance software with automated Excel reports'
          ],
          confidence: 'high',
          status: 'pending'
        },
        suggestedSpecs: {
          biometric_type: { value: 'Fingerprint + RFID Card', confidence: 'medium', status: 'pending' },
          user_capacity: { value: 1000, confidence: 'high', status: 'pending' },
          connectivity: { value: 'TCP/IP + USB', confidence: 'high', status: 'pending' }
        },
        suggestedDocuments: {
          value: [{ title: `${modelNumber} User Manual`, url: `https://www.zkteco.com/manuals/${modelNumber}.pdf`, type: 'user_manual' }],
          confidence: 'medium',
          status: 'pending'
        },
        sourcePriorityRanked: ['ZKTeco Official Specification Hub']
      };
    }

    // Generic fallback research
    return {
      jobId: `job-${Date.now()}`,
      modelQuery: modelNumber,
      brand: brand || 'Technology Brand',
      suggestedName: {
        value: `${brand} ${modelNumber}`,
        confidence: 'medium',
        status: 'pending'
      },
      suggestedCategory: {
        value: 'Network Switches',
        confidence: 'low',
        status: 'pending'
      },
      suggestedShortDesc: {
        value: `Professional enterprise hardware model ${modelNumber}.`,
        confidence: 'low',
        status: 'pending'
      },
      suggestedKeyFeatures: {
        value: ['Standard enterprise connectivity', 'Certified Bangladesh distribution'],
        confidence: 'low',
        status: 'pending'
      },
      suggestedSpecs: {},
      suggestedDocuments: { value: [], confidence: 'unverified', status: 'pending' },
      sourcePriorityRanked: ['Manufacturer Technical Index']
    };
  }
}

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
  HeroFeatureHighlight,
  Customer,
  MediaItem
} from '../types';

import { apiFetch, getApiBase, getCsrfTokenFromCookie, fetchCsrfToken } from './apiClient';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(endpoint, options);
}

// ============================================================================
// 1. Product Service (REST + SQLite)
// ============================================================================
export class RestProductService implements IProductService {
  async getProducts(params?: ProductFilterParams): Promise<PaginatedResult<Product>> {
    const q = new URLSearchParams();
    if (params?.categorySlug) q.set('categorySlug', params.categorySlug);
    if (params?.brandSlug) q.set('brandSlug', params.brandSlug);
    if (params?.search) q.set('search', params.search);
    if (params?.minPrice !== undefined) q.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice));
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.specFilters && Object.keys(params.specFilters).length > 0) {
      q.set('specFilters', JSON.stringify(params.specFilters));
    }

    const qs = q.toString();
    return request<PaginatedResult<Product>>(`/products${qs ? '?' + qs : ''}`);
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await request<Product>(`/products/${encodeURIComponent(id)}`);
    } catch (e) {
      return null;
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      return await request<Product>(`/products/${encodeURIComponent(sku)}`);
    } catch (e) {
      return null;
    }
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return request<Product[]>('/products/featured');
  }

  async getPopularProducts(limit = 8): Promise<Product[]> {
    const res = await this.getProducts({ sortBy: 'popular', limit });
    return res.items;
  }

  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    try {
      return await request<Product[]>(`/products/${encodeURIComponent(productId)}/related`);
    } catch (e) {
      return [];
    }
  }

  async getCompatibleAccessories(productId: string): Promise<Product[]> {
    try {
      return await request<Product[]>(`/products/${encodeURIComponent(productId)}/accessories`);
    } catch (e) {
      return [];
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteProduct(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }

  async getAvailableSpecFiltersForCategory(categorySlug: string): Promise<Record<string, string[]>> {
    try {
      return await request<Record<string, string[]>>(`/products/spec-filters/${encodeURIComponent(categorySlug)}`);
    } catch (e) {
      return {};
    }
  }
}

// ============================================================================
// 2. Category Service (REST + SQLite)
// ============================================================================
export class RestCategoryService implements ICategoryService {
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories');
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      return await request<Category>(`/categories/${encodeURIComponent(slug)}`);
    } catch (e) {
      return null;
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category)
    });
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    return request<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteCategory(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }
}

// ============================================================================
// 3. Brand Service (REST + SQLite)
// ============================================================================
export class RestBrandService implements IBrandService {
  async getBrands(): Promise<Brand[]> {
    return request<Brand[]>('/brands');
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    try {
      return await request<Brand>(`/brands/${encodeURIComponent(slug)}`);
    } catch (e) {
      return null;
    }
  }

  async createBrand(brand: Omit<Brand, 'id'>): Promise<Brand> {
    return request<Brand>('/brands', {
      method: 'POST',
      body: JSON.stringify(brand)
    });
  }

  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
    return request<Brand>(`/brands/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
}

// ============================================================================
// 4. Spec Template Service (REST + SQLite)
// ============================================================================
export class RestSpecTemplateService implements ISpecTemplateService {
  async getTemplates(): Promise<SpecTemplate[]> {
    return request<SpecTemplate[]>('/spec-templates');
  }

  async getTemplateById(id: string): Promise<SpecTemplate | null> {
    try {
      return await request<SpecTemplate>(`/spec-templates/${encodeURIComponent(id)}`);
    } catch (e) {
      return null;
    }
  }

  async getTemplateByCategorySlug(categorySlug: string): Promise<SpecTemplate | null> {
    try {
      return await request<SpecTemplate>(`/spec-templates/by-category/${encodeURIComponent(categorySlug)}`);
    } catch (e) {
      return null;
    }
  }

  async saveTemplate(template: SpecTemplate): Promise<SpecTemplate> {
    return request<SpecTemplate>('/spec-templates', {
      method: 'POST',
      body: JSON.stringify(template)
    });
  }

  async deleteTemplate(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/spec-templates/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }
}

// ============================================================================
// 5. Package Service (REST + SQLite)
// ============================================================================
export class RestPackageService implements IPackageService {
  async getPackages(): Promise<SecurityPackage[]> {
    return request<SecurityPackage[]>('/packages');
  }

  async getPackageBySlug(slug: string): Promise<SecurityPackage | null> {
    try {
      return await request<SecurityPackage>(`/packages/${encodeURIComponent(slug)}`);
    } catch (e) {
      return null;
    }
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
    return request<{
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
    }>(
      '/packages/calculate-price',
      {
        method: 'POST',
        body: JSON.stringify(config)
      }
    );
  }

  async savePackage(pkg: SecurityPackage): Promise<SecurityPackage> {
    if (pkg.id) {
      return request<SecurityPackage>(`/packages/${encodeURIComponent(pkg.id)}`, {
        method: 'PUT',
        body: JSON.stringify(pkg)
      });
    }
    return request<SecurityPackage>('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg)
    });
  }
}

// ============================================================================
// 6. Cart Service (Persistent Guest Client Storage + Dynamic Summary)
// ============================================================================
const CART_STORAGE_KEY = 'camnex_cart_v1';

export class RestCartService implements ICartService {
  async getCart(): Promise<CartItem[]> {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  async addItem(item: Omit<CartItem, 'id'>): Promise<CartItem[]> {
    const cart = await this.getCart();
    const existing = cart.find(c => c.productId === item.productId && c.selectedFormFactor === item.selectedFormFactor);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({ ...item, id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` });
    }
    this.saveCart(cart);
    return cart;
  }

  async updateQuantity(lineId: string, quantity: number): Promise<CartItem[]> {
    let cart = await this.getCart();
    if (quantity <= 0) {
      cart = cart.filter(c => c.id !== lineId);
    } else {
      const line = cart.find(c => c.id === lineId);
      if (line) line.quantity = quantity;
    }
    this.saveCart(cart);
    return cart;
  }

  async removeItem(lineId: string): Promise<CartItem[]> {
    let cart = await this.getCart();
    cart = cart.filter(c => c.id !== lineId);
    this.saveCart(cart);
    return cart;
  }

  async clearCart(): Promise<void> {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}
  }

  async calculateSummary(items: CartItem[], deliveryMethod: DeliveryMethod, installation: InstallationOption) {
    const subtotal = items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'store_pickup' ? 0 : deliveryMethod === 'outside_dhaka' ? 150 : 100;
    const installationFee = installation.requested ? (installation.estimatedFee || 0) : 0;
    const tax = 0;
    const total = subtotal + deliveryFee + installationFee + tax;
    return { subtotal, deliveryFee, installationFee, tax, total };
  }

  private saveCart(cart: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }
}

// ============================================================================
// 7. Order Service (REST + SQLite)
// ============================================================================
export class RestOrderService implements IOrderService {
  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'timeline' | 'status'>): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      return await request<Order>(`/orders/${encodeURIComponent(id)}`);
    } catch (e) {
      return null;
    }
  }

  async getOrderByNumber(orderNumber: string, phone?: string): Promise<Order | null> {
    try {
      const q = phone && phone.trim() ? `?phone=${encodeURIComponent(phone.trim())}` : '';
      return await request<Order>(`/orders/${encodeURIComponent(orderNumber)}${q}`);
    } catch (e) {
      return null;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    return request<Order[]>('/orders');
  }

  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
  }

  async updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus })
    });
  }
}

// ============================================================================
// 8. Quote & Service Request Service (REST + SQLite)
// ============================================================================
export class RestQuoteService implements IQuoteService {
  async createQuote(data: Omit<QuoteRequest, 'id' | 'quoteNumber' | 'createdAt' | 'status'>): Promise<QuoteRequest> {
    return request<QuoteRequest>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createServiceRequest(data: { customerName: string; phone: string; serviceType: string; area?: string; website?: string }): Promise<any> {
    return request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getQuotes(): Promise<QuoteRequest[]> {
    return request<QuoteRequest[]>('/quotes');
  }

  async getQuoteById(id: string): Promise<QuoteRequest | null> {
    try {
      return await request<QuoteRequest>(`/quotes/${encodeURIComponent(id)}`);
    } catch (e) {
      return null;
    }
  }

  async updateQuoteStatus(id: string, status: QuoteRequest['status']): Promise<QuoteRequest> {
    return request<QuoteRequest>(`/quotes/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
}

// ============================================================================
// 9. CMS & Settings Service (REST + SQLite)
// ============================================================================
export class RestCmsService implements ICmsService {
  async getSiteSettings(): Promise<SiteSettings> {
    return request<SiteSettings>('/settings');
  }

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return request<SiteSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async getHomepageSections(): Promise<HomepageSection[]> {
    return request<HomepageSection[]>('/cms/sections');
  }

  async updateHomepageSections(sections: HomepageSection[]): Promise<HomepageSection[]> {
    return request<HomepageSection[]>('/cms/sections', {
      method: 'PUT',
      body: JSON.stringify(sections)
    });
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return request<BlogPost[]>('/cms/blog');
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const posts = await this.getBlogPosts();
    return posts.find(p => p.slug === slug) || null;
  }

  async saveBlogPost(post: BlogPost): Promise<BlogPost> {
    if (post.id) {
      return request<BlogPost>(`/cms/blog/${encodeURIComponent(post.id)}`, {
        method: 'PUT',
        body: JSON.stringify(post)
      });
    }
    return request<BlogPost>('/cms/blog', {
      method: 'POST',
      body: JSON.stringify(post)
    });
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/cms/blog/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }

  async getProjects(): Promise<ProjectCaseStudy[]> {
    return request<ProjectCaseStudy[]>('/cms/projects');
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return request<Testimonial[]>('/cms/testimonials');
  }

  async getFaqs(): Promise<FaqItem[]> {
    return request<FaqItem[]>('/cms/faqs');
  }

  async saveFaq(faq: FaqItem): Promise<FaqItem> {
    if (faq.id) {
      return request<FaqItem>(`/cms/faqs/${encodeURIComponent(faq.id)}`, {
        method: 'PUT',
        body: JSON.stringify(faq)
      });
    }
    return request<FaqItem>('/cms/faqs', {
      method: 'POST',
      body: JSON.stringify(faq)
    });
  }

  async deleteFaq(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/cms/faqs/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }

  async getHeroSlides(): Promise<HeroSlide[]> {
    return request<HeroSlide[]>('/cms/hero-slides');
  }

  async saveHeroSlide(slide: HeroSlide): Promise<HeroSlide> {
    return request<HeroSlide>('/cms/hero-slides', {
      method: 'POST',
      body: JSON.stringify(slide)
    });
  }

  async deleteHeroSlide(id: string): Promise<void> {
    await request<{ success: boolean }>(`/cms/hero-slides/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }

  async resolveDisplaySlides(): Promise<HeroSlide[]> {
    const [slides, prodsRes, templates] = await Promise.all([
      this.getHeroSlides(),
      request<PaginatedResult<Product>>('/products?limit=100'),
      request<SpecTemplate[]>('/spec-templates')
    ]);

    const allProducts = prodsRes.items || [];
    const now = new Date().toISOString();

    const activeConfigs = slides
      .filter(s => s.enabled)
      .filter(s => !s.startDate || s.startDate <= now)
      .filter(s => !s.endDate || s.endDate >= now)
      .sort((a, b) => a.order - b.order);

    const resolved: HeroSlide[] = [];

    for (const slide of activeConfigs) {
      if (slide.sourceMode === 'manual') {
        resolved.push(slide);
      } else if (slide.sourceMode === 'product' && slide.productId) {
        const prod = allProducts.find(p => p.id === slide.productId && p.status === 'active' && p.websiteVisible);
        if (!prod || (!prod.primaryImage && !slide.image)) continue;
        resolved.push(this.buildSlideFromProduct(slide, prod, templates));
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
          resolved.push(this.buildSlideFromProduct({
            ...slide,
            id: `${slide.id}-col-${p.id}`,
            title: `${p.name} (Auto Collection)`,
            order: slide.order * 10 + idx
          }, p, templates));
        });
      }
    }

    return resolved;
  }

  private buildSlideFromProduct(config: HeroSlide, prod: Product, templates: SpecTemplate[]): HeroSlide {
    const image = config.overrides?.image || config.image || prod.primaryImage || (prod.images && prod.images[0]) || '/images/hero/hikvision-bullet.jpg';
    const cleanHeadline = prod.name.toLowerCase().startsWith((prod.brand || '').toLowerCase())
      ? prod.name
      : `${prod.brand ? prod.brand + ' ' : ''}${prod.name}`;
    const headline = config.overrides?.headline || cleanHeadline;
    const description = config.overrides?.description || prod.shortDescription || prod.description;

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

      if (highlights.length === 0 && prod.keyFeatures && prod.keyFeatures.length > 0) {
        highlights = prod.keyFeatures.slice(0, 4).map((feat, idx) => ({
          icon: idx === 0 ? 'camera' : idx === 1 ? 'eye' : idx === 2 ? 'shield' : 'cpu',
          value: feat.split(':')[1]?.trim() || feat.slice(0, 20),
          label: feat.split(':')[0]?.trim() || 'Feature'
        }));
      }
    }

    const priceText = config.overrides?.priceText || (prod.pricing?.regularPrice ? `৳${prod.pricing.regularPrice.toLocaleString()}` : undefined);

    return {
      ...config,
      badge,
      headline,
      description,
      image,
      priceText,
      buttonText: config.overrides?.buttonText || config.buttonText || 'View Product',
      buttonLink: config.overrides?.buttonLink || config.buttonLink || `/product/${prod.id}`,
      secondaryText: config.overrides?.secondaryText || config.secondaryText || (prod.pricing?.regularPrice ? 'Add to cart' : 'Request quotation'),
      secondaryLink: config.overrides?.secondaryLink || config.secondaryLink || (prod.pricing?.regularPrice ? '/cart' : '/quote'),
      highlights: highlights.slice(0, 4)
    };
  }

  async clearDemoData(): Promise<void> {
    await request<{ success: boolean }>('/admin/clear-demo-data', { method: 'POST' });
  }

  async resetToInitialSeeds(): Promise<void> {
    await request<{ success: boolean }>('/admin/reset-seeds', { method: 'POST' });
  }
}

// ============================================================================
// 10. Product Research Assistant (REST + Backend Integration)
// ============================================================================
export class RestProductResearchService implements IProductResearchService {
  async startResearch(brand: string, modelNumber: string): Promise<ProductResearchResult> {
    const q = new URLSearchParams({ brand, model: modelNumber });
    return request<ProductResearchResult>(`/research?${q.toString()}`);
  }
}

// ============================================================================
// 11. Customer Service (REST + SQLite)
// ============================================================================
export class RestCustomerService {
  async getCustomers(): Promise<Customer[]> {
    return request<Customer[]>('/customers');
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      return await request<Customer>(`/customers/${encodeURIComponent(id)}`);
    } catch (e) {
      return null;
    }
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  }
}

// ============================================================================
// 12. Media Service (REST + File Upload)
// ============================================================================
export class RestMediaService {
  async getMedia(): Promise<MediaItem[]> {
    return request<MediaItem[]>('/media');
  }

  async uploadMedia(file: File): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<MediaItem>('/media/upload', {
      method: 'POST',
      body: formData
    });
  }

  async deleteMedia(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/media/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }
}


import {
  Product,
  Category,
  Brand,
  SpecTemplate,
  SecurityPackage,
  CartItem,
  Order,
  Customer,
  QuoteRequest,
  SiteSettings,
  HomepageSection,
  BlogPost,
  ProjectCaseStudy,
  Testimonial,
  FaqItem,
  ProductResearchResult,
  DeliveryMethod,
  PaymentMethod,
  InstallationOption,
  HeroSlide
} from '../types';

export interface ProductFilterParams {
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  specFilters?: Record<string, string | number | boolean>;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'popular' | 'newest';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ----------------------------------------------------------------------------
// Core Domain Service Interfaces
// ----------------------------------------------------------------------------

export interface IProductService {
  getProducts(params?: ProductFilterParams): Promise<PaginatedResult<Product>>;
  getProductById(id: string): Promise<Product | null>;
  getProductBySku(sku: string): Promise<Product | null>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getPopularProducts(limit?: number): Promise<Product[]>;
  getRelatedProducts(productId: string, limit?: number): Promise<Product[]>;
  getCompatibleAccessories(productId: string): Promise<Product[]>;
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;
  getAvailableSpecFiltersForCategory(categorySlug: string): Promise<Record<string, string[]>>;
}

export interface ICategoryService {
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
}

export interface IBrandService {
  getBrands(): Promise<Brand[]>;
  getBrandBySlug(slug: string): Promise<Brand | null>;
  createBrand(brand: Omit<Brand, 'id'>): Promise<Brand>;
  updateBrand(id: string, updates: Partial<Brand>): Promise<Brand>;
}

export interface ISpecTemplateService {
  getTemplates(): Promise<SpecTemplate[]>;
  getTemplateById(id: string): Promise<SpecTemplate | null>;
  getTemplateByCategorySlug(categorySlug: string): Promise<SpecTemplate | null>;
  saveTemplate(template: SpecTemplate): Promise<SpecTemplate>;
  deleteTemplate(id: string): Promise<boolean>;
}

export interface IPackageService {
  getPackages(): Promise<SecurityPackage[]>;
  getPackageBySlug(slug: string): Promise<SecurityPackage | null>;
  calculatePackagePrice(config: {
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
  }>;
  savePackage(pkg: SecurityPackage): Promise<SecurityPackage>;
}

export interface ICartService {
  getCart(): Promise<CartItem[]>;
  addItem(item: Omit<CartItem, 'id'>): Promise<CartItem[]>;
  updateQuantity(lineId: string, quantity: number): Promise<CartItem[]>;
  removeItem(lineId: string): Promise<CartItem[]>;
  clearCart(): Promise<void>;
  calculateSummary(items: CartItem[], deliveryMethod: DeliveryMethod, installation: InstallationOption): Promise<{
    subtotal: number;
    deliveryFee: number;
    installationFee: number;
    tax: number;
    total: number;
  }>;
}

export interface IOrderService {
  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'timeline' | 'status'>): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string, phone?: string): Promise<Order | null>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string, note?: string): Promise<Order>;
  updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order>;
}

export interface IQuoteService {
  createQuote(data: Omit<QuoteRequest, 'id' | 'quoteNumber' | 'createdAt' | 'status'>): Promise<QuoteRequest>;
  createServiceRequest(data: { customerName: string; phone: string; serviceType: string; area?: string; website?: string }): Promise<any>;
  getQuotes(): Promise<QuoteRequest[]>;
  getQuoteById(id: string): Promise<QuoteRequest | null>;
  updateQuoteStatus(id: string, status: QuoteRequest['status']): Promise<QuoteRequest>;
}

export interface ICmsService {
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings>;
  getHomepageSections(): Promise<HomepageSection[]>;
  updateHomepageSections(sections: HomepageSection[]): Promise<HomepageSection[]>;
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
  saveBlogPost(post: BlogPost): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<boolean>;
  getProjects(): Promise<ProjectCaseStudy[]>;
  getTestimonials(): Promise<Testimonial[]>;
  getFaqs(): Promise<FaqItem[]>;
  saveFaq(faq: FaqItem): Promise<FaqItem>;
  deleteFaq(id: string): Promise<boolean>;
  getHeroSlides(): Promise<HeroSlide[]>;
  saveHeroSlide(slide: HeroSlide): Promise<HeroSlide>;
  deleteHeroSlide(id: string): Promise<void>;
  resolveDisplaySlides(): Promise<HeroSlide[]>;
  clearDemoData(): Promise<void>;
  resetToInitialSeeds(): Promise<void>;
}

export interface IProductResearchService {
  startResearch(brand: string, modelNumber: string): Promise<ProductResearchResult>;
}

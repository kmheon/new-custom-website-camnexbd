// ============================================================================
// CamneX Bangladesh — Enterprise E-Commerce & Business Platform Domain Models
// Phase 1: Storefront, Catalog, Cart/Checkout, Quotes, Services, and Admin
// Designed for seamless Phase 2 POS / ERP integration
// ============================================================================

export type Role = 'admin' | 'editor' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  token?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  customerType: 'individual' | 'business';
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string; // e.g. "Office", "Home", "Warehouse"
  addressLine: string;
  area: string;
  city: string;
  isDefault?: boolean;
}

// ----------------------------------------------------------------------------
// Specification Templates (Category-Owned)
// ----------------------------------------------------------------------------
export type SpecFieldType = 'text' | 'number' | 'boolean' | 'enum' | 'unit';

export interface SpecFieldDefinition {
  id: string;
  name: string; // e.g. "Resolution", "Night Vision Range"
  label?: string;
  key: string;  // e.g. "resolution", "night_vision_range"
  type: SpecFieldType;
  unit?: string; // e.g. "MP", "Meters", "Gbps", "Ports"
  options?: string[]; // for enum: e.g. ["2MP (1080p)", "4MP (2K)", "8MP (4K)"]
  required?: boolean;
  filterable?: boolean; // can be used in category faceted search
  comparable?: boolean; // shown in product comparison matrix
  showInHighlights?: boolean; // shown in hero banner highlights
  shortLabel?: string; // Max 14 characters compact label for tiles
  order: number;
}

export interface SpecTemplate {
  id: string;
  name: string; // e.g. "CCTV Camera", "NVR/DVR", "Network Switch", "Access Point", "Biometric Access Control", "Generic"
  categorySlug: string;
  fields: SpecFieldDefinition[];
}

export type ProductSpecValues = Record<string, string | number | boolean>;

// ----------------------------------------------------------------------------
// Product & Catalog Models
// ----------------------------------------------------------------------------
export interface Brand {
  id: string;
  name: string; // Hikvision, ZKTeco, Dahua, Ruijie, TP-Link, Western Digital
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  featured?: boolean;
  badgeText?: string;
  showBadge?: boolean;
  showInBrandStrip?: boolean;
  order?: number;
}

export interface ScenarioItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string; // 'Home' | 'Building2' | 'ShoppingBag' | 'Factory' | 'GraduationCap'
  recommendedCategories?: string[];
  recommendedPackages?: string[];
  recommendedProducts?: string[];
  enabled: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  specTemplateId: string;
  featured?: boolean;
  showOnHomepage?: boolean;
  order: number;
  displayOrder?: number;
  status?: 'active' | 'inactive' | string;
  subcategories?: any[];
}

export interface ProductPrice {
  regularPrice?: number;   // In BDT (৳) - if undefined, "Request quotation"
  salePrice?: number;      // Optional promotional price
  wholesalePrice?: number; // Phase 2 B2B
  currency: 'BDT';
}

export interface ProductInventory {
  available: number;
  reserved?: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order' | 'request_quote';
  warehouseId?: string;
}

export interface ProductDocument {
  id: string;
  title: string;
  type: 'datasheet' | 'user_manual' | 'firmware' | 'quick_start_guide';
  url: string;
  size?: string;
}

export interface ProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  brandId: string;
  modelNumber: string;
  model?: string;
  sku: string;
  category: string;
  categoryId: string;
  subcategory?: string;
  productType: 'physical' | 'service' | 'package_bundle';
  status: 'active' | 'draft' | 'archived';
  websiteVisible: boolean;
  posAvailable: boolean;
  images: string[];
  gallery?: string[];
  primaryImage: string;
  shortDescription: string;
  description: string;
  keyFeatures: string[];
  specifications: ProductSpecValues;
  specs?: Record<string, any>;
  pricing: ProductPrice;
  inventory: ProductInventory;
  unit: string; // "Piece", "Meter", "Box", "Set"
  warrantyMonths?: number;
  warrantyText?: string;
  warranty?: string;
  documents?: ProductDocument[];
  compatibleProductIds?: string[];
  relatedProductIds?: string[];
  seo?: ProductSeo;
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isTrending?: boolean;
  isDemo?: boolean; // Clearly labeled sample data
  sample?: boolean;
  isNew?: boolean;
  isNewArrival?: boolean;
  isHot?: boolean;
}

// ----------------------------------------------------------------------------
// Packages (Configurable Turnkey Bundles)
// ----------------------------------------------------------------------------
export type CameraFormFactor = 'bullet' | 'dome' | 'turret';

export interface PackageComponentRule {
  role: 'camera' | 'recorder' | 'storage' | 'cable' | 'power' | 'connectors' | 'installation';
  defaultModelId: string;
  name: string;
  quantityFormula: 'fixed' | 'per_camera' | 'lookup_camera_count';
  fixedQty?: number;
  qtyPerCamera?: number;
  storageLookup?: Record<number, { capacity: string; modelId: string }>; // e.g. {2: 500GB, 4: 500GB, 8: 1TB, 16: 2TB}
}

export interface SecurityPackage {
  id: string;
  name: string;
  slug: string;
  badge?: string; // "Most Popular", "Best for Small Homes"
  description: string;
  image?: string;
  cameraResolution?: string;
  cameraModel?: string;
  dvrModel?: string;
  storageDescription?: string;
  inclusions?: string[];
  cameraCountsSupported?: number[]; // [2, 4, 8, 16]
  defaultCameraCount?: number;
  cameraCount?: number;
  supportedFormFactors?: CameraFormFactor[];
  isNightVisionIrOnly?: boolean; // Uses IRPF series, no fake color/audio
  rules?: PackageComponentRule[];
  pricingRules?: Record<string, any>;
  basePrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDemo?: boolean;
}

// ----------------------------------------------------------------------------
// Cart, Checkout & Orders
// ----------------------------------------------------------------------------
export interface CartItem {
  id: string; // unique cart line id
  productId: string;
  product: Product;
  quantity: number;
  selectedFormFactor?: CameraFormFactor;
  pricePerUnit: number;
  packageConfig?: {
    packageId: string;
    packageName: string;
    cameraCount: number;
    storageSize: string;
    formFactor: CameraFormFactor;
  };
}

export type DeliveryMethod = 'inside_dhaka' | 'outside_dhaka' | 'store_pickup';
export type PaymentMethod = 'cod' | 'bkash_manual' | 'nagad_manual' | 'bank_transfer' | 'online_gateway';

export interface PaymentDetails {
  method: PaymentMethod;
  senderNumber?: string;
  transactionId?: string;
  bankName?: string;
  depositRef?: string;
  gatewayRef?: string;
  paidAt?: string;
}

export interface InstallationOption {
  requested: boolean;
  preferredDate?: string;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  siteNotes?: string;
  estimatedFee: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus | string;
  title: string;
  note?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CNX-ORD-202610-1042"
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryMethod: DeliveryMethod;
  deliveryFee: number;
  installation: InstallationOption;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'unverified' | 'paid';
  paymentDetails?: PaymentDetails;
  items: Array<{
    productId: string;
    name: string;
    model: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
    packageDetails?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

// ----------------------------------------------------------------------------
// Inquiries, Quotes & Site Surveys
// ----------------------------------------------------------------------------
export type ServiceType =
  | 'cctv_installation'
  | 'site_survey'
  | 'networking_wifi'
  | 'access_control_biometric'
  | 'it_infrastructure'
  | 'maintenance_amc'
  | 'configuration'
  | 'other';

export interface QuoteRequest {
  id: string;
  quoteNumber: string;
  customerName: string;
  companyName?: string;
  phone: string;
  email?: string;
  serviceType: ServiceType;
  propertyType: 'home' | 'office' | 'shop' | 'warehouse' | 'factory' | 'other';
  siteAddress: string;
  cameraCount?: number;
  doorCount?: number;
  preferredDate?: string;
  notes: string;
  status: 'pending' | 'contacted' | 'quoted' | 'approved' | 'rejected';
  estimatedBudget?: string;
  attachmentName?: string;
  createdAt: string;
  isDemo?: boolean;
}

// ----------------------------------------------------------------------------
// Site Settings, CMS & Content
// ----------------------------------------------------------------------------
export interface CtaReassuranceItem {
  id: string;
  label: string;
  enabled: boolean;
}

export interface CtaActionCard {
  id: string;
  title: string;
  description: string;
  type: 'whatsapp' | 'call' | 'survey' | 'custom';
  actionUrl?: string;
  phoneDisplay?: string;
  buttonText?: string;
}

export interface CtaSectionData {
  eyebrow: string;
  heading: string;
  subtext: string;
  cards: CtaActionCard[];
  reassurances: CtaReassuranceItem[];
}

export interface FooterLinkItem {
  label: string;
  route: string;
  param?: string;
  external?: string;
}

export interface FooterNavigationSettings {
  description?: string;
  quickLinks: FooterLinkItem[];
  products: FooterLinkItem[];
  customerSupport: FooterLinkItem[];
  newsletterText?: string;
  copyrightText?: string;
  developerCredit?: string;
}

export interface SiteSettings {
  companyName: string;
  phone: string;
  email: string;
  secondaryEmail: string;
  website: string;
  facebookUrl: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  whatsappNumber?: string;
  address: string;
  credentials: string[]; // ["Hikvision Authorized Partner", "ZKTeco Authorized Installer"]
  services: string[];
  businessHours: string;
  enableStockBadges: boolean;
  sampleDataBanner: boolean;
  showSampleContent?: boolean;
  showDemoTags?: boolean; // Toggle "Show demo tags" on sample cards (default true)
  announcementBar?: {
    enabled: boolean;
    text: string;
    link?: string;
    dismissible?: boolean;
  };
  promoBanner?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  specialOfferSlider?: {
    enabled?: boolean;
    interval?: number;
    maxOffers?: number;
  };
  footer?: FooterNavigationSettings;
  servicesList?: ServiceItem[];
  processSteps?: ProcessStep[];
  servicesSectionPhoto?: string;
  solutions?: ScenarioItem[];
  scenarios?: ScenarioItem[];
  reassurances?: string[];

  // Global SEO Configuration
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;

  // Real Merchant & Financial Settings (Empty by default until entered by admin)
  bkashMerchantNumber?: string;
  nagadMerchantNumber?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    branchName?: string;
    branch?: string;
    routingNumber?: string;
  } | null;
  deliveryFeeInsideDhaka?: number | null;
  deliveryFeeOutsideDhaka?: number | null;
  installationBaseFee?: number | null;
  enableCashOnDelivery?: boolean; // Admin setting: OFF by default in clean DB

  // Policy Text
  warrantyPolicyText?: string;
  returnPolicyText?: string;
  termsPolicyText?: string;
  privacyPolicyText?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  link?: string;
  enabled: boolean;
  order: number;
}

export interface ProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

export interface HomepageSection {
  id: string;
  type: 'hero' | 'brands' | 'categories' | 'popular_products' | 'special_offers' | 'new_arrivals' | 'services' | 'solutions' | 'packages' | 'trending' | 'category_row' | 'testimonials' | 'projects' | 'quote_cta' | 'credentials' | 'featured_products' | string;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  categoryId?: string;
  categorySlug?: string;
  itemLimit?: number;
  ctaData?: CtaSectionData;
  promoTile?: {
    title: string;
    description: string;
    buttonText: string;
    link: string;
    image?: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  content: string; // sanitized HTML or markdown
  featuredImage: string;
  tags: string[];
  readTime: string;
  isDemo?: boolean;
}

export interface ProjectCaseStudy {
  id: string;
  title: string;
  category: 'Home' | 'Office' | 'Commercial' | string;
  location?: string;
  description?: string;
  systemSummary?: string;
  cameraCount?: string;
  clientQuote?: string;
  clientAuthor?: string;
  image?: string;
  isDemo?: boolean;
}

export interface Testimonial {
  id: string;
  name?: string;
  clientName?: string;
  client_name?: string;
  role?: string;
  clientRole?: string;
  company?: string;
  location?: string;
  comment?: string;
  content?: string;
  rating?: number;
  verified?: boolean;
  isDemo?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// ----------------------------------------------------------------------------
// Product Research Assistant (Mode A & Mode B)
// ----------------------------------------------------------------------------
export interface ResearchConfidenceField<T = any> {
  value: T;
  sourceUrl?: string;
  confidence: 'high' | 'medium' | 'low' | 'unverified';
  status: 'accepted' | 'edited' | 'rejected' | 'pending';
}

export interface ProductResearchResult {
  jobId: string;
  modelQuery: string;
  brand: string;
  suggestedName: ResearchConfidenceField<string>;
  suggestedCategory: ResearchConfidenceField<string>;
  suggestedShortDesc: ResearchConfidenceField<string>;
  suggestedKeyFeatures: ResearchConfidenceField<string[]>;
  suggestedSpecs: Record<string, ResearchConfidenceField<any>>;
  suggestedDocuments: ResearchConfidenceField<Array<{ title: string; url: string; type: string }>>;
  datasheetUrl?: string;
  sourcePriorityRanked: string[];
}

// ----------------------------------------------------------------------------
// Hero Slider & Banner Models (Phase 1 Light & Airy Master Slider)
// ----------------------------------------------------------------------------
export type HeroSlideBadge = 'New' | 'Featured' | 'Hot' | string;
export type HeroSlideSourceMode = 'manual' | 'product' | 'collection';
export type HeroCollectionRule = 'newest' | 'featured' | 'hot' | 'category';

export interface HeroFeatureHighlight {
  icon?: string; // e.g. "camera", "eye", "shield", "cpu", "wifi", "network", "zap"
  value: string; // e.g. "4K Ultra HD", "30m", "IP67", "PoE 54W"
  label: string; // e.g. "Resolution", "Smart IR", "Weatherproof", "Power Budget"
}

export interface HeroSlideOverrides {
  headline?: string;
  description?: string;
  badge?: HeroSlideBadge;
  image?: string;
  priceText?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
  highlights?: HeroFeatureHighlight[];
}

export interface HeroSlide {
  id: string;
  title: string; // Admin internal reference name
  enabled: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  sourceMode: HeroSlideSourceMode;

  // Mode 1: Manual properties
  badge?: HeroSlideBadge;
  headline?: string;
  description?: string;
  image?: string; // Transparent PNG / WebP url
  priceText?: string; // Formatted price e.g. "৳2,450"
  buttonText?: string; // e.g. "View Product"
  buttonLink?: string; // e.g. "/product/prod-hik-irpf-2mp"
  secondaryText?: string; // e.g. "Request quotation" or "Add to cart"
  secondaryLink?: string;
  highlights?: HeroFeatureHighlight[]; // 3-4 feature chips

  // Mode 2: From Product
  productId?: string;
  overrideFlags?: {
    headline?: boolean;
    description?: boolean;
    badge?: boolean;
    image?: boolean;
    price?: boolean;
    highlights?: boolean;
  };
  overrides?: HeroSlideOverrides;

  // Mode 3: Auto Collection
  collectionRule?: HeroCollectionRule;
  collectionCategoryId?: string;
  categorySlug?: string;
  collectionCount?: number;
}

export interface MediaItem {
  id: string;
  filename: string;
  original_name?: string;
  url: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
}

export interface PremiseEstimate {
  type: string;
  label: string;
  multiplier: number;
}

export interface QuoteFormData {
  propertyType: string;
  serviceNeeded: string;
  cameraCount: number;
  doorCount: number;
  storageDays: string;
  name: string;
  phone: string;
  location: string;
  preferredDate: string;
  notes: string;
  packagePreselected?: string;
}

export interface SearchResult {
  products: Array<{ id: number; name: string; model: string; price: number; image?: string; category_name?: string }>;
  categories: Array<{ id: number; name: string; slug: string; description: string }>;
  packages: Array<{ id: number; name: string; slug: string; camera_count: number; base_price: number; image?: string }>;
  services: Array<{ name: string; category: string; description: string; url: string }>;
}


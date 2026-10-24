import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Package, FolderTree, Tag, Sliders, Layers, ShoppingCart, Users,
  FileText, Settings, Sparkles, Check, X, AlertCircle, RefreshCw, Trash2, Edit3, Plus,
  Search, Shield, Eye, Database, ArrowRight, ExternalLink, ArrowUp, ArrowDown,
  Image as ImageIcon, SlidersHorizontal, Calendar, BookOpen, HelpCircle, Briefcase, Star, Globe, Compass, Phone, Wrench, Building2,
  Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, Truck, Activity, Zap, Percent, FileCheck
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Button, Input, Select, Badge, Card, Modal, Alert } from '../components/common/UI';
import { useAdminAuthStore, useSettingsStore } from '../store';
import { hasPermission, PERMISSIONS } from '../shared/permissions';
import {
  productService, categoryService, brandService, specTemplateService,
  packageService, orderService, quoteService, cmsService, productResearchService
} from '../services';
import { apiFetch } from '../services/apiClient';
import { INITIAL_CTA_DATA } from '../services/seedData';
import {
  Product, Category, Subcategory, Brand, SpecTemplate, SecurityPackage, PackageSeries, PackageSystemType, ServiceOffering, Order,
  QuoteRequest, SiteSettings, HomepageSection, ProductResearchResult, Role,
  HeroSlide, HeroFeatureHighlight
} from '../types';
import { ProductEditModal } from '../components/admin/ProductEditModal';
import { PackageEditModal } from '../components/admin/PackageEditModal';
import { BulkToolsModal } from '../components/admin/BulkToolsModal';
import { OrderDetailModal } from '../components/admin/OrderDetailModal';
import { PromoTileEditor } from '../components/admin/PromoTileEditor';
import { CustomersModule } from '../components/admin/CustomersModule';
import { SpecTemplatesModule } from '../components/admin/SpecTemplatesModule';
import { MediaLibraryView } from '../components/admin/MediaLibraryModal';
import { BlogCmsModule } from '../components/admin/BlogCmsModule';
import { FaqCmsModule } from '../components/admin/FaqCmsModule';
import { ProjectsModule } from '../components/admin/ProjectsModule';
import { PagesModule } from '../components/admin/PagesModule';
import { TestimonialsModule } from '../components/admin/TestimonialsModule';
import { RedirectsModule } from '../components/admin/RedirectsModule';
import { BrandsModule } from '../components/admin/BrandsModule';
import { ScenariosModule } from '../components/admin/ScenariosModule';
import { ServicesModule } from '../components/admin/ServicesModule';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { CompanyProfileModule } from '../components/admin/CompanyProfileModule';
import { GlossaryModule } from '../components/admin/GlossaryModule';
import { SettingsModule } from '../components/admin/SettingsModule';
import { CouponsModule } from '../components/admin/CouponsModule';
import { DocumentsModule } from '../components/admin/DocumentsModule';
import { SystemLogsAndHealthModule } from '../components/admin/SystemLogsAndHealthModule';
import { ApiControlCenterModule } from '../components/admin/ApiControlCenterModule';
import { ConfirmDialog } from '../components/admin/framework';
import { ImagePickerField } from '../components/admin/ImagePickerField';

export const AdminDashboard: React.FC<{ onNavigate: (route: string, param?: string) => void }> = ({ onNavigate }) => {
  const { currentUser, isAdminAuthenticated, checkAuth, login, logout, isLoading: authLoading, error: authError } = useAdminAuthStore();
  const { settings, loadSettings, updateSettings } = useSettingsStore();

  const [authChecked, setAuthChecked] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  const [activeModule, setActiveModule] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('module') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  // Sidebar Search, Navigation Hubs & State (Accordion Auto-Collapse)
  const [sidebarSearch, setSidebarSearch] = useState('');
  const sidebarSearchRef = useRef<HTMLInputElement>(null);

  const getHubForModule = (modId: string): string | null => {
    if (['orders', 'quotes', 'customers'].includes(modId)) return 'operations';
    if (['products', 'categories', 'templates', 'packages', 'coupons'].includes(modId)) return 'commerce';
    if (['heroslides', 'sections', 'scenarios', 'services', 'projects', 'testimonials'].includes(modId)) return 'storefront';
    if (['pages', 'company', 'blog', 'faqs', 'glossary'].includes(modId)) return 'content';
    if (['media', 'documents', 'brands'].includes(modId)) return 'media';
    if (['integrations', 'systemlogs', 'redirects', 'settings'].includes(modId)) return 'system';
    return null;
  };

  // Accordion Mode: Only ONE hub is expanded at a time, auto-collapsing the rest
  const [expandedHubId, setExpandedHubId] = useState<string | null>(() => {
    return getHubForModule(activeModule) || 'operations';
  });

  // When active module changes, auto-expand its parent hub and collapse others
  useEffect(() => {
    const parentHub = getHubForModule(activeModule);
    if (parentHub) {
      setExpandedHubId(parentHub);
    }
  }, [activeModule]);

  const toggleHub = useCallback((hubId: string) => {
    setExpandedHubId((prev) => (prev === hubId ? null : hubId));
  }, []);

  const handleSelectModule = useCallback((id: string) => {
    setActiveModule(id);
    const parentHub = getHubForModule(id);
    if (parentHub) {
      setExpandedHubId(parentHub);
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('module', id);
      window.history.replaceState(null, '', url.toString());
    } catch (_) {}
  }, []);
// Keyboard shortcut: Ctrl+K or Cmd+K to jump to sidebar search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sidebarSearchRef.current?.focus();
        sidebarSearchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [packageSeries, setPackageSeries] = useState<PackageSeries[]>([]);
  const [packageSystemTypes, setPackageSystemTypes] = useState<PackageSystemType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [dashboardAuditLogs, setDashboardAuditLogs] = useState<any[]>([]);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [hideTestData, setHideTestData] = useState(true);
  const [clearDemoModalOpen, setClearDemoModalOpen] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [resetSeedsModalOpen, setResetSeedsModalOpen] = useState(false);
  const [isResettingSeeds, setIsResettingSeeds] = useState(false);
  
  // Hero Slide Editor Modal State
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [heroPreviewMode, setHeroPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const isPlaceholderImage = (imgUrl?: string) => {
    if (!imgUrl || !imgUrl.trim()) return true;
    if (imgUrl.includes('.svg')) return true;
    if (imgUrl.includes('placeholder')) return true;
    return false;
  };

  // Test Data Identification & Exclusion
  const isTestOrder = (o: Order) => {
    if ((o as any).isTest || (o as any).is_test) return true;
    const name = (o.customerName || '').toLowerCase();
    const phone = (o.customerPhone || '').replace(/\D/g, '');
    const email = (o.customerEmail || '').toLowerCase();
    return (
      name.includes('test client') ||
      name.includes('phase 2') ||
      name.includes('test buyer') ||
      name.includes('victim') ||
      phone.endsWith('1700000000') ||
      phone.endsWith('1711122233') ||
      email.includes('test@') ||
      email.includes('testbuyer') ||
      email.includes('victim@')
    );
  };

  const isTestQuote = (q: QuoteRequest) => {
    if ((q as any).isTest || (q as any).is_test) return true;
    const name = (q.customerName || '').toLowerCase();
    const phone = ((q.phone || (q as any).customerPhone || '') as string).replace(/\D/g, '');
    const email = ((q.email || (q as any).customerEmail || '') as string).toLowerCase();
    return (
      name.includes('test client') ||
      name.includes('phase 2') ||
      phone.endsWith('1700000000') ||
      email.includes('test@')
    );
  };

  const isTestProduct = (p: Product) => {
    if ((p as any).isTest || (p as any).is_test || (p as any).isDemo || (p as any).is_demo) return true;
    const sku = (p.sku || '').toUpperCase();
    return (
      sku.startsWith('TEST-') ||
      sku.startsWith('NEG-') ||
      (p.name || '').toLowerCase().includes('test product')
    );
  };

  const operationalProducts = useMemo(() => {
    return hideTestData ? products.filter(p => !isTestProduct(p)) : products;
  }, [products, hideTestData]);

  const operationalOrders = useMemo(() => {
    return hideTestData ? orders.filter(o => !isTestOrder(o)) : orders;
  }, [orders, hideTestData]);

  const operationalQuotes = useMemo(() => {
    return hideTestData ? quotes.filter(q => !isTestQuote(q)) : quotes;
  }, [quotes, hideTestData]);

  const catalogPriorityFixes = useMemo(() => {
    return operationalProducts.filter(p =>
      isPlaceholderImage(p.primaryImage) ||
      !p.modelNumber?.trim() ||
      !p.sku?.trim() ||
      !p.specifications ||
      Object.keys(p.specifications).length === 0
    ).slice(0, 3);
  }, [operationalProducts]);

  // Category Editor Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // CCTV Package Editor Modal State
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<SecurityPackage> | null>(null);

  // Product Form / Edit Modal State
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(15);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkToolsModalOpen, setBulkToolsModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Operations Hub States: Orders & Quotes Pipeline & Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusTab, setOrderStatusTab] = useState<'all' | 'action_needed' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteStatusTab, setQuoteStatusTab] = useState<'all' | 'pending' | 'contacted' | 'quoted' | 'approved' | 'rejected'>('all');

  const [orderInvoiceModalOpen, setOrderInvoiceModalOpen] = useState(false);

  const handleOpenProductEdit = (p: Product) => {
    setEditingProduct(p);
    setProductEditModalOpen(true);
  };

  const handleOpenProductCreate = () => {
    setEditingProduct({
      id: '',
      name: '',
      modelNumber: '',
      sku: '',
      brand: brands[0]?.name || 'Hikvision',
      brandId: brands[0]?.id || 'b-hikvision',
      category: categories[0]?.name || 'CCTV Cameras',
      categoryId: categories[0]?.id || 'cctv-cameras',
      status: 'active',
      websiteVisible: true,
      pricing: { currency: 'BDT' },
      inventory: { available: 10, status: 'in_stock' }
    });
    setProductEditModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will check for any historical order/quote references.`)) {
      return;
    }
    try {
      await productService.deleteProduct(id);
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.items);
      if (typeof res?.total === 'number') setTotalProductsCount(res.total);
    } catch (err: any) {
      if (err.statusCode === 409 || err.message?.includes('archive instead') || err.message?.includes('Referenced') || err.message?.includes('CANNOT_DELETE_REFERENCED')) {
        const shouldArchive = confirm(
          `Cannot permanently delete "${name}" because it is referenced in active orders, quotations, stock records, or packages.\n\nWould you like to safely ARCHIVE this product instead? (It will be hidden from the storefront while keeping all historical records intact)`
        );
        if (shouldArchive) {
          try {
            if (productService.archiveProduct) {
              await productService.archiveProduct(id);
            } else {
              await productService.updateProduct(id, { status: 'archived', websiteVisible: false });
            }
            const res = await productService.getProducts({ limit: 100 });
            setProducts(res.items);
            if (typeof res?.total === 'number') setTotalProductsCount(res.total);
            alert(`"${name}" has been safely archived.`);
          } catch (archiveErr: any) {
            alert(archiveErr.message || 'Failed to archive product');
          }
        }
      } else {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const handleArchiveProduct = async (id: string, name: string) => {
    const reason = prompt(`Enter archive reason for "${name}" (optional):`, 'Catalog rotation / superseded model');
    if (reason === null) return;
    try {
      if (productService.archiveProduct) {
        await productService.archiveProduct(id);
      } else {
        await productService.updateProduct(id, { status: 'archived', websiteVisible: false });
      }
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.items);
      if (typeof res?.total === 'number') setTotalProductsCount(res.total);
    } catch (err: any) {
      alert(err.message || 'Failed to archive product');
    }
  };

  const handleRestoreProduct = async (id: string, name: string) => {
    if (!confirm(`Restore "${name}" to active published catalog?`)) return;
    try {
      if (productService.restoreProduct) {
        await productService.restoreProduct(id);
      } else {
        await productService.updateProduct(id, { status: 'active', websiteVisible: true });
      }
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.items);
      if (typeof res?.total === 'number') setTotalProductsCount(res.total);
    } catch (err: any) {
      alert(err.message || 'Failed to restore product');
    }
  };

  // Special Offer Slider & Management State
  const [quickOfferProductId, setQuickOfferProductId] = useState<string>('');
  const [quickOfferSalePrice, setQuickOfferSalePrice] = useState<string>('');
  const [quickOfferError, setQuickOfferError] = useState<string>('');

  const handleApplyQuickOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOfferProductId || !quickOfferSalePrice) {
      setQuickOfferError('Please select a product and enter a promotional price.');
      return;
    }
    const targetProduct = products.find(p => p.id === quickOfferProductId);
    if (!targetProduct) return;
    const saleNum = parseFloat(quickOfferSalePrice);
    if (isNaN(saleNum) || saleNum <= 0) {
      setQuickOfferError('Please enter a valid positive sale price.');
      return;
    }
    if (targetProduct.pricing?.regularPrice && saleNum >= targetProduct.pricing.regularPrice) {
      setQuickOfferError(`Sale price (৳${saleNum}) must be less than regular price (৳${targetProduct.pricing.regularPrice}).`);
      return;
    }
    try {
      setQuickOfferError('');
      const updatedPricing = { ...targetProduct.pricing, currency: 'BDT' as const, salePrice: saleNum };
      await productService.updateProduct(targetProduct.id, { pricing: updatedPricing });
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.items);
      if (typeof res?.total === 'number') setTotalProductsCount(res.total);
      setQuickOfferProductId('');
      setQuickOfferSalePrice('');
    } catch (err: any) {
      setQuickOfferError(`Failed to apply offer: ${err.message}`);
    }
  };

  const handleRemoveOfferFromProduct = async (p: Product) => {
    if (!confirm(`Remove special offer discount from "${p.name}"?`)) return;
    try {
      const updatedPricing = { ...p.pricing, currency: 'BDT' as const, salePrice: undefined };
      await productService.updateProduct(p.id, { pricing: updatedPricing });
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.items);
      if (typeof res?.total === 'number') setTotalProductsCount(res.total);
    } catch (err: any) {
      alert(`Failed to remove offer: ${err.message}`);
    }
  };
  
  // Product Creation Assistant State
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'A' | 'B'>('A');
  const [researchBrand, setResearchBrand] = useState('Hikvision');
  const [researchModel, setResearchModel] = useState('DS-2CE16D0T-IT3F');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<ProductResearchResult | null>(null);

  // Editable fields in Review Screen
  const [reviewFields, setReviewFields] = useState<Record<string, { value: any; status: string }>>({});
  const [manualReviewConfirmed, setManualReviewConfirmed] = useState(false);

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await apiFetch<any>('/audit-logs?limit=8');
      if (res && Array.isArray(res.items)) {
        setDashboardAuditLogs(res.items);
      }
    } catch (_) {
      // Handled gracefully when audit table is empty or permission restricted
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      await Promise.allSettled([
        productService.getProducts({ limit: 100 }).then(r => {
          if (r) {
            setProducts(Array.isArray(r.items) ? r.items : (Array.isArray(r) ? r : []));
            if (typeof r.total === 'number') {
              setTotalProductsCount(r.total);
            }
          }
        }),
        categoryService.getCategories().then(setCategories),
        brandService.getBrands().then(setBrands),
        specTemplateService.getTemplates().then(setTemplates),
        packageService.getPackages().then(setPackages),
        packageService.getPackageSeries().then(setPackageSeries),
        packageService.getPackageSystemTypes().then(setPackageSystemTypes),
        orderService.getAllOrders().then(setOrders),
        quoteService.getQuotes().then(setQuotes),
        loadAuditLogs(),
        cmsService.getHomepageSections().then((secs) => {
          let migrated = false;
          const updated = (secs || []).map((s) => {
            if (s.id === 'sec-wifi' && (s.type === 'wifi_cameras' || s.title === 'Wi-Fi Cameras')) {
              migrated = true;
              return {
                ...s,
                type: 'wifi_series',
                title: 'Wi-Fi Series',
                eyebrow: s.eyebrow || 'Wi-Fi products',
                subtitle: s.subtitle || 'Cameras, doorbells, lights and more you control from a phone app',
                itemLimit: s.itemLimit ?? 8,
                showChipRow: s.showChipRow !== false
              };
            }
            return s;
          });
          if (migrated) {
            cmsService.updateHomepageSections(updated);
          }
          setSections(updated);
        }),
        cmsService.getHeroSlides().then(setHeroSlides)
      ]);
    } catch (err) {
      console.warn('Dashboard data refresh partial error', err);
    }
  }, [loadAuditLogs]);

  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true));
  }, [checkAuth]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadSettings();
      refreshAllData();
    }
  }, [isAdminAuthenticated, loadSettings, refreshAllData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    setSubmittingLogin(true);
    try {
      const ok = await login(emailInput, passwordInput);
      if (ok) {
        setPasswordInput('');
      }
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleRefreshDashboard = async () => {
    setIsRefreshingDashboard(true);
    try {
      await refreshAllData();
    } finally {
      setIsRefreshingDashboard(false);
    }
  };

  const handleOpenNewSlide = () => {
    setEditingSlide({
      id: `slide-${Date.now()}`,
      title: 'New Hardware Banner Slide',
      enabled: true,
      order: heroSlides.length + 1,
      sourceMode: 'manual',
      showBadge: true,
      badge: 'New',
      modelNumber: 'DS-2CE10DF0T-F',
      eyebrow: 'DAY & NIGHT FULL-COLOR SURVEILLANCE',
      tabLabel: 'ColorVu Camera',
      headline: 'Hikvision ColorVu 2MP Bullet Camera',
      description: 'Intelligent 2MP security with F1.0 large aperture lens and AcuSense AI.',
      image: '/images/hero/hikvision-bullet.png',
      priceText: '৳2,450',
      buttonText: 'View Product',
      buttonLink: '/product/prod-hik-irpf-2mp',
      secondaryButtonText: 'Call for Service',
      secondaryButtonLink: 'tel:+8801540535150',
      secondaryText: 'Call for Service',
      secondaryLink: 'tel:+8801540535150',
      highlights: [
        { icon: 'camera', value: '2 MP', label: 'Resolution' },
        { icon: 'eye', value: '20m', label: 'ColorVu Night' },
        { icon: 'shield', value: 'IP67', label: 'Ingress Rating' },
        { icon: 'zap', value: '12V DC', label: 'Power Input' }
      ]
    });
    setSlideModalOpen(true);
  };

  const handleSeedSampleHeroSlides = async () => {
    const samples: HeroSlide[] = [
      {
        id: 'slide-hik-bullet',
        title: 'Hikvision ColorVu Bullet Camera',
        enabled: true,
        order: 1,
        sourceMode: 'manual',
        showBadge: true,
        badge: 'New',
        modelNumber: 'DS-2CE10DF0T-F',
        eyebrow: 'DAY & NIGHT FULL-COLOR SURVEILLANCE',
        tabLabel: 'ColorVu Camera',
        headline: 'Hikvision ColorVu 2MP Bullet Camera',
        description: 'F1.0 super-aperture lens captures vivid full-color video day and night even in pitch-black darkness with AcuSense intelligence.',
        image: '/images/hero/hikvision-bullet.png',
        priceText: '৳2,450',
        buttonText: 'View Product',
        buttonLink: '/product/prod-hik-irpf-2mp',
        secondaryButtonText: 'Call for Service',
        secondaryButtonLink: 'tel:+8801540535150',
        highlights: [
          { icon: 'camera', value: '2 MP', label: 'Resolution' },
          { icon: 'eye', value: '20m', label: 'ColorVu Night' },
          { icon: 'shield', value: 'IP67', label: 'Ingress Rating' },
          { icon: 'zap', value: '12V DC', label: 'Power Input' }
        ]
      },
      {
        id: 'slide-ruijie-ap',
        title: 'Ruijie Reyee Wi-Fi 6 Access Point',
        enabled: true,
        order: 2,
        sourceMode: 'manual',
        showBadge: true,
        badge: 'Featured',
        modelNumber: 'RG-RAP2260(E)',
        eyebrow: 'ENTERPRISE WI-FI 6 ROAMING',
        tabLabel: 'Wi-Fi 6 AP',
        headline: 'Ruijie Reyee AX3200 Ceiling Access Point',
        description: 'High-density multi-gigabit ceiling mount access point engineered for smooth roaming and enterprise coverage.',
        image: '/images/hero/ruijie-wifi6.png',
        priceText: '৳14,500',
        buttonText: 'View Product',
        buttonLink: '/catalog',
        secondaryButtonText: 'Call for Service',
        secondaryButtonLink: 'tel:+8801540535150',
        highlights: [
          { icon: 'wifi', value: '3200 Mbps', label: 'Wi-Fi 6 Speed' },
          { icon: 'cpu', value: '2.5G', label: 'Uplink Port' },
          { icon: 'zap', value: 'PoE+', label: '802.3at Power' },
          { icon: 'shield', value: '512 Clients', label: 'Max Capacity' }
        ]
      },
      {
        id: 'slide-zkteco-bio',
        title: 'ZKTeco Biometric Time & Attendance',
        enabled: true,
        order: 3,
        sourceMode: 'manual',
        showBadge: true,
        badge: 'Hot',
        modelNumber: 'MB20-VL',
        eyebrow: 'VISIBLE LIGHT RECOGNITION',
        tabLabel: 'Biometric Terminal',
        headline: 'ZKTeco Visible Light Face & Fingerprint Terminal',
        description: 'Anti-spoofing facial recognition and biometric attendance terminal with fast 0.5s verification and TCP/IP connectivity.',
        image: '/images/hero/zkteco-biometric.png',
        priceText: '৳8,200',
        buttonText: 'View Product',
        buttonLink: '/catalog',
        secondaryButtonText: 'Call for Service',
        secondaryButtonLink: 'tel:+8801540535150',
        highlights: [
          { icon: 'eye', value: '500 Faces', label: 'Face Capacity' },
          { icon: 'camera', value: '1,000 Prints', label: 'Fingerprints' },
          { icon: 'cpu', value: 'TCP/IP', label: 'Network Sync' },
          { icon: 'shield', value: '0.5s', label: 'Recognition Speed' }
        ]
      }
    ];

    for (const s of samples) {
      await cmsService.saveHeroSlide(s);
    }
    cmsService.getHeroSlides().then(setHeroSlides);
  };

  const handleSaveSlide = async (slide: HeroSlide) => {
    await cmsService.saveHeroSlide(slide);
    cmsService.getHeroSlides().then(setHeroSlides);
    setSlideModalOpen(false);
    setEditingSlide(null);
  };

  const handleDeleteSlide = async (id: string) => {
    if (confirm('Delete this hero slide?')) {
      await cmsService.deleteHeroSlide(id);
      cmsService.getHeroSlides().then(setHeroSlides);
    }
  };

  const handleReorderSlide = async (idx: number, direction: 'up' | 'down') => {
    const newSlides = [...heroSlides];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;
    const temp = newSlides[idx];
    newSlides[idx] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;
    newSlides.forEach((s, i) => { s.order = i + 1; });
    for (const s of newSlides) {
      await cmsService.saveHeroSlide(s);
    }
    setHeroSlides(newSlides);
  };

  // Category Management Handlers
  const handleOpenNewCategory = () => {
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      image: '',
      specTemplateId: templates[0]?.id || 'tpl-cctv',
      status: 'active',
      showOnHomepage: true,
      displayOrder: categories.length + 1
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editingCategory.name?.trim()) return;
    const slug = editingCategory.slug?.trim() || editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (editingCategory.id) {
      await categoryService.updateCategory(editingCategory.id, {
        ...editingCategory,
        slug,
        showOnHomepage: editingCategory.showOnHomepage !== false,
        image: editingCategory.image || '',
        promoTile: editingCategory.promoTile
      });
    } else {
      await categoryService.createCategory({
        name: editingCategory.name,
        slug,
        description: editingCategory.description || '',
        image: editingCategory.image || '',
        promoTile: editingCategory.promoTile,
        specTemplateId: editingCategory.specTemplateId || templates[0]?.id || 'tpl-cctv',
        status: editingCategory.status || 'active',
        showOnHomepage: editingCategory.showOnHomepage !== false,
        displayOrder: editingCategory.displayOrder || categories.length + 1,
        subcategories: []
      } as any);
    }
    categoryService.getCategories().then(setCategories);
    setCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await categoryService.deleteCategory(id);
      categoryService.getCategories().then(setCategories);
    }
  };

  const handleReorderCategory = async (catId: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === catId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const current = categories[idx];
    const target = categories[targetIdx];
    try {
      const currentOrder = current.displayOrder || current.order || (idx + 1);
      const targetOrder = target.displayOrder || target.order || (targetIdx + 1);
      await categoryService.updateCategory(current.id, { displayOrder: targetOrder, order: targetOrder });
      await categoryService.updateCategory(target.id, { displayOrder: currentOrder, order: currentOrder });
      const updated = await categoryService.getCategories();
      setCategories(updated);
    } catch (err: any) {
      alert('Error reordering category: ' + err.message);
    }
  };

  // Package Management Handlers
  const handleOpenNewPackage = () => {
    setEditingPackage({
      name: 'New Turnkey CCTV Package',
      slug: `package-${Date.now()}`,
      description: 'Turnkey high-definition camera package with DVR, storage, and complete installation accessories.',
      cameraCount: 4,
      basePrice: 16500,
      cameraResolution: '2MP (1080p)',
      cameraModel: 'Hikvision DS-2CE16D0T-IRPF',
      dvrModel: 'Hikvision DS-7104HQHI-K1',
      storageDescription: '1TB Surveillance Hard Drive',
      inclusions: [
        'Hikvision Turbo HD Cameras (Bullet/Dome)',
        'Hikvision Turbo HD DVR (H.265+ Compression)',
        'Western Digital Purple Surveillance HDD',
        'Cat6 Pure Copper Network & Coaxial Cable (40m)',
        'Heavy-Duty Centralized 12V Power Unit',
        'Video Baluns, DC Connectors & Waterproof Junction Boxes',
        'Hik-Connect Smartphone App Remote View Setup'
      ],
      isActive: true
    });
    setPackageModalOpen(true);
  };

  const handleSavePackage = async () => {
    if (!editingPackage || !editingPackage.name?.trim()) return;
    const pkgToSave: SecurityPackage = {
      id: editingPackage.id || `pkg-${Date.now()}`,
      name: editingPackage.name,
      slug: editingPackage.slug || editingPackage.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: editingPackage.description || '',
      cameraCount: editingPackage.cameraCount || 4,
      basePrice: editingPackage.basePrice || 15000,
      cameraResolution: editingPackage.cameraResolution || '2MP',
      cameraModel: editingPackage.cameraModel || 'Hikvision DS-2CE16D0T-IRPF',
      dvrModel: editingPackage.dvrModel || 'Hikvision 4-Ch DVR',
      storageDescription: editingPackage.storageDescription || '1TB HDD',
      inclusions: editingPackage.inclusions || [],
      isActive: editingPackage.isActive ?? true,
      seriesId: editingPackage.seriesId,
      seriesName: editingPackage.seriesName,
      technologyLabel: editingPackage.technologyLabel,
      badge: (editingPackage.badge || '').trim() || undefined,
      featuredOnHomepage: Boolean(editingPackage.featuredOnHomepage),
      systemTypeId: editingPackage.systemTypeId,
      systemTypeSlug: editingPackage.systemTypeSlug,
      systemTypeName: editingPackage.systemTypeName,
      isQuoteOnly: editingPackage.isQuoteOnly,
      cameraCountsSupported: editingPackage.cameraCountsSupported || (editingPackage.cameraCount ? [editingPackage.cameraCount] : [4]),
      componentQuantities: editingPackage.componentQuantities,
      rules: editingPackage.rules,
      pricingRules: editingPackage.pricingRules || {
        twoCamPrice: 11500,
        fourCamPrice: 16500,
        eightCamPrice: 28500,
        sixteenCamPrice: 52000
      }
    };
    await packageService.savePackage(pkgToSave);
    packageService.getPackages().then(setPackages);
    setPackageModalOpen(false);
    setEditingPackage(null);
  };

  // Quotes Status Handler
  const handleUpdateQuoteStatus = async (quoteId: string, status: QuoteRequest['status']) => {
    await quoteService.updateQuoteStatus(quoteId, status);
    quoteService.getQuotes().then(setQuotes);
  };

  // Run Research Assistant (Mode A)
  const handleStartResearch = async () => {
    if (!researchModel.trim()) return;
    setIsResearching(true);
    try {
      const res = await productResearchService.startResearch(researchBrand, researchModel.trim());
      setResearchResult(res);
      setManualReviewConfirmed(false);
      // Initialize review fields
      const initReview: Record<string, { value: any; status: string }> = {
        name: { value: res.suggestedName.value, status: 'pending' },
        category: { value: res.suggestedCategory.value, status: 'pending' },
        shortDesc: { value: res.suggestedShortDesc.value, status: 'pending' }
      };
      Object.entries(res.suggestedSpecs).forEach(([k, v]) => {
        initReview[k] = { value: v.value, status: 'pending' };
      });
      setReviewFields(initReview);
    } finally {
      setIsResearching(false);
    }
  };

  // Open Research Result directly in ProductEditModal as Draft for thorough review & editing
  const handleOpenInEditorFromResearch = () => {
    if (!researchResult) return;

    const matchedCat = categories.find(c => c.name.toLowerCase() === (reviewFields.category?.value || '').toLowerCase()) || categories[0];
    const matchedBrand = brands.find(b => b.name.toLowerCase() === researchResult.brand.toLowerCase()) || brands[0];

    const specs: Record<string, any> = {};
    Object.entries(researchResult.suggestedSpecs).forEach(([k]) => {
      if (reviewFields[k] && reviewFields[k].status !== 'rejected') {
        specs[k] = reviewFields[k].value;
      }
    });

    setEditingProduct({
      id: '',
      name: reviewFields.name?.value || `${researchResult.brand} ${researchResult.modelQuery}`,
      brand: researchResult.brand,
      brandId: matchedBrand?.id || 'b-hikvision',
      modelNumber: researchResult.modelQuery,
      sku: `${researchResult.brand.slice(0, 3).toUpperCase()}-${researchResult.modelQuery.replace(/\s+/g, '')}`,
      category: matchedCat?.name || 'CCTV Cameras',
      categoryId: matchedCat?.id || 'cctv-cameras',
      productType: 'physical',
      status: 'draft', // DRAFT - never auto-published!
      websiteVisible: false,
      posAvailable: true,
      images: ['/images/hero/hikvision-bullet.png'],
      primaryImage: '/images/hero/hikvision-bullet.png',
      shortDescription: reviewFields.shortDesc?.value || '',
      description: reviewFields.shortDesc?.value || '',
      keyFeatures: researchResult.suggestedKeyFeatures?.value || [],
      specifications: specs,
      pricing: { currency: 'BDT' },
      inventory: { available: 10, status: 'in_stock' },
      unit: 'Piece'
    });

    setAssistantModalOpen(false);
    setProductEditModalOpen(true);
  };

  // Commit Approved Product from Review Screen as Draft
  const handleSaveReviewedProduct = async () => {
    if (!researchResult) return;

    const matchedCat = categories.find(c => c.name.toLowerCase() === (reviewFields.category?.value || '').toLowerCase()) || categories[0];
    const matchedBrand = brands.find(b => b.name.toLowerCase() === researchResult.brand.toLowerCase()) || brands[0];

    const specs: Record<string, any> = {};
    Object.entries(researchResult.suggestedSpecs).forEach(([k]) => {
      if (reviewFields[k] && reviewFields[k].status !== 'rejected') {
        specs[k] = reviewFields[k].value;
      }
    });

    await productService.createProduct({
      name: reviewFields.name?.value || `${researchResult.brand} ${researchResult.modelQuery}`,
      brand: researchResult.brand,
      brandId: matchedBrand.id,
      modelNumber: researchResult.modelQuery,
      sku: `${researchResult.brand.slice(0, 3).toUpperCase()}-${researchResult.modelQuery.replace(/\s+/g, '')}`,
      category: matchedCat.name,
      categoryId: matchedCat.id,
      productType: 'physical',
      status: 'draft', // Saved as Draft - requires admin approval to publish
      websiteVisible: false,
      posAvailable: true,
      images: ['/images/hero/hikvision-bullet.png'],
      primaryImage: '/images/hero/hikvision-bullet.png',
      shortDescription: reviewFields.shortDesc?.value || '',
      description: reviewFields.shortDesc?.value || '',
      keyFeatures: researchResult.suggestedKeyFeatures.value || [],
      specifications: specs,
      pricing: { currency: 'BDT' }, // Unpriced by default -> "Request quotation"
      inventory: { available: 10, status: 'in_stock' },
      unit: 'Piece'
    });

    setAssistantModalOpen(false);
    setResearchResult(null);
    setManualReviewConfirmed(false);
    refreshAllData();
  };

  const handleClearDemoData = async () => {
    setIsClearingDemo(true);
    try {
      await cmsService.clearDemoData('CLEAR DEMO DATA');
      setClearDemoModalOpen(false);
      refreshAllData();
      alert('All sample content removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to clear sample content.');
    } finally {
      setIsClearingDemo(false);
    }
  };

  const handleResetSeeds = async () => {
    setIsResettingSeeds(true);
    try {
      await cmsService.resetToInitialSeeds('RESET DATABASE');
      setResetSeedsModalOpen(false);
      refreshAllData();
      alert('Store reset to initial demonstration state.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset seeds.');
    } finally {
      setIsResettingSeeds(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#F15A24] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying security session...</span>
        </div>
      </div>
    );
  }

  const canAccessWebsite = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.role === 'super-admin' ||
    (Array.isArray(currentUser.permissions) && (currentUser.permissions.includes('website.access') || currentUser.permissions.includes('*')))
  );

  const hasPerm = (perm: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'super-admin') return true;
    return hasPermission(currentUser.permissions, perm);
  };

  const hasStaffAccess = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.role === 'super-admin' ||
    hasPerm('staff.access') ||
    hasPerm('staff.manage')
  );

  if (!isAdminAuthenticated || !currentUser || !canAccessWebsite) {
    return (
      <div className="admin-theme dark min-h-screen bg-slate-950 flex flex-col justify-between">
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F15A24]"></span>
            <span className="text-sm font-black text-white tracking-tight font-heading">Camne<span className="text-[#F15A24]">X</span> Website Manager</span>
          </div>
          <button onClick={() => onNavigate('home')} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Return to Storefront
          </button>
        </header>

        <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-[#F15A24]"></span>
              <span className="text-2xl font-black text-white tracking-tight">Camne<span className="text-[#F15A24]">X</span></span>
            </div>
            <h2 className="text-center text-xl font-bold tracking-tight text-white">
              Website Manager
            </h2>
            <p className="mt-1 text-center text-xs text-slate-400">
              Sign in with your authorized Website Manager or administrator credentials
            </p>
          </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-xl sm:px-10">
            <form className="space-y-4" onSubmit={handleAdminLogin}>
              {authError && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-lg">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300">Admin Email</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@camnexbd.com"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLogin}
                className="w-full mt-2 min-h-[44px] py-2.5 px-6 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-sm font-bold rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingLogin ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Sign In to Website Manager</span>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Protected by HttpOnly Cookie & RBAC</span>
              <button onClick={() => onNavigate('home')} className="text-slate-400 hover:text-white underline">
                Return to Storefront
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  // Dashboard Overview: Real-time Date & Relative Time Helper
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formatRelativeTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      const diffMs = Date.now() - d.getTime();
      if (isNaN(diffMs)) return timeStr;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return timeStr;
    }
  };

  // Dashboard Overview: Real Catalog Metrics
  const activeProducts = operationalProducts.filter(p => p.status === 'active');
  const draftProducts = operationalProducts.filter(p => p.status !== 'active');
  const productsWithImage = operationalProducts.filter(p => !isPlaceholderImage(p.primaryImage));
  const missingImages = operationalProducts.filter(p => isPlaceholderImage(p.primaryImage));
  const missingModelOrSku = operationalProducts.filter(p => !p.modelNumber?.trim() || !p.sku?.trim());
  const missingSpecs = operationalProducts.filter(p => !p.specifications || Object.keys(p.specifications).length === 0);
  const missingPrice = operationalProducts.filter(p => !p.pricing?.regularPrice && !p.pricing?.salePrice);
  const lowStockProducts = operationalProducts.filter(p => (p.inventory?.available ?? 0) <= 3);
  const fullyReadyProducts = operationalProducts.filter(p =>
    p.status === 'active' &&
    !isPlaceholderImage(p.primaryImage) &&
    p.modelNumber?.trim() &&
    p.sku?.trim() &&
    p.specifications &&
    Object.keys(p.specifications).length > 0 &&
    (p.pricing?.regularPrice || p.pricing?.salePrice)
  );
  // Catalog Product Total: use official API total if provided (including legitimate 0), fallback to loaded products length
  const displayedProductTotal = typeof totalProductsCount === 'number' ? totalProductsCount : operationalProducts.length;
  const catalogReadinessScore = displayedProductTotal > 0 ? Math.round((fullyReadyProducts.length / displayedProductTotal) * 100) : 100;

  // Multi-facet Filtered Products for Product Management Table
  const filteredProducts = operationalProducts.filter(p => {
    const q = productSearchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));
    const matchesCat = !productCategoryFilter || p.categoryId === productCategoryFilter || p.category === productCategoryFilter || p.categorySlug === productCategoryFilter;
    const matchesBrand = !productBrandFilter || p.brandId === productBrandFilter || p.brand === productBrandFilter;
    const matchesStatus = !productStatusFilter || p.status === productStatusFilter;
    const matchesStock = !productStockFilter ||
      (productStockFilter === 'in_stock' && (p.inventory?.available ?? 0) > 5) ||
      (productStockFilter === 'low_stock' && (p.inventory?.available ?? 0) > 0 && (p.inventory?.available ?? 0) <= 5) ||
      (productStockFilter === 'out_of_stock' && (p.inventory?.available ?? 0) <= 0);

    return matchesSearch && matchesCat && matchesBrand && matchesStatus && matchesStock;
  });

  const totalFilteredProducts = filteredProducts.length;
  const totalProductPages = Math.max(1, Math.ceil(totalFilteredProducts / productPageSize));
  const validProductPage = Math.min(Math.max(1, productPage), totalProductPages);
  const paginatedProducts = filteredProducts.slice((validProductPage - 1) * productPageSize, validProductPage * productPageSize);

  // Dashboard Overview: Real Orders & Revenue Metrics
  const pendingOrders = operationalOrders.filter(o => o.status === 'pending');
  const processingOrders = operationalOrders.filter(o => o.status === 'processing' || o.status === 'confirmed');
  const unverifiedPayments = operationalOrders.filter(o => o.paymentStatus === 'unverified');
  const totalOrderRevenue = operationalOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const ordersWaitingTooLong = pendingOrders.filter(o => {
    const t = new Date(o.createdAt).getTime();
    return !isNaN(t) && (Date.now() - t) > 24 * 3600 * 1000;
  });

  // Dashboard Overview: Real Quotes Metrics
  const pendingQuotes = operationalQuotes.filter(q => q.status === 'pending');
  const quotedQuotes = operationalQuotes.filter(q => q.status === 'quoted');

  // Dashboard Overview: Real Category Metrics
  const activeCategories = categories.filter(c => c.status !== 'inactive');
  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);

  // Urgent Operational Work Queue Count: deduplicate orders that have both pending confirmation and unverified payment
  const orderIdsNeedingAction = new Set([
    ...pendingOrders.map(o => o.id),
    ...unverifiedPayments.map(o => o.id)
  ]);
  const totalWorkQueueCount = orderIdsNeedingAction.size + pendingQuotes.length;

  // Real System & Store Activity Feed (Audit Logs or Synthesized Orders & Inquiries)
  const combinedRecentActivity = (() => {
    if (dashboardAuditLogs && dashboardAuditLogs.length > 0) {
      return dashboardAuditLogs.map(log => ({
        id: log.id,
        type: 'audit' as const,
        provenance: 'Audit Log' as const,
        entity: log.entity || 'system',
        action: log.action || 'event',
        title: `${log.actorName || 'System'} ${log.action} ${log.entity}`,
        subtitle: log.entityId ? `ID: ${log.entityId}` : '',
        timestamp: log.createdAt,
        actor: log.actorName || 'System'
      }));
    }
    const events: Array<{
      id: string;
      type: 'order' | 'quote';
      provenance: 'Store Activity';
      entity: string;
      action: string;
      title: string;
      subtitle: string;
      timestamp: string;
      actor: string;
    }> = [];

    orders.forEach(o => {
      events.push({
        id: `act-ord-${o.id}`,
        type: 'order',
        provenance: 'Store Activity',
        entity: 'order',
        action: o.status,
        title: `Order #${o.orderNumber} placed`,
        subtitle: `${o.customerName} · ৳${(o.total || 0).toLocaleString()}`,
        timestamp: o.createdAt,
        actor: o.customerName
      });
    });

    quotes.forEach(q => {
      events.push({
        id: `act-qt-${q.id}`,
        type: 'quote',
        provenance: 'Store Activity',
        entity: 'quote',
        action: q.status,
        title: `Quote inquiry received`,
        subtitle: `${q.customerName} · ${q.serviceType || 'Premise Survey'}`,
        timestamp: q.createdAt,
        actor: q.customerName
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  })();

  // Determine feed provenance badge strictly from the rendered events
  const renderedFeedEvents = combinedRecentActivity.slice(0, 5);
  const feedHasAudit = renderedFeedEvents.some(e => e.type === 'audit');
  const feedHasStore = renderedFeedEvents.some(e => e.type === 'order' || e.type === 'quote');
  const feedProvenanceBadge = renderedFeedEvents.length === 0
    ? { label: 'Live Events', color: 'bg-slate-500' }
    : feedHasAudit && feedHasStore
    ? { label: 'Combined Stream', color: 'bg-indigo-400' }
    : feedHasAudit
    ? { label: 'Audit Log', color: 'bg-sky-400' }
    : { label: 'Store Activity', color: 'bg-emerald-400' };

  return (
    <div className="admin-theme dark bg-slate-900 min-h-screen text-slate-100 flex flex-col">
      <SEO title="Website Manager | CamneX Business Platform" description="Website administration portal." noIndex={true} />

      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-white font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-[#F15A24]"></span>
            <span>Camne<strong className="text-[#F15A24]">X</strong> Website Manager</span>
          </button>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-400 font-mono">Storefront & CMS Management</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{currentUser?.name || currentUser?.email}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-[10px] uppercase">
              {currentUser?.role}
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="text-xs text-slate-400 hover:text-red-400 font-medium px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:border-red-800 transition-colors"
          >
            Sign Out
          </button>

          {hasStaffAccess && (
            <a
              href="/staff"
              className="text-xs text-sky-400 hover:text-sky-300 font-bold hover:underline flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:border-sky-700 transition-colors"
            >
              <span>Open Staff App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-[#F15A24] font-bold hover:underline flex items-center gap-1"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        {/* Upgraded 6-Hub Enterprise Navigation Sidebar */}
        <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none">
          {/* Quick Search & Filter Header */}
          <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-950/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={sidebarSearchRef}
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Jump to module (Ctrl+K)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24] focus:ring-1 focus:ring-[#F15A24]/40 transition-colors"
              />
              {sidebarSearch && (
                <button
                  type="button"
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Navigation Hubs */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
            {/* Top-Level: Dashboard Overview */}
            {(!sidebarSearch || 'dashboard overview'.includes(sidebarSearch.toLowerCase())) && (
              <div className="pb-2.5 border-b border-slate-800/60">
                <button
                  type="button"
                  data-module="dashboard"
                  onClick={() => handleSelectModule('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeModule === 'dashboard'
                      ? 'bg-[#F15A24] text-white shadow-lg shadow-[#F15A24]/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-white" />
                    <span>Dashboard Overview</span>
                  </div>
                  {activeModule === 'dashboard' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  )}
                </button>
              </div>
            )}

            {/* 6 Functional Hubs */}
            {[
              {
                id: 'operations',
                label: 'Operations & Fulfillment',
                icon: ShoppingCart,
                badge: (operationalOrders.filter(o => o.status === 'pending').length + operationalQuotes.filter(q => q.status === 'pending').length) > 0
                  ? String(operationalOrders.filter(o => o.status === 'pending').length + operationalQuotes.filter(q => q.status === 'pending').length)
                  : null,
                badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                items: [
                  {
                    id: 'orders',
                    label: 'Orders & Timeline',
                    icon: <ShoppingCart className="w-4 h-4" />,
                    perm: PERMISSIONS.ORDERS_READ,
                    badge: operationalOrders.filter(o => o.status === 'pending').length > 0
                      ? String(operationalOrders.filter(o => o.status === 'pending').length)
                      : null,
                    badgeColor: 'bg-amber-500 text-slate-950 font-bold'
                  },
                  {
                    id: 'quotes',
                    label: 'Quotes & Surveys',
                    icon: <FileText className="w-4 h-4" />,
                    perm: PERMISSIONS.QUOTES_MANAGE,
                    badge: operationalQuotes.filter(q => q.status === 'pending').length > 0
                      ? String(operationalQuotes.filter(q => q.status === 'pending').length)
                      : null,
                    badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  },
                  {
                    id: 'customers',
                    label: 'Customers & CRM',
                    icon: <Users className="w-4 h-4" />,
                    perm: PERMISSIONS.CUSTOMERS_READ
                  }
                ]
              },
              {
                id: 'commerce',
                label: 'Commerce & Catalog',
                icon: Package,
                items: [
                  { id: 'products', label: 'Products & Catalog', icon: <Package className="w-4 h-4" />, perm: PERMISSIONS.CATALOG_READ },
                  { id: 'categories', label: 'Categories', icon: <FolderTree className="w-4 h-4" />, perm: PERMISSIONS.CATALOG_READ },
                  { id: 'templates', label: 'Spec Templates', icon: <Sliders className="w-4 h-4" />, perm: PERMISSIONS.CATALOG_READ },
                  { id: 'packages', label: 'CCTV Packages & Rules', icon: <Layers className="w-4 h-4" />, perm: PERMISSIONS.CATALOG_READ },
                  { id: 'coupons', label: 'Coupons & Promos', icon: <Percent className="w-4 h-4 text-emerald-400" />, perm: PERMISSIONS.ORDERS_READ }
                ]
              },
              {
                id: 'storefront',
                label: 'Storefront Experience',
                icon: Globe,
                items: [
                  { id: 'heroslides', label: 'Hero Slides (Slider)', icon: <Sparkles className="w-4 h-4 text-[#F15A24]" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'sections', label: 'Homepage Sections', icon: <Layers className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'scenarios', label: 'Scenarios & Topologies', icon: <Compass className="w-4 h-4 text-emerald-400" />, perm: PERMISSIONS.CATALOG_READ },
                  { id: 'services', label: 'Technician Services', icon: <Wrench className="w-4 h-4 text-[#F15A24]" />, perm: PERMISSIONS.SERVICES_MANAGE },
                  { id: 'projects', label: 'Projects & Portfolio', icon: <Briefcase className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'testimonials', label: 'Customer Testimonials', icon: <Star className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE }
                ]
              },
              {
                id: 'content',
                label: 'Content & Knowledge CMS',
                icon: BookOpen,
                items: [
                  { id: 'pages', label: 'Pages & Policy CMS', icon: <Globe className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'company', label: 'Company Profile', icon: <Building2 className="w-4 h-4 text-[#F15A24]" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'blog', label: 'Blog & Articles', icon: <BookOpen className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'faqs', label: 'FAQ Knowledgebase', icon: <HelpCircle className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'glossary', label: 'Technical Glossary', icon: <HelpCircle className="w-4 h-4 text-amber-400" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE }
                ]
              },
              {
                id: 'media',
                label: 'Media & Digital Assets',
                icon: ImageIcon,
                items: [
                  { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" />, perm: PERMISSIONS.MEDIA_WRITE },
                  { id: 'documents', label: 'Technical Documents', icon: <FileCheck className="w-4 h-4 text-sky-400" />, perm: PERMISSIONS.WEBSITE_CONTENT_WRITE },
                  { id: 'brands', label: 'Brands & Badges', icon: <Tag className="w-4 h-4" />, perm: PERMISSIONS.CATALOG_READ }
                ]
              },
              {
                id: 'system',
                label: 'System & Security',
                icon: Shield,
                items: [
                  {
                    id: 'integrations',
                    label: 'API & Auth Control Center',
                    icon: <Shield className="w-4 h-4 text-[#F15A24]" />,
                    perm: PERMISSIONS.WEBSITE_SETTINGS_WRITE,
                    badge: 'Ready',
                    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  },
                  { id: 'systemlogs', label: 'System Logs & Health', icon: <Activity className="w-4 h-4 text-emerald-400" />, perm: PERMISSIONS.AUDIT_READ },
                  { id: 'redirects', label: 'URL Redirects (301)', icon: <Compass className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_REDIRECTS_WRITE },
                  { id: 'settings', label: 'Site Settings & SEO', icon: <Settings className="w-4 h-4" />, perm: PERMISSIONS.WEBSITE_SETTINGS_WRITE }
                ]
              }
            ]
              .map((hub) => {
                // Filter items by permission and search query
                const allowedItems = hub.items.filter((item) => {
                  if (item.perm && !hasPerm(item.perm)) return false;
                  if (!sidebarSearch) return true;
                  const query = sidebarSearch.toLowerCase();
                  return item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query) || hub.label.toLowerCase().includes(query);
                });
                return { ...hub, items: allowedItems };
              })
              .filter((hub) => hub.items.length > 0)
              .map((hub) => {
                const HubIcon = hub.icon;
                const isExpanded = Boolean(sidebarSearch) || expandedHubId === hub.id;
                const isCollapsed = !isExpanded;

                return (
                  <div key={hub.id} className="space-y-1 pb-2 border-b border-slate-800/60 last:border-b-0 last:pb-0">
                    {/* Collapsible Hub Header */}
                    <button
                      type="button"
                      onClick={() => toggleHub(hub.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors group rounded-lg hover:bg-slate-900/60"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <HubIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#F15A24] transition-colors flex-shrink-0" />
                        <span className="truncate">{hub.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hub.badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${hub.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                            {hub.badge}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-300 ease-out ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Hub Items with Soft Accordion Slide & Fade Animation */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="overflow-hidden space-y-0.5 pl-1.5 pt-0.5">
                        {hub.items.map((item) => {
                          const isActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              data-module={item.id}
                              onClick={() => handleSelectModule(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                isActive
                                  ? 'bg-[#F15A24] text-white font-bold shadow-md shadow-[#F15A24]/20'
                                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {item.icon}
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : (item.badgeColor || 'bg-slate-800 text-slate-300')
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div></div>
                );
              })}

            {/* Staff Operations Link */}
            {hasStaffAccess && (
              <div className="pt-3 border-t border-slate-800/80 mt-2 px-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1 px-1">Staff Operations</span>
                <a
                  href="/staff"
                  className="w-full text-left text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-2 py-2 transition-colors px-2.5 rounded-xl hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20"
                >
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Staff App</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </a>
              </div>
            )}
          </div>

          {/* Bottom Status Pill */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="truncate font-semibold text-slate-400">CamneX Operations Hub</span>
            </div>
            <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
              Ctrl+K
            </span>
          </div>
        </aside>

        {/* Module Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-900">
          <ErrorBoundary key={activeModule} sectionName={`Admin Module: ${activeModule}`}>
          {/* 1. DASHBOARD OVERVIEW */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl lg:text-2xl font-black font-heading text-white tracking-tight">Business Platform Overview</h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium shadow-inner">
                      <Calendar className="w-3.5 h-3.5 text-[#F15A24]" />
                      <span>{currentDateFormatted}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Phase 1 E-Commerce Operations & Queue Summary</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={hideTestData}
                      onChange={(e) => setHideTestData(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-[#F15A24] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    <span>Hide Test Records</span>
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshDashboard}
                    disabled={isRefreshingDashboard}
                    className="border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-900 text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    title="Reload dashboard data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#F15A24] ${isRefreshingDashboard ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingDashboard ? 'Refreshing...' : 'Refresh'}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAssistantModalOpen(true)}
                    className="bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Product Research Assistant</span>
                  </Button>
                </div>
              </div>

              {/* Metric KPI Cards (4-Card Operational Summary) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Catalog Products */}
                <div
                  onClick={() => setActiveModule('products')}
                  className="group p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-[#F15A24]/60 hover:bg-slate-900/60 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Catalog Products</span>
                      <div className="text-3xl font-black text-white font-heading tracking-tight">{displayedProductTotal}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F15A24] group-hover:scale-110 transition-transform">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      <span className="text-emerald-400 font-semibold">{activeProducts.length} active</span> · <span className="text-slate-500">{draftProducts.length} draft</span>
                    </span>
                    <span className="text-[11px] text-[#F15A24] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Manage <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* 2. Total Orders */}
                <div
                  onClick={() => setActiveModule('orders')}
                  className="group p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/60 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Orders</span>
                      <div className="text-3xl font-black text-[#F15A24] font-heading tracking-tight">{orders.length}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      <span className={pendingOrders.length > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                        {pendingOrders.length} pending
                      </span> · <span className="text-blue-400 font-semibold">{processingOrders.length} in progress</span>
                    </span>
                    <span className="text-[11px] text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Orders <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* 3. Quote Inquiries */}
                <div
                  onClick={() => setActiveModule('quotes')}
                  className="group p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/60 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Quote Inquiries</span>
                      <div className="text-3xl font-black text-emerald-400 font-heading tracking-tight">{quotes.length}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      <span className={pendingQuotes.length > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                        {pendingQuotes.length} awaiting review
                      </span> · <span className="text-slate-500">{quotedQuotes.length} quoted</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Quotes <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* 4. Categories Configured */}
                <div
                  onClick={() => setActiveModule('categories')}
                  className="group p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/60 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Categories Configured</span>
                      <div className="text-3xl font-black text-purple-400 font-heading tracking-tight">{categories.length}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <FolderTree className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      <span className="text-purple-300 font-semibold">{activeCategories.length} active</span> · <span className="text-slate-500">{totalSubcategories} subcategories</span>
                    </span>
                    <span className="text-[11px] text-purple-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Manage <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Attention Needed Bar */}
              {(ordersWaitingTooLong.length > 0 || unverifiedPayments.length > 0 || pendingQuotes.length > 0 || missingImages.length > 0) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <span>Operational Attention Required</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                          {ordersWaitingTooLong.length + unverifiedPayments.length + pendingQuotes.length + missingImages.length} items
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                        {ordersWaitingTooLong.length > 0 && (
                          <span className="text-rose-400 font-medium">
                            • {ordersWaitingTooLong.length} {ordersWaitingTooLong.length === 1 ? 'order' : 'orders'} waiting &gt; 24h
                          </span>
                        )}
                        {unverifiedPayments.length > 0 && (
                          <span className="text-amber-400 font-medium">
                            • {unverifiedPayments.length} unverified {unverifiedPayments.length === 1 ? 'payment' : 'payments'}
                          </span>
                        )}
                        {pendingQuotes.length > 0 && (
                          <span className="text-purple-400 font-medium">
                            • {pendingQuotes.length} pending {pendingQuotes.length === 1 ? 'quote' : 'quotes'}
                          </span>
                        )}
                        {missingImages.length > 0 && (
                          <span className="text-blue-400 font-medium">
                            • {missingImages.length} products missing photos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveModule(unverifiedPayments.length > 0 || ordersWaitingTooLong.length > 0 ? 'orders' : 'quotes')}
                      className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    >
                      Resolve Work Queue
                    </Button>
                  </div>
                </div>
              )}

              {/* 4 Main Operational Panels: 2x2 Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* PANEL A: Recent Hardware Orders */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Recent Hardware Orders</h3>
                          <p className="text-[11px] text-slate-400">Latest dispatch transactions & status</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveModule('orders')}
                        className="text-xs text-[#F15A24] hover:text-[#ff7847] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>View All ({orders.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4">
                      {orders.length > 0 ? (
                        <div className="divide-y divide-slate-800/80">
                          {orders.slice(0, 5).map(ord => (
                            <div key={ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/30 px-2 rounded-lg transition-colors">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white font-mono text-xs">{ord.orderNumber}</span>
                                  {ord.paymentStatus === 'unverified' && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      Unverified
                                    </span>
                                  )}
                                  {ord.paymentStatus === 'paid' && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      Paid
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-xs">
                                  <span className="text-slate-200 font-medium">{ord.customerName}</span>
                                  {ord.customerPhone && <span className="text-slate-500 ml-1.5 font-mono text-[11px]">({ord.customerPhone})</span>}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <div className="text-right">
                                  <div className="font-bold text-[#F15A24] text-xs">
                                    ৳{ord.total?.toLocaleString ? ord.total.toLocaleString() : (ord.total ?? 0)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {formatRelativeTime(ord.createdAt)}
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                                  ord.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  ord.status === 'processing' || ord.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                  ord.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                            <ShoppingCart className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-300">No orders placed yet</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            Customer hardware orders placed through the online checkout will appear here in real time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {orders.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Total Volume: <strong className="text-white">৳{totalOrderRevenue.toLocaleString()}</strong></span>
                      <button
                        onClick={() => setActiveModule('orders')}
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                      >
                        <span>Manage Dispatch</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* PANEL B: Action Center / Pending Work Queue */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Action Center & Work Queue</h3>
                          <p className="text-[11px] text-slate-400">Items requiring immediate operator response</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          totalWorkQueueCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {totalWorkQueueCount} {totalWorkQueueCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {totalWorkQueueCount > 0 ? (
                        <>
                          {/* Pending Confirmation Orders */}
                          {pendingOrders.slice(0, 2).map(ord => (
                            <div key={`queue-ord-${ord.id}`} className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/20 flex items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                                  <ShoppingCart className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                                    <span>Confirm Order #{ord.orderNumber}</span>
                                    <span className="text-[10px] font-mono text-[#F15A24]">৳{(ord.total || 0).toLocaleString()}</span>
                                    {ord.paymentStatus === 'unverified' && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        Payment Unverified
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {ord.customerName} ({ord.customerPhone}) · {formatRelativeTime(ord.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" onClick={() => setActiveModule('orders')} className="text-xs bg-[#F15A24] hover:bg-[#D94D1C] text-white py-1 px-3">
                                Process
                              </Button>
                            </div>
                          ))}

                          {/* Unverified Payments */}
                          {unverifiedPayments.slice(0, 2).map(ord => (
                            <div key={`queue-pay-${ord.id}`} className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/20 flex items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                                  <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-2">
                                    <span>Verify Payment #{ord.orderNumber}</span>
                                    <span className="text-[10px] text-blue-400 uppercase font-mono">{ord.paymentMethod}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {ord.customerName} · {ord.paymentDetails?.transactionId ? `Trx: ${ord.paymentDetails.transactionId}` : 'Awaiting Audit'}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => setActiveModule('orders')} className="text-xs border-slate-700 text-slate-200 py-1 px-3">
                                Audit
                              </Button>
                            </div>
                          ))}

                          {/* Pending Quotes */}
                          {pendingQuotes.slice(0, 2).map(q => (
                            <div key={`queue-qt-${q.id}`} className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/20 flex items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-2">
                                    <span>Review Quote: {q.customerName}</span>
                                    <span className="text-[10px] text-purple-400 capitalize">{q.propertyType || 'Premise'}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {q.phone} · {formatRelativeTime(q.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" onClick={() => setActiveModule('quotes')} className="text-xs bg-purple-600 hover:bg-purple-700 text-white py-1 px-3">
                                Review
                              </Button>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-200">All Queues Clear</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            No pending hardware orders, unverified payments, or quote inquiries awaiting staff action.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Pending Orders: <strong className="text-white">{pendingOrders.length}</strong> · Unverified Payments: <strong className="text-white">{unverifiedPayments.length}</strong> · Pending Quotes: <strong className="text-white">{pendingQuotes.length}</strong></span>
                    <button
                      onClick={() => setActiveModule(pendingOrders.length > 0 ? 'orders' : (unverifiedPayments.length > 0 ? 'orders' : 'quotes'))}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                    >
                      <span>Open Queues</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* PANEL C: Catalog Health & Readiness */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Catalog Health & Readiness</h3>
                          <p className="text-[11px] text-slate-400">Product data completeness & publication status</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveModule('products')}
                        className="text-xs text-[#F15A24] hover:text-[#ff7847] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Manage Catalog</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Overall Health Score Bar */}
                    <div className="mt-4 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Catalog Readiness Score</span>
                        <span className="font-extrabold text-[#F15A24] font-mono text-sm">{catalogReadinessScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-[#F15A24] h-full rounded-full transition-all duration-500"
                          style={{ width: `${catalogReadinessScore}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{fullyReadyProducts.length} of {displayedProductTotal} products fully production-ready</span>
                        <span>Target: 100%</span>
                      </div>
                    </div>

                    {/* 4 Health Metrics Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 text-xs">
                      {/* 1. Publication Status */}
                      <div
                        onClick={() => setActiveModule('products')}
                        className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Status</span>
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="font-bold text-white text-sm">{activeProducts.length} Active</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {draftProducts.length > 0 ? `${draftProducts.length} in draft mode` : 'All items published'}
                        </div>
                      </div>

                      {/* 2. Photography */}
                      <div
                        onClick={() => setActiveModule('products')}
                        className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Photography</span>
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className={`font-bold text-sm ${missingImages.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {missingImages.length === 0 ? 'All Photos Present' : `${missingImages.length} Need Photos`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {productsWithImage.length} products have studio images
                        </div>
                      </div>

                      {/* 3. SKU & Model */}
                      <div
                        onClick={() => setActiveModule('products')}
                        className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Model & SKU</span>
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className={`font-bold text-sm ${missingModelOrSku.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {missingModelOrSku.length === 0 ? 'Fully Identified' : `${missingModelOrSku.length} Missing SKU`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {products.length - missingModelOrSku.length} products tagged correctly
                        </div>
                      </div>

                      {/* 4. Specifications */}
                      <div
                        onClick={() => setActiveModule('products')}
                        className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Specifications</span>
                          <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className={`font-bold text-sm ${missingSpecs.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {missingSpecs.length === 0 ? 'Specs Complete' : `${missingSpecs.length} Incomplete`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {products.length - missingSpecs.length} with tech spec tables
                        </div>
                      </div>
                    </div>

                    {/* Priority Catalog Fixes */}
                    <div className="mt-3.5 pt-3.5 border-t border-slate-900 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Priority Catalog Fixes</span>
                        <span className="text-[10px] text-slate-500">Quick actions to reach 100% readiness</span>
                      </div>
                      {catalogPriorityFixes.length > 0 ? (
                        <div className="space-y-1.5">
                          {catalogPriorityFixes.map(p => {
                            const needsImg = isPlaceholderImage(p.primaryImage);
                            const needsSku = !p.sku?.trim() || !p.modelNumber?.trim();
                            const needsSpec = !p.specifications || Object.keys(p.specifications).length === 0;
                            return (
                              <div
                                key={`fix-${p.id}`}
                                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-white text-xs truncate">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-slate-500">{p.sku || 'No SKU'}</span>
                                    {needsImg && <span className="text-amber-400 font-medium">No Image</span>}
                                    {needsSku && <span className="text-purple-400 font-medium">Missing SKU/Model</span>}
                                    {needsSpec && <span className="text-blue-400 font-medium">No Specs</span>}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenProductEdit(p)}
                                  className="text-xs text-[#F15A24] hover:text-[#ff7847] py-1 px-2 shrink-0 font-medium"
                                >
                                  Fix
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400 text-center">
                          All active products satisfy image, model, SKU, and specification benchmarks.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Incomplete Products: <strong className={displayedProductTotal - fullyReadyProducts.length > 0 ? "text-amber-400" : "text-white"}>{Math.max(0, displayedProductTotal - fullyReadyProducts.length)}</strong></span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenProductCreate}
                        className="text-xs border-slate-800 hover:border-[#F15A24] text-slate-300 py-1 px-2.5"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Product
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PANEL D: System & Store Activity Feed */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">System & Store Activity</h3>
                          <p className="text-[11px] text-slate-400">Audit logs and transaction activity stream</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${feedProvenanceBadge.color} animate-pulse`} />
                        <span className="font-semibold text-slate-300">{feedProvenanceBadge.label}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      {combinedRecentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {combinedRecentActivity.slice(0, 5).map(act => (
                            <div key={act.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 hover:bg-slate-900/60 transition-colors">
                              <div className="flex items-start gap-2.5">
                                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 mt-0.5">
                                  {act.entity === 'auth' ? <Shield className="w-3.5 h-3.5 text-blue-400" /> :
                                   act.entity === 'order' ? <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> :
                                   act.entity === 'quote' ? <FileText className="w-3.5 h-3.5 text-purple-400" /> :
                                   act.entity === 'service' ? <Wrench className="w-3.5 h-3.5 text-[#F15A24]" /> :
                                   act.entity === 'product' ? <Package className="w-3.5 h-3.5 text-amber-400" /> :
                                   <Activity className="w-3.5 h-3.5 text-slate-400" />}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                    <span>{act.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                                      act.type === 'audit'
                                        ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                    }`}>
                                      {act.provenance}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase font-mono">
                                      {act.action}
                                    </span>
                                  </div>
                                  {act.subtitle && (
                                    <div className="text-[11px] text-slate-400">{act.subtitle}</div>
                                  )}
                                  <div className="text-[10px] text-slate-500">
                                    By <span className="text-slate-400 font-medium">{act.actor}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                {formatRelativeTime(act.timestamp)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                            <Clock className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-300">No activity recorded</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            Administrative changes and store interactions will be logged in this operational stream.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Recent events: <strong className="text-white">{combinedRecentActivity.length}</strong></span>
                    {hasStaffAccess && (
                      <a
                        href="/staff"
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                      >
                        <span>View Full Audit Trail</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

              </div>

              {/* Operational Quick Shortcuts Bar */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#F15A24]" />
                  <span>Operational Command Shortcuts</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <button
                    onClick={handleOpenProductCreate}
                    className="p-3 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group"
                  >
                    <Plus className="w-4 h-4 text-[#F15A24] mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Add Product</div>
                    <div className="text-[10px] text-slate-500">New SKU / Catalog</div>
                  </button>

                  <button
                    onClick={handleOpenNewPackage}
                    className="p-3 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group"
                  >
                    <Layers className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">New Package</div>
                    <div className="text-[10px] text-slate-500">CCTV Turnkey Bundle</div>
                  </button>

                  <button
                    onClick={() => setActiveModule('heroslides')}
                    className="p-3 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Hero Slides</div>
                    <div className="text-[10px] text-slate-500">Homepage Slider</div>
                  </button>

                  <button
                    onClick={() => setActiveModule('services')}
                    className="p-3 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group"
                  >
                    <Wrench className="w-4 h-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Services</div>
                    <div className="text-[10px] text-slate-500">Installation & AMC</div>
                  </button>

                  <button
                    onClick={() => setActiveModule('company')}
                    className="p-3 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group"
                  >
                    <Building2 className="w-4 h-4 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Company Profile</div>
                    <div className="text-[10px] text-slate-500">Contact & Address</div>
                  </button>

                  <button
                    onClick={() => setActiveModule('settings')}
                    className="p-3 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all group"
                  >
                    <Settings className="w-4 h-4 text-slate-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white">Site Settings</div>
                    <div className="text-[10px] text-slate-500">SEO & Identity</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRODUCTS & CREATION ASSISTANT */}
          {activeModule === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Catalog Products</h2>
                  <p className="text-xs text-slate-400">Total {displayedProductTotal} products published or in draft</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkToolsModalOpen(true)}
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-1.5 text-orange-400" />
                    <span>Bulk Tools {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}</span>
                  </Button>
                  <Button size="sm" onClick={handleOpenProductCreate} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>+ Add Product</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAssistantModalOpen(true)}
                    className="border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white hover:bg-slate-800 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5 text-[#F15A24]" />
                    <span>Research Assistant</span>
                  </Button>
                </div>
              </div>

              {/* Multi-Facet Filter Toolbar */}
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={e => {
                        setProductSearchQuery(e.target.value);
                        setProductPage(1);
                      }}
                      placeholder="Search catalog by product name, SKU, model number, or brand..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs pl-9 pr-8 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
                    />
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchQuery('');
                          setProductPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
                    <select
                      value={productCategoryFilter}
                      onChange={e => {
                        setProductCategoryFilter(e.target.value);
                        setProductPage(1);
                      }}
                      className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-[#F15A24]"
                    >
                      <option value="">All Categories ({categories.length})</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <select
                      value={productBrandFilter}
                      onChange={e => {
                        setProductBrandFilter(e.target.value);
                        setProductPage(1);
                      }}
                      className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-[#F15A24]"
                    >
                      <option value="">All Brands ({brands.length})</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>

                    <select
                      value={productStatusFilter}
                      onChange={e => {
                        setProductStatusFilter(e.target.value);
                        setProductPage(1);
                      }}
                      className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-[#F15A24]"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active (Published)</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>

                    <select
                      value={productStockFilter}
                      onChange={e => {
                        setProductStockFilter(e.target.value);
                        setProductPage(1);
                      }}
                      className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-[#F15A24]"
                    >
                      <option value="">All Stock</option>
                      <option value="in_stock">In Stock (&gt;5)</option>
                      <option value="low_stock">Low Stock (1–5)</option>
                      <option value="out_of_stock">Out of Stock (0)</option>
                    </select>
                  </div>

                  {(productSearchQuery || productCategoryFilter || productBrandFilter || productStatusFilter || productStockFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearchQuery('');
                        setProductCategoryFilter('');
                        setProductBrandFilter('');
                        setProductStatusFilter('');
                        setProductStockFilter('');
                        setProductPage(1);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-500/10 flex items-center gap-1 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Complete Products Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/70 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id))}
                            onChange={e => {
                              if (e.target.checked) {
                                const newIds = Array.from(new Set([...selectedProductIds, ...paginatedProducts.map(p => p.id)]));
                                setSelectedProductIds(newIds);
                              } else {
                                const pageIds = new Set(paginatedProducts.map(p => p.id));
                                setSelectedProductIds(selectedProductIds.filter(id => !pageIds.has(id)));
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer"
                          />
                        </th>
                        <th className="p-3.5">Product</th>
                        <th className="p-3.5">Model / SKU</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Pricing</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5">Status & Updated</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-500">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                            <p className="text-sm font-semibold text-slate-400">No matching products found</p>
                            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map(p => {
                          const isSelected = selectedProductIds.includes(p.id);
                          const stockQty = p.inventory?.available ?? 0;
                          const hasSale = p.pricing?.salePrice && p.pricing.salePrice > 0;
                          return (
                            <tr key={p.id} className={`hover:bg-slate-900/40 transition-colors ${isSelected ? 'bg-orange-950/20' : ''}`}>
                              <td className="p-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedProductIds([...selectedProductIds, p.id]);
                                    } else {
                                      setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-900 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer"
                                />
                              </td>
                              {/* 1. Product Name, Thumbnail, Brand & Badges */}
                              <td className="p-3.5 text-white max-w-[280px]">
                                <div className="flex items-start gap-2.5">
                                  <img
                                    src={p.primaryImage || '/images/hero/hikvision-bullet.png'}
                                    alt=""
                                    className="w-9 h-9 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-white leading-tight line-clamp-1">{p.name}</div>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                      {p.brand && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                          {p.brand}
                                        </span>
                                      )}
                                      {isPlaceholderImage(p.primaryImage) && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          Placeholder
                                        </span>
                                      )}
                                      {(!p.specs || Object.keys(p.specs).length === 0) &&
                                       (!p.specifications || Object.keys(p.specifications).length === 0) &&
                                       (!p.keyFeatures || p.keyFeatures.length === 0) && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                          No specs
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Model, SKU & Barcode */}
                              <td className="p-3.5">
                                <div className="font-mono text-white text-xs font-semibold">{p.modelNumber}</div>
                                <div className="font-mono text-slate-400 text-[11px] mt-0.5">SKU: {p.sku || '—'}</div>
                                {p.barcode && (
                                  <div className="font-mono text-slate-500 text-[10px]">UPC: {p.barcode}</div>
                                )}
                              </td>

                              {/* 3. Category & Subcategory */}
                              <td className="p-3.5">
                                <div className="text-slate-300 font-medium">{p.category || '—'}</div>
                                {(p.subcategory || p.subcategoryId) && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                                    {p.subcategory || p.subcategoryId}
                                  </span>
                                )}
                              </td>

                              {/* 4. Pricing (Regular Price & Highlighted Sale Price) */}
                              <td className="p-3.5">
                                {hasSale ? (
                                  <div>
                                    <div className="font-bold text-emerald-400 text-xs">
                                      ৳{p.pricing?.salePrice?.toLocaleString()}
                                    </div>
                                    {p.pricing?.regularPrice && (
                                      <div className="text-[11px] text-slate-500 line-through">
                                        ৳{p.pricing.regularPrice.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                ) : p.pricing?.regularPrice ? (
                                  <div className="font-bold text-[#F15A24] text-xs">
                                    ৳{p.pricing.regularPrice.toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">Quote Request</div>
                                )}
                              </td>

                              {/* 5. Stock / Availability Badge */}
                              <td className="p-3.5">
                                {stockQty <= 0 || p.inventory?.status === 'out_of_stock' ? (
                                  <Badge variant="danger">Out of stock (0)</Badge>
                                ) : stockQty <= 5 || p.inventory?.status === 'low_stock' ? (
                                  <Badge variant="warning">Low stock ({stockQty})</Badge>
                                ) : (
                                  <Badge variant="success">In stock ({stockQty})</Badge>
                                )}
                              </td>

                              {/* 6. Publication Status & Timestamp */}
                              <td className="p-3.5">
                                <Badge variant={p.status === 'active' ? 'success' : p.status === 'draft' ? 'warning' : 'gray'}>
                                  {p.status || 'active'}
                                </Badge>
                                {p.websiteVisible === false && (
                                  <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">Hidden on Web</div>
                                )}
                                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                  {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—')}
                                </div>
                              </td>

                              {/* 7. Action Controls */}
                              <td className="p-3.5 text-right space-x-2">
                                <button
                                  onClick={() => onNavigate('product', p.id)}
                                  className="text-xs text-slate-400 hover:text-white transition-colors"
                                  title="View on Storefront"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleOpenProductEdit(p)}
                                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                                  title="Edit Product Details"
                                >
                                  Edit
                                </button>
                                {p.status === 'archived' || (p as any).is_archived ? (
                                  <button
                                    onClick={() => handleRestoreProduct(p.id, p.name)}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                                    title="Restore Archived Product"
                                  >
                                    Restore
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleArchiveProduct(p.id, p.name)}
                                    className="text-xs text-slate-400 hover:text-amber-300 transition-colors"
                                    title="Safely Archive Product"
                                  >
                                    Archive
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                                  title="Delete Product (Safeguarded)"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-slate-900/60 px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing {totalFilteredProducts === 0 ? 0 : (validProductPage - 1) * productPageSize + 1}–{Math.min(validProductPage * productPageSize, totalFilteredProducts)} of {totalFilteredProducts} products
                      {totalFilteredProducts !== displayedProductTotal && (
                        <span className="text-slate-500 ml-1">({displayedProductTotal} total in database)</span>
                      )}
                    </span>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Per page:</span>
                      <select
                        value={productPageSize}
                        onChange={e => {
                          setProductPageSize(Number(e.target.value));
                          setProductPage(1);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                      disabled={validProductPage <= 1}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-white font-semibold">
                      {validProductPage} / {totalProductPages}
                    </span>
                    <button
                      onClick={() => setProductPage(prev => Math.min(totalProductPages, prev + 1))}
                      disabled={validProductPage >= totalProductPages}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CATEGORIES MANAGEMENT MODULE */}
          {activeModule === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-[#F15A24]" />
                    <span>Category & Taxonomy Hierarchy</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage hardware categories, slug paths, and linked specification templates for faceted filters.
                  </p>
                </div>
                <Button size="sm" onClick={handleOpenNewCategory}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>+ Add Category</span>
                </Button>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Category Name</th>
                      <th className="p-3.5">Slug</th>
                      <th className="p-3.5">Linked Spec Template</th>
                      <th className="p-3.5 text-center">Homepage</th>
                      <th className="p-3.5">Order</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {categories.map((c, cIdx) => {
                      const tpl = templates.find(t => t.id === c.specTemplateId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-white">
                            <div className="flex items-center gap-2 flex-wrap">
                              {c.image && (
                                <img src={c.image} alt={c.name} className="w-6 h-6 object-contain rounded bg-slate-800 p-0.5" />
                              )}
                              <span>{c.name}</span>
                              {c.subcategories && c.subcategories.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                  {c.subcategories.length} subcats
                                </span>
                              )}
                              {isPlaceholderImage(c.image) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Placeholder image
                                </span>
                              )}
                              {c.isAccessoryCategory && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Accessory
                                </span>
                              )}
                            </div>
                            {c.description && <div className="text-[11px] text-slate-500 font-normal line-clamp-1">{c.description}</div>}
                          </td>
                          <td className="p-3.5 font-mono text-slate-400">{c.slug}</td>
                          <td className="p-3.5">
                            {tpl ? (
                              <span className="text-orange-400 font-semibold">{tpl.name} ({tpl.fields.length} specs)</span>
                            ) : (
                              <span className="text-slate-500">None assigned</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {c.showOnHomepage !== false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                                No
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>#{c.displayOrder || c.order || 1}</span>
                              <div className="flex flex-col text-[9px] text-slate-500 leading-none">
                                <button
                                  type="button"
                                  disabled={cIdx === 0}
                                  onClick={() => handleReorderCategory(c.id, 'up')}
                                  className="hover:text-white disabled:opacity-20 cursor-pointer"
                                  title="Move Up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={cIdx === categories.length - 1}
                                  onClick={() => handleReorderCategory(c.id, 'down')}
                                  className="hover:text-white disabled:opacity-20 cursor-pointer"
                                  title="Move Down"
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <Badge variant={c.status === 'active' ? 'success' : 'gray'}>{c.status || 'active'}</Badge>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategory({ ...c });
                                setCategoryModalOpen(true);
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              <span>Edit</span>
                            </Button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. SPEC TEMPLATES */}
          {activeModule === 'templates' && (
            <SpecTemplatesModule
              templates={templates}
              categories={categories}
              onTemplatesUpdated={() => {
                specTemplateService.getTemplates().then(setTemplates);
              }}
            />
          )}

          {/* 5. CCTV PACKAGES MODULE */}
          {activeModule === 'packages' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#F15A24]" />
                    <span>CCTV Turnkey Packages & Estimator Rules</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure camera bundles (2, 4, 8, 16 cameras), storage rules, accessories, and pricing formula.
                  </p>
                </div>
                <Button size="sm" onClick={handleOpenNewPackage}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>+ Create CCTV Package</span>
                </Button>
              </div>

              {/* System Types Toolbar Editor */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    System Types (Short labels & Descriptions for homepage toolbar)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {packageSystemTypes.map((st) => (
                    <div key={st.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{st.name}</span>
                        <Badge variant={st.enabled !== false ? 'success' : 'gray'}>
                          {st.enabled !== false ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Short label (Toolbar tab)</label>
                        <input
                          type="text"
                          value={st.shortLabel || ''}
                          onChange={async (e) => {
                            const updated = { ...st, shortLabel: e.target.value };
                            await packageService.savePackageSystemType(updated);
                            packageService.getPackageSystemTypes().then(setPackageSystemTypes);
                          }}
                          placeholder={st.slug === 'ip' ? 'IP' : st.slug === 'analogue' ? 'Analogue' : 'Wi-Fi'}
                          className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-1.5 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Plain-language Description</label>
                        <textarea
                          rows={2}
                          value={st.description || ''}
                          onChange={async (e) => {
                            const updated = { ...st, description: e.target.value };
                            await packageService.savePackageSystemType(updated);
                            packageService.getPackageSystemTypes().then(setPackageSystemTypes);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-white text-[11px] p-1.5 rounded resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {packages.map(p => (
                  <div key={p.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="orange">{p.cameraResolution || '2MP Full HD'}</Badge>
                          {isPlaceholderImage(p.image) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Placeholder image
                            </span>
                          )}
                        </div>
                        <Badge variant={p.isActive ? 'success' : 'gray'}>{p.isActive ? 'Active' : 'Disabled'}</Badge>
                      </div>
                      <h3 className="font-bold text-base text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                      
                      <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Camera Model:</span>
                          <span className="font-mono text-slate-200">{p.cameraModel || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">DVR Unit:</span>
                          <span className="font-mono text-slate-200">{p.dvrModel || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base Price:</span>
                          <span className="font-bold text-[#F15A24]">
                            {p.isQuoteOnly ? 'Quotation Required' : (p.basePrice != null ? `৳${p.basePrice.toLocaleString()}` : 'Quote')}
                          </span>
                        </div>
                      </div>

                      {/* Inclusions and BOM counts */}
                      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Includes: <strong className="text-slate-200">{p.inclusions?.length || 0} hardware items</strong></span>
                        <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-900/50">
                          {p.components?.length || 0} BOM items
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={async () => {
                          const updated = { ...p, isActive: !p.isActive };
                          await packageService.savePackage(updated);
                          packageService.getPackages().then(setPackages);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                          p.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {p.isActive ? 'Enabled' : 'Disabled'}
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPackage({ ...p });
                            setPackageModalOpen(true);
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. OPERATIONS HUB: ORDERS & TIMELINE MODULE */}
          {activeModule === 'orders' && (() => {
            // Filter operational orders by tab and search
            const filteredOrders = operationalOrders.filter((o) => {
              // Status tab filter
              if (orderStatusTab === 'action_needed') {
                const needsAction = o.paymentStatus === 'unverified' || o.status === 'pending';
                if (!needsAction) return false;
              } else if (orderStatusTab !== 'all') {
                if (o.status !== orderStatusTab) return false;
              }

              // Payment method filter
              if (orderPaymentFilter !== 'all') {
                if (o.paymentMethod !== orderPaymentFilter) return false;
              }

              // Search query filter
              if (orderSearchQuery.trim()) {
                const q = orderSearchQuery.toLowerCase().trim();
                const num = (o.orderNumber || '').toLowerCase();
                const name = (o.customerName || '').toLowerCase();
                const phone = (o.customerPhone || '').toLowerCase();
                const trx = (o.paymentDetails?.transactionId || '').toLowerCase();
                const address = (o.deliveryAddress || '').toLowerCase();
                const courierTrack = (o.trackingNumber || '').toLowerCase();
                if (!num.includes(q) && !name.includes(q) && !phone.includes(q) && !trx.includes(q) && !address.includes(q) && !courierTrack.includes(q)) {
                  return false;
                }
              }

              return true;
            });

            // Summary metrics
            const unverifiedCount = operationalOrders.filter(o => o.paymentStatus === 'unverified').length;
            const pendingCount = operationalOrders.filter(o => o.status === 'pending').length;
            const dispatchedCount = operationalOrders.filter(o => o.status === 'dispatched').length;
            const deliveredCount = operationalOrders.filter(o => o.status === 'delivered').length;
            const totalPaidRevenue = operationalOrders
              .filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled')
              .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

            return (
              <div className="space-y-6">
                {/* Header & Export */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[#F15A24]" />
                      <span>Customer Orders & Logistics Fulfillment</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Live dispatch operations, courier consignment integration, and transaction audit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => refreshAllData()}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Refresh Orders"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open('/api/admin/orders/export?format=csv', '_blank')}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#F15A24]" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</div>
                    <div className="text-2xl font-black text-white mt-1">{operationalOrders.length}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{operationalOrders.length} total orders recorded</div>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Action Needed</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{unverifiedCount + pendingCount}</div>
                    <div className="text-[11px] text-amber-500/80 mt-0.5">{unverifiedCount} unverified • {pendingCount} pending</div>
                  </div>

                  <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>In Transit / Dispatched</span>
                    </div>
                    <div className="text-2xl font-black text-sky-300 mt-1">{dispatchedCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{deliveredCount} delivered successfully</div>
                  </div>

                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Paid Revenue</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">৳{totalPaidRevenue.toLocaleString()}</div>
                    <div className="text-[11px] text-emerald-500/80 mt-0.5">Verified & collected funds</div>
                  </div>
                </div>

                {/* Pipeline Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
                  {[
                    { id: 'all', label: 'All Orders', count: operationalOrders.length },
                    { id: 'action_needed', label: 'Action Needed', count: unverifiedCount + pendingCount, alert: (unverifiedCount + pendingCount) > 0 },
                    { id: 'confirmed', label: 'Confirmed', count: operationalOrders.filter(o => o.status === 'confirmed').length },
                    { id: 'processing', label: 'Processing', count: operationalOrders.filter(o => o.status === 'processing').length },
                    { id: 'dispatched', label: 'Dispatched', count: dispatchedCount },
                    { id: 'delivered', label: 'Delivered', count: deliveredCount },
                    { id: 'cancelled', label: 'Cancelled', count: operationalOrders.filter(o => o.status === 'cancelled').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderStatusTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                        orderStatusTab === tab.id
                          ? 'bg-[#F15A24] text-white shadow-md shadow-[#F15A24]/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        orderStatusTab === tab.id
                          ? 'bg-white/20 text-white'
                          : tab.alert
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search & Secondary Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search by order #, customer name, phone, bKash TrxID, or consignment code..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24] transition-colors"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#F15A24]"
                  >
                    <option value="all">All Payment Methods</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="bkash_manual">bKash (Send Money / Merchant)</option>
                    <option value="nagad_manual">Nagad</option>
                    <option value="bank_transfer">Corporate Bank Transfer</option>
                  </select>
                </div>

                {/* Orders Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Order Ref</th>
                          <th className="p-3.5">Customer & Contact</th>
                          <th className="p-3.5">Payment & Audit</th>
                          <th className="p-3.5">Logistics & Courier</th>
                          <th className="p-3.5">Amount (BDT)</th>
                          <th className="p-3.5">Order Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <ShoppingCart className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                                <span className="font-semibold text-slate-400">No orders match the selected filters.</span>
                                {orderSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => { setOrderSearchQuery(''); setOrderStatusTab('all'); }}
                                    className="text-xs text-[#F15A24] hover:underline font-bold mt-1"
                                  >
                                    Reset Filters
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map(o => {
                            const isPaid = o.paymentStatus === 'paid';
                            const isUnverified = o.paymentStatus === 'unverified';
                            const hasCourier = Boolean(o.trackingNumber || o.courierName);
                            const trackingUrl = o.courierTrackingUrl || (o.trackingNumber ? `https://steadfast.com.bd/t/${encodeURIComponent(o.trackingNumber)}` : null);

                            return (
                              <tr key={o.id} className="hover:bg-slate-900/50 transition-colors">
                                {/* Order Number & Date */}
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-white font-mono text-[13px]">{o.orderNumber}</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                                  </div>
                                  {Array.isArray(o.items) && o.items.length > 0 && (
                                    <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                      {o.items.length} item{o.items.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </td>

                                {/* Customer Info */}
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-white text-[13px]">{o.customerName || 'Customer'}</div>
                                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">{o.customerPhone}</div>
                                  {o.customerEmail && (
                                    <div className="text-slate-500 text-[11px] truncate max-w-[180px]">{o.customerEmail}</div>
                                  )}
                                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-1 max-w-[220px]" title={o.deliveryAddress}>
                                    {o.deliveryAddress || 'Dhaka, Bangladesh'}
                                  </div>
                                </td>

                                {/* Payment Status & TrxID Audit */}
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-slate-200 capitalize">
                                    {o.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                     o.paymentMethod === 'bkash_manual' ? 'bKash Send Money' :
                                     o.paymentMethod === 'nagad_manual' ? 'Nagad' :
                                     o.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : (o.paymentMethod || 'Manual')}
                                  </div>

                                  {o.paymentDetails?.transactionId && (
                                    <div className="text-[11px] font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
                                      <span className="text-slate-500">Trx:</span>
                                      <span className="font-bold">{o.paymentDetails.transactionId}</span>
                                    </div>
                                  )}

                                  {o.paymentDetails?.depositRef && (
                                    <div className="text-[11px] font-mono text-emerald-400">
                                      <span className="text-slate-500">Ref:</span> {o.paymentDetails.depositRef}
                                    </div>
                                  )}

                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    {isUnverified ? (
                                      <>
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                          Unverified
                                        </span>
                                        <button
                                          type="button"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await orderService.updatePaymentStatus(o.id, 'paid');
                                            refreshAllData();
                                          }}
                                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-colors"
                                          title="Verify payment receipt"
                                        >
                                          ✓ Verify
                                        </button>
                                      </>
                                    ) : (
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {isPaid ? 'Paid / Verified' : 'Unpaid'}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Logistics, Courier & Tracking */}
                                <td className="p-3.5 align-top">
                                  {hasCourier ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-[#F15A24]" />
                                        <span className="font-bold text-white text-[11px]">{o.courierName || 'Courier'}</span>
                                      </div>
                                      {o.trackingNumber && (
                                        <div className="text-[11px] font-mono text-slate-300">
                                          #{o.trackingNumber}
                                        </div>
                                      )}
                                      {trackingUrl && (
                                        <a
                                          href={trackingUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                          <span>Track Live</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        Not Dispatched
                                      </span>
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedOrderForInvoice(o);
                                            setOrderInvoiceModalOpen(true);
                                          }}
                                          className="text-[10px] font-bold text-[#F15A24] hover:text-[#ff723f] flex items-center gap-1 transition-colors"
                                        >
                                          <Truck className="w-3 h-3" />
                                          <span>Dispatch Parcel</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {o.installation?.requested && (
                                    <div className="mt-1">
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                                        + Installation ({o.installation.preferredDate || 'Standard'})
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Total Amount */}
                                <td className="p-3.5 align-top font-bold text-[#F15A24] text-sm">
                                  ৳{Number(o.total || 0).toLocaleString()}
                                </td>

                                {/* Order Status Badge & Inline Selector */}
                                <td className="p-3.5 align-top">
                                  <select
                                    value={o.status}
                                    onChange={async (e) => {
                                      await orderService.updateOrderStatus(o.id, e.target.value, `Admin updated status to ${e.target.value}`);
                                      refreshAllData();
                                    }}
                                    className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                                      o.status === 'delivered' ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300' :
                                      o.status === 'dispatched' ? 'bg-sky-950/80 border-sky-600/50 text-sky-300' :
                                      o.status === 'confirmed' ? 'bg-blue-950/80 border-blue-600/50 text-blue-300' :
                                      o.status === 'processing' ? 'bg-indigo-950/80 border-indigo-600/50 text-indigo-300' :
                                      o.status === 'cancelled' ? 'bg-red-950/80 border-red-800/50 text-red-400' :
                                      'bg-amber-950/80 border-amber-600/50 text-amber-300'
                                    }`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="dispatched">Dispatched</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 align-top text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOrderForInvoice(o);
                                      setOrderInvoiceModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#F15A24]" />
                                    <span>Inspect & Dispatch</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CUSTOMERS & CRM MODULE */}
          {activeModule === 'customers' && (
            <CustomersModule
              orders={orders}
              onNavigateToOrder={(ordId) => {
                setActiveModule('orders');
              }}
            />
          )}

          {/* 7. QUOTES & SITE SURVEYS MODULE */}
          {activeModule === 'quotes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#F15A24]" />
                    <span>Technical Consultations & Quote Requests</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Client requests for technical consultations, CCTV engineering, access control, and network cabling in Dhaka.
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  Total Inquiries: <span className="text-[#F15A24]">{operationalQuotes.length}</span>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Quote Ref</th>
                      <th className="p-3.5">Customer & Phone</th>
                      <th className="p-3.5">Service & Property</th>
                      <th className="p-3.5">Site Details</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {operationalQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No quotation requests received yet.
                        </td>
                      </tr>
                    ) : (
                      operationalQuotes.map(q => (
                        <tr key={q.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-white font-mono">{q.quoteNumber || q.id}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-white">{q.customerName || 'Customer'}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{q.phone || 'N/A'}</div>
                            {q.email && <div className="text-slate-500 text-[11px]">{q.email}</div>}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[#F15A24] capitalize">{(q.serviceType || 'cctv_installation').replace(/_/g, ' ')}</div>
                            <div className="text-slate-400 capitalize">{q.propertyType || 'standard'} Premises</div>
                          </td>
                          <td className="p-3.5">
                            <div className="line-clamp-1 text-slate-300">{q.siteAddress}</div>
                            <div className="text-[11px] text-slate-400">
                              {q.cameraCount ? `${q.cameraCount} Cams` : ''} {q.doorCount ? `· ${q.doorCount} Doors` : ''}
                            </div>
                            {q.notes && <div className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">"{q.notes}"</div>}
                          </td>
                          <td className="p-3.5">
                            <Badge variant={
                              q.status === 'approved' ? 'success' :
                              q.status === 'quoted' ? 'orange' :
                              q.status === 'contacted' ? 'dark' :
                              q.status === 'rejected' ? 'gray' : 'warning'
                            }>
                              {q.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right flex items-center justify-end gap-2">
                            {q.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/quotes/${encodeURIComponent(q.id)}/convert-to-order`, {
                                      method: 'POST'
                                    });
                                    if (res.ok) {
                                      refreshAllData();
                                      setActiveModule('orders');
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                                title="Convert this quotation request directly into a customer order"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                <span>Convert to Order</span>
                              </Button>
                            )}
                            <select
                              value={q.status}
                              onChange={(e) => handleUpdateQuoteStatus(q.id, e.target.value as any)}
                              className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="quoted">Quoted</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COUPONS & PROMOS MODULE */}
          {activeModule === 'coupons' && (
            <CouponsModule />
          )}

          {/* MEDIA LIBRARY MODULE */}
          {activeModule === 'media' && (
            <MediaLibraryView />
          )}

          {/* TECHNICAL DOCUMENTS MODULE */}
          {activeModule === 'documents' && (
            <DocumentsModule />
          )}

          {/* 8. HOMEPAGE SECTIONS */}
          {activeModule === 'sections' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Homepage Section Controller</h2>
                <p className="text-xs text-slate-400">Toggle sections and configure editable section records (including the Final CTA Section).</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                {sections.map((s, idx) => {
                  const isCta = s.type === 'quote_cta';
                  const ctaData = s.ctaData || INITIAL_CTA_DATA;

                  return (
                    <div key={s.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-white">{s.title}</span>
                          <span className="text-xs text-slate-500 font-mono block">Type: {s.type} · Order: {s.order}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              const updated = [...sections];
                              updated[idx].enabled = !updated[idx].enabled;
                              await cmsService.updateHomepageSections(updated);
                              setSections(updated);
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                              s.enabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {s.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      {/* EDITABLE CTA SECTION CONTROLLER */}
                      {isCta && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-4 text-xs">
                          <div className="text-[#F15A24] font-bold text-xs uppercase tracking-wider">
                            CTA Content & Reassurance Switcher (CMS Record)
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-slate-400 block mb-1">Small Pill Eyebrow</span>
                              <input
                                type="text"
                                value={ctaData.eyebrow}
                                onChange={async (e) => {
                                  const updated = [...sections];
                                  updated[idx].ctaData = { ...ctaData, eyebrow: e.target.value };
                                  await cmsService.updateHomepageSections(updated);
                                  setSections(updated);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                              />
                            </div>

                            <div>
                              <span className="text-slate-400 block mb-1">H2 Heading</span>
                              <input
                                type="text"
                                value={ctaData.heading}
                                onChange={async (e) => {
                                  const updated = [...sections];
                                  updated[idx].ctaData = { ...ctaData, heading: e.target.value };
                                  await cmsService.updateHomepageSections(updated);
                                  setSections(updated);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 block mb-1">Subtext (Description)</span>
                            <textarea
                              rows={2}
                              value={ctaData.subtext}
                              onChange={async (e) => {
                                const updated = [...sections];
                                updated[idx].ctaData = { ...ctaData, subtext: e.target.value };
                                await cmsService.updateHomepageSections(updated);
                                setSections(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                            />
                          </div>

                          {/* Reassurance Row Toggles */}
                          <div>
                            <span className="text-slate-300 font-bold block mb-2">Reassurance Items (Toggle On/Off):</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {ctaData.reassurances.map((item, rIdx) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={async () => {
                                    const updated = [...sections];
                                    const newReassurances = [...ctaData.reassurances];
                                    newReassurances[rIdx] = { ...item, enabled: !item.enabled };
                                    updated[idx].ctaData = { ...ctaData, reassurances: newReassurances };
                                    await cmsService.updateHomepageSections(updated);
                                    setSections(updated);
                                  }}
                                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                                    item.enabled
                                      ? 'bg-[#F15A24]/15 border-[#F15A24] text-white'
                                      : 'bg-slate-950 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  <span>{item.label}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    item.enabled ? 'bg-[#F15A24] text-white' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {item.enabled ? 'ON' : 'OFF'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* WI-FI SERIES SECTION SETTINGS */}
                      {(s.type === 'wifi_series' || s.type === 'wifi_cameras' || s.id === 'sec-wifi') && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                          <div className="text-[#F15A24] font-bold text-xs uppercase tracking-wider">
                            Wi-Fi Series Section Settings
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-slate-400 block mb-1">Row Title</span>
                              <input
                                type="text"
                                value={s.title || 'Wi-Fi Series'}
                                onChange={async (e) => {
                                  const updated = [...sections];
                                  updated[idx].title = e.target.value;
                                  await cmsService.updateHomepageSections(updated);
                                  setSections(updated);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">Eyebrow</span>
                              <input
                                type="text"
                                value={s.eyebrow || 'Wi-Fi products'}
                                onChange={async (e) => {
                                  const updated = [...sections];
                                  updated[idx].eyebrow = e.target.value;
                                  await cmsService.updateHomepageSections(updated);
                                  setSections(updated);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-1">Subtitle</span>
                            <input
                              type="text"
                              value={s.subtitle || 'Cameras, doorbells, lights and more you control from a phone app'}
                              onChange={async (e) => {
                                const updated = [...sections];
                                updated[idx].subtitle = e.target.value;
                                await cmsService.updateHomepageSections(updated);
                                setSections(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                            <div>
                              <span className="text-slate-400 block mb-1">Number of Cards (Item Limit)</span>
                              <input
                                type="number"
                                min={2}
                                max={24}
                                value={s.itemLimit ?? 8}
                                onChange={async (e) => {
                                  const updated = [...sections];
                                  updated[idx].itemLimit = parseInt(e.target.value, 10) || 8;
                                  await cmsService.updateHomepageSections(updated);
                                  setSections(updated);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
                              />
                            </div>
                            <div className="pt-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={s.showChipRow !== false}
                                  onChange={async (e) => {
                                    const updated = [...sections];
                                    updated[idx].showChipRow = e.target.checked;
                                    await cmsService.updateHomepageSections(updated);
                                    setSections(updated);
                                  }}
                                  className="rounded border-slate-700 text-orange-600 focus:ring-orange-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-slate-300">
                                  Show Subcategory Filter Chips Row
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ROW PROMO TILE EDITOR (for product row sections) */}
                      {['popular_products', 'new_arrivals', 'accessories', 'special_offers', 'category_row', 'wifi_cameras', 'wifi_series', 'featured_products'].includes(s.type) && (
                        <div className="pt-3 border-t border-slate-800/80">
                          <PromoTileEditor
                            value={s.promoTile}
                            onChange={async (updated) => {
                              const updatedSections = [...sections];
                              updatedSections[idx].promoTile = updated;
                              await cmsService.updateHomepageSections(updatedSections);
                              setSections(updatedSections);
                            }}
                            categoryName={s.title}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. HERO SLIDER MANAGEMENT MODULE */}
          {activeModule === 'heroslides' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#F15A24]" />
                    <span>Hero Slider Management</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage homepage banner slides. Light & airy style with transparent hardware renders, spec highlights, and auto-sync from catalog.
                  </p>
                </div>
                <Button size="sm" onClick={handleOpenNewSlide}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Add New Hero Slide</span>
                </Button>
              </div>

              {/* Information Alert */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#F15A24] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">Visual Design Guidelines</p>
                  <p className="text-slate-400">
                    The Hero Slider uses a pure white background with subtle 5% dot grid pattern, a soft orange radial glow, and floating transparent PNG/WebP product images with ground shadows. Mode 2 automatically extracts specification highlights flagged in category spec templates.
                  </p>
                </div>
              </div>

              {/* Slides List */}
              <div className="space-y-3">
                {heroSlides.length === 0 ? (
                  <div className="bg-slate-950 p-8 text-center rounded-xl border border-slate-800 text-slate-400 text-xs space-y-3">
                    <p>No hero slides configured yet. Click "Add New Hero Slide" or seed authentic hardware samples.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button size="sm" onClick={handleOpenNewSlide}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        <span>Add New Hero Slide</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSeedSampleHeroSlides}
                        className="border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white hover:bg-slate-800 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5 text-[#F15A24]" />
                        <span>Seed Sample Slides</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  heroSlides.map((slide, idx) => {
                    const isManual = slide.sourceMode === 'manual';
                    const isProduct = slide.sourceMode === 'product';
                    const isCollection = slide.sourceMode === 'collection';
                    const linkedProduct = isProduct ? products.find(p => p.id === slide.productId) : null;

                    return (
                      <div
                        key={slide.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          slide.enabled
                            ? 'bg-slate-950 border-slate-800 shadow-md'
                            : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          
                          {/* Reordering and Status */}
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorderSlide(idx, 'up')}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === heroSlides.length - 1}
                                onClick={() => handleReorderSlide(idx, 'down')}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-xl bg-white/90 border border-slate-700/50 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                              {slide.image ? (
                                <img
                                  src={slide.image}
                                  alt={slide.title}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : isProduct && linkedProduct?.primaryImage ? (
                                <img
                                  src={linkedProduct.primaryImage}
                                  alt={linkedProduct.name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm">{slide.title}</span>
                                
                                {isPlaceholderImage(slide.image || linkedProduct?.primaryImage) && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Placeholder image
                                  </span>
                                )}

                                {/* Source Mode Badge */}
                                {isManual && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    Mode 1: Manual
                                  </span>
                                )}
                                {isProduct && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    Mode 2: Product Live Sync
                                  </span>
                                )}
                                {isCollection && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    Mode 3: Auto Collection ({slide.collectionRule || 'newest'}, limit {slide.collectionCount || 3})
                                  </span>
                                )}

                                {/* Slide Badge */}
                                {slide.badge && (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#F15A24] text-white">
                                    {slide.badge}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-400 flex items-center gap-3">
                                <span>Headline: <strong className="text-slate-200">{slide.headline || linkedProduct?.name || 'Dynamic'}</strong></span>
                                {slide.priceText && (
                                  <span className="text-[#F15A24] font-bold">{slide.priceText}</span>
                                )}
                              </div>

                              {/* Highlight chips preview */}
                              {slide.highlights && slide.highlights.length > 0 && (
                                <div className="flex items-center gap-1.5 pt-1">
                                  {slide.highlights.map((h, hIdx) => (
                                    <span key={hIdx} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                      {h.value} ({h.label})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {/* Enabled Toggle */}
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = { ...slide, enabled: !slide.enabled };
                                await handleSaveSlide(updated);
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                slide.enabled
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}
                            >
                              {slide.enabled ? 'Active' : 'Disabled'}
                            </button>

                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSlide({ ...slide });
                                setSlideModalOpen(true);
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              <span>Edit</span>
                            </Button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Slide"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* BLOG & ARTICLES CMS MODULE */}
          {activeModule === 'blog' && (
            <BlogCmsModule />
          )}

          {/* FAQ KNOWLEDGEBASE CMS MODULE */}
          {activeModule === 'faqs' && (
            <FaqCmsModule />
          )}

          {/* PROJECTS & PORTFOLIO CMS MODULE */}
          {activeModule === 'projects' && (
            <ProjectsModule />
          )}

          {/* COMPANY PROFILE CMS MODULE */}
          {activeModule === 'company' && (
            <CompanyProfileModule />
          )}

          {/* TECHNICIAN SERVICES CMS MODULE */}
          {activeModule === 'services' && (
            <ServicesModule />
          )}

          {/* CUSTOM PAGES & POLICY CMS MODULE */}
          {activeModule === 'pages' && (
            <PagesModule />
          )}

          {/* TESTIMONIALS CMS MODULE */}
          {activeModule === 'testimonials' && (
            <TestimonialsModule />
          )}

          {/* BRANDS & BADGES MODULE */}
          {activeModule === 'brands' && (
            <BrandsModule />
          )}

          {/* SCENARIOS MODULE */}
          {activeModule === 'scenarios' && (
            <ScenariosModule />
          )}

          {/* REDIRECTS 301/302 MANAGER MODULE */}
          {activeModule === 'redirects' && (
            <RedirectsModule />
          )}

          {/* GLOSSARY CMS MODULE */}
          {activeModule === 'glossary' && (
            <GlossaryModule />
          )}

          {/* SYSTEM LOGS, HEALTH & BACKUPS MODULE */}
          {activeModule === 'systemlogs' && (
            <SystemLogsAndHealthModule />
          )}

          {/*CENTRAL API, AUTHENTICATION & ENVIRONMENT CONTROL CENTER*/}
          {activeModule === 'integrations' && <ApiControlCenterModule />}
          {/* 6. SITE SETTINGS & PLATFORM CONFIGURATION */}
          {activeModule === 'settings' && (
            <SettingsModule
              products={products}
              onOpenProductEdit={handleOpenProductEdit}
              onOpenProductCreate={handleOpenProductCreate}
              onClearDemo={() => setClearDemoModalOpen(true)}
              onResetSeeds={() => setResetSeedsModalOpen(true)}
            />
          )}
          </ErrorBoundary>
        </main>

      </div>

      {/* PRODUCT CREATION ASSISTANT MODAL (MODE A & MODE B WITH MANDATORY REVIEW) */}
      {assistantModalOpen && (
        <Modal
          isOpen={assistantModalOpen}
          onClose={() => setAssistantModalOpen(false)}
          title="Product Creation Assistant (Mode A / Mode B)"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-slate-900">
            
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setAssistantMode('A')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  assistantMode === 'A' ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Mode A: Automatic Research Assistant
              </button>
              <button
                onClick={() => setAssistantMode('B')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  assistantMode === 'B' ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Mode B: Manual Entry
              </button>
            </div>

            {/* MODE A RESEARCH CONTROLS */}
            {assistantMode === 'A' && !researchResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px] uppercase">
                    Demo — Not Live
                  </span>
                  <span>
                    Mode A uses simulated pattern matching against local product definitions. Real manufacturer scraping is not connected. All extracted specifications must be reviewed manually before saving.
                  </span>
                </div>

                <Alert type="info" title="Automatic Manufacturer Research (Simulated)">
                  Enter the model number (e.g. <code>DS-2CE1AD0T-IRPF</code> or <code>MB20</code>). Mode A queries official manufacturer datasheets with confidence scoring.
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Brand / Manufacturer"
                    value={researchBrand}
                    onChange={(e) => setResearchBrand(e.target.value)}
                    options={[
                      { value: 'Hikvision', label: 'Hikvision' },
                      { value: 'ZKTeco', label: 'ZKTeco' },
                      { value: 'Dahua Technology', label: 'Dahua Technology' },
                      { value: 'Ruijie Reyee', label: 'Ruijie Reyee' }
                    ]}
                  />

                  <Input
                    label="Model Number *"
                    value={researchModel}
                    onChange={(e) => setResearchModel(e.target.value)}
                    placeholder="e.g. DS-2CE16D0T-IT3F"
                  />
                </div>

                <Button
                  size="md"
                  onClick={handleStartResearch}
                  isLoading={isResearching}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Execute Research Query</span>
                </Button>
              </div>
            )}

            {/* MANDATORY REVIEW SCREEN (Required by prompt) */}
            {researchResult && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px] uppercase">
                    Demo — Not Live Source
                  </span>
                  <span>
                    Mode A output is simulated. Mandatory manual confirmation is required before this product can be saved.
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <strong>Mandatory Review Screen:</strong> Review every research result field below with confidence scoring. You must approve or reject fields before publishing to the catalog. Missing or unverified values are never invented.
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  
                  {/* Name field */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Product Name</span>
                      <Badge variant="success">High Confidence (Official Catalog)</Badge>
                    </div>
                    <input
                      type="text"
                      value={reviewFields.name?.value || ''}
                      onChange={(e) => setReviewFields({ ...reviewFields, name: { value: e.target.value, status: 'edited' } })}
                      className="w-full bg-white border border-slate-300 p-2 rounded text-xs"
                    />
                  </div>

                  {/* Category field */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Suggested Category</span>
                      <Badge variant="success">High Confidence</Badge>
                    </div>
                    <input
                      type="text"
                      value={reviewFields.category?.value || ''}
                      onChange={(e) => setReviewFields({ ...reviewFields, category: { value: e.target.value, status: 'edited' } })}
                      className="w-full bg-white border border-slate-300 p-2 rounded text-xs"
                    />
                  </div>

                  {/* Specifications */}
                  <div className="pt-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block mb-2">
                      Extracted Hardware Specifications:
                    </span>
                    <div className="space-y-2">
                      {Object.entries(researchResult.suggestedSpecs).map(([key, val]) => (
                        <div key={key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-[#111827] block capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Source: {val.sourceUrl}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{String(val.value)}</span>
                            <Badge variant={val.confidence === 'high' ? 'success' : 'warning'}>
                              {val.confidence}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Mandatory Review Gate */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualReviewConfirmed}
                      onChange={(e) => setManualReviewConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                    />
                    <span className="text-xs text-slate-700">
                      <strong>Mandatory Human Review Confirmation:</strong> I have manually checked and verified these specifications against official manufacturer documentation. (Required to approve and publish).
                    </span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => { setResearchResult(null); setManualReviewConfirmed(false); }}>
                    Discard Research
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInEditorFromResearch}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5 text-amber-500" />
                      <span>Review in Product Editor (Draft)</span>
                    </Button>
                    <Button
                      size="md"
                      onClick={handleSaveReviewedProduct}
                      disabled={!manualReviewConfirmed}
                      className={!manualReviewConfirmed ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      <span>Approve & Save as Draft</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* MODE B: MANUAL ENTRY */}
            {assistantMode === 'B' && (
              <div className="space-y-4">
                <Input label="Product Name *" placeholder="e.g. Hikvision DS-2CE..." />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Model Number *" placeholder="e.g. DS-..." />
                  <Input label="Brand *" placeholder="e.g. Hikvision" />
                </div>
                <Button size="md" className="w-full" onClick={() => setAssistantModalOpen(false)}>
                  Save Manual Product
                </Button>
              </div>
            )}

          </div>
        </Modal>
      )}

      {/* HERO SLIDE EDITOR MODAL */}
      {slideModalOpen && editingSlide && (
        <Modal
          isOpen={slideModalOpen}
          onClose={() => {
            setSlideModalOpen(false);
            setEditingSlide(null);
          }}
          title={editingSlide.id.startsWith('slide-') && editingSlide.title === 'New Hardware Banner Slide' ? 'Create Hero Slide' : 'Edit Hero Slide'}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-slate-900 max-h-[82vh] overflow-y-auto pr-1">
            
            {/* Mode Selector Tabs */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Slide Source Mode
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEditingSlide({ ...editingSlide, sourceMode: 'manual' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editingSlide.sourceMode === 'manual'
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mode 1: Manual
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSlide({ ...editingSlide, sourceMode: 'product' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editingSlide.sourceMode === 'product'
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mode 2: From Product (Auto)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSlide({ ...editingSlide, sourceMode: 'collection' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editingSlide.sourceMode === 'collection'
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mode 3: Auto Collection
                </button>
              </div>
            </div>

            {/* General Settings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Slide Title (Admin Only) *</label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="e.g. 4K AcuSense Bullet Camera"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-800 p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Badge Pill</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingSlide.showBadge !== false && !!editingSlide.badge}
                    onChange={(e) => setEditingSlide({ ...editingSlide, showBadge: e.target.checked })}
                    className="w-4 h-4 text-[#F15A24] rounded focus:ring-[#F15A24]"
                    title="Toggle Badge Visibility"
                  />
                  <select
                    value={editingSlide.badge || ''}
                    onChange={(e) => setEditingSlide({
                      ...editingSlide,
                      badge: (e.target.value as any) || undefined,
                      showBadge: !!e.target.value
                    })}
                    className="w-full bg-white border border-slate-300 text-xs text-slate-800 p-2 rounded-lg"
                  >
                    <option value="">No Badge</option>
                    <option value="New">New</option>
                    <option value="Featured">Featured</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingSlide.enabled}
                    onChange={(e) => setEditingSlide({ ...editingSlide, enabled: e.target.checked })}
                    className="w-4 h-4 text-[#F15A24] rounded focus:ring-[#F15A24]"
                  />
                  <span>Active & Enabled</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Model Number</label>
                <input
                  type="text"
                  value={editingSlide.modelNumber || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, modelNumber: e.target.value })}
                  placeholder="e.g. DS-2CE10DF0T-F"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-800 p-2 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Orange Eyebrow Text</label>
                <input
                  type="text"
                  value={editingSlide.eyebrow || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, eyebrow: e.target.value })}
                  placeholder="e.g. FULL-COLOR SURVEILLANCE"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-800 p-2 rounded-lg uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Tab Strip Label (Max 22 chars)</label>
                  <span className={`text-[10px] font-mono ${(editingSlide.tabLabel || '').length > 22 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {(editingSlide.tabLabel || '').length}/22
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={22}
                  value={editingSlide.tabLabel || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, tabLabel: e.target.value })}
                  placeholder="e.g. ColorVu Camera"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-800 p-2 rounded-lg"
                />
              </div>
            </div>

            {/* Scheduling (Optional) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#F15A24]" />
                <span>Scheduling (Optional start / end dates)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Start Date</span>
                  <input
                    type="date"
                    value={editingSlide.startDate ? editingSlide.startDate.split('T')[0] : ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">End Date</span>
                  <input
                    type="date"
                    value={editingSlide.endDate ? editingSlide.endDate.split('T')[0] : ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* MODE 1: MANUAL FIELDS */}
            {editingSlide.sourceMode === 'manual' && (
              <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200">
                <span className="text-xs font-bold text-blue-900 block uppercase tracking-wider">
                  Mode 1: Manual Content
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Headline (Brand + Name) *</label>
                    <input
                      type="text"
                      value={editingSlide.headline || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, headline: e.target.value })}
                      placeholder="Hikvision 4K Smart Hybrid Bullet Camera"
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Price Text (Real price only, e.g. ৳4,850)</label>
                    <input
                      type="text"
                      value={editingSlide.priceText || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, priceText: e.target.value })}
                      placeholder="Leave blank if quotation only"
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Short Description (1-2 lines)</label>
                  <textarea
                    rows={2}
                    value={editingSlide.description || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                    placeholder="Intelligent 4K security with dual smart illumination and AcuSense AI."
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                  />
                </div>

                <ImagePickerField
                  label="Floating Transparent Product Image URL"
                  value={editingSlide.image || ''}
                  onChange={(url) => setEditingSlide({ ...editingSlide, image: url })}
                  placeholder="/images/hero/hikvision-bullet.jpg or transparent PNG/WebP URL"
                  helperText="Transparent PNG or WebP with no background is strongly recommended for seamless floating presentation."
                  theme="light"
                  required
                  modalTitle="Select Hero Slide Image"
                  presets={[
                    { label: 'Bullet Camera', url: '/images/hero/hikvision-bullet.jpg' },
                    { label: 'Wi-Fi 6 AP', url: '/images/hero/ruijie-wifi6.jpg' },
                    { label: 'Biometric Terminal', url: '/images/hero/zkteco-biometric.jpg' }
                  ]}
                />

                {/* CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Primary Button Text & Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingSlide.buttonText || 'View Product'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                        className="w-1/2 bg-white border border-slate-300 text-xs p-2 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editingSlide.buttonLink || '/catalog'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, buttonLink: e.target.value })}
                        className="w-1/2 bg-white border border-slate-300 text-xs p-2 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Secondary Quiet Link Text & Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingSlide.secondaryText || 'Request quotation'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, secondaryText: e.target.value })}
                        className="w-1/2 bg-white border border-slate-300 text-xs p-2 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editingSlide.secondaryLink || '/quote'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, secondaryLink: e.target.value })}
                        className="w-1/2 bg-white border border-slate-300 text-xs p-2 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Highlight Chips Editor (3-4 items) */}
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Highlight Feature Chips (Up to 4 chips)
                    </label>
                    {(editingSlide.highlights?.length || 0) < 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          const hl = [...(editingSlide.highlights || []), { icon: 'camera' as const, value: '4K', label: 'Resolution' }];
                          setEditingSlide({ ...editingSlide, highlights: hl });
                        }}
                        className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chip</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(editingSlide.highlights || []).map((chip, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <select
                          value={chip.icon}
                          onChange={(e) => {
                            const hl = [...(editingSlide.highlights || [])];
                            hl[cIdx] = { ...hl[cIdx], icon: e.target.value as any };
                            setEditingSlide({ ...editingSlide, highlights: hl });
                          }}
                          className="bg-slate-50 border border-slate-300 text-xs p-1.5 rounded"
                        >
                          <option value="camera">Camera</option>
                          <option value="eye">Night Vision / Eye</option>
                          <option value="wifi">Wi-Fi / Antenna</option>
                          <option value="zap">PoE / Power</option>
                          <option value="cpu">Ports / CPU</option>
                          <option value="shield">IP67 / Shield</option>
                        </select>

                        <input
                          type="text"
                          value={chip.value}
                          onChange={(e) => {
                            const hl = [...(editingSlide.highlights || [])];
                            hl[cIdx] = { ...hl[cIdx], value: e.target.value };
                            setEditingSlide({ ...editingSlide, highlights: hl });
                          }}
                          placeholder="Value (e.g. 4K)"
                          className="flex-1 bg-slate-50 border border-slate-300 text-xs p-1.5 rounded font-bold"
                        />

                        <input
                          type="text"
                          value={chip.label}
                          onChange={(e) => {
                            const hl = [...(editingSlide.highlights || [])];
                            hl[cIdx] = { ...hl[cIdx], label: e.target.value };
                            setEditingSlide({ ...editingSlide, highlights: hl });
                          }}
                          placeholder="Label (e.g. Resolution)"
                          className="flex-1 bg-slate-50 border border-slate-300 text-xs p-1.5 rounded"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const hl = (editingSlide.highlights || []).filter((_, i) => i !== cIdx);
                            setEditingSlide({ ...editingSlide, highlights: hl });
                          }}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* MODE 2: FROM PRODUCT (AUTOMATIC) */}
            {editingSlide.sourceMode === 'product' && (
              <div className="space-y-4 p-4 bg-orange-50/50 rounded-xl border border-orange-200">
                <span className="text-xs font-bold text-orange-950 block uppercase tracking-wider">
                  Mode 2: From Product (Auto Synchronized)
                </span>
                
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Catalog Product *
                  </label>
                  <select
                    value={editingSlide.productId || ''}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      const prod = products.find(p => p.id === prodId);
                      if (!prod) return;

                      // Extract category template highlights
                      const cat = categories.find(c => c.id === prod.categoryId);
                      const tpl = templates.find(t => t.id === cat?.specTemplateId);
                      const hlFields = tpl?.fields.filter(f => f.showInHighlights) || [];
                      const highlights: HeroFeatureHighlight[] = [];
                      for (const f of hlFields) {
                        if (highlights.length >= 4) break;
                        const v = prod.specifications?.[f.key];
                        if (v) {
                          let icon: HeroFeatureHighlight['icon'] = 'camera';
                          const kl = f.key.toLowerCase();
                          if (kl.includes('night') || kl.includes('ir') || kl.includes('vision') || kl.includes('sensor')) icon = 'eye';
                          else if (kl.includes('wifi') || kl.includes('wireless') || kl.includes('band')) icon = 'wifi';
                          else if (kl.includes('poe') || kl.includes('power') || kl.includes('battery')) icon = 'zap';
                          else if (kl.includes('cpu') || kl.includes('port') || kl.includes('throughput')) icon = 'cpu';
                          else if (kl.includes('ip') || kl.includes('weather') || kl.includes('housing') || kl.includes('protection')) icon = 'shield';
                          highlights.push({ icon, value: String(v), label: f.label || f.name || f.key || 'Specification' });
                        }
                      }
                      if (highlights.length === 0 && prod.keyFeatures?.length) {
                        prod.keyFeatures.slice(0, 4).forEach((feat, i) => {
                          highlights.push({ icon: 'shield', value: feat, label: `Feature ${i + 1}` });
                        });
                      }

                      // Clean headline without duplicate brand
                      const cleanHeadline = prod.name.toLowerCase().startsWith(prod.brand.toLowerCase())
                        ? prod.name
                        : `${prod.brand} ${prod.name}`;

                      // Check if new arrival (< 30 days old)
                      const isNewArrival = prod.createdAt && (Date.now() - new Date(prod.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000);
                      const derivedBadge = isNewArrival ? 'New' : (prod.isHot ? 'Hot' : (prod.isFeatured ? 'Featured' : undefined));

                      // Tab label (max 22 chars)
                      const tabLabel = (prod.name.length > 22 ? prod.category || prod.brand : prod.name).slice(0, 22);

                      setEditingSlide({
                        ...editingSlide,
                        productId: prod.id,
                        headline: cleanHeadline,
                        modelNumber: prod.modelNumber || '',
                        eyebrow: prod.category ? prod.category.toUpperCase() : 'NEXT-GEN SURVEILLANCE',
                        tabLabel,
                        badge: derivedBadge as any,
                        showBadge: Boolean(derivedBadge),
                        description: prod.shortDescription || prod.description || '',
                        image: prod.primaryImage || '',
                        priceText: prod.pricing?.regularPrice ? `৳${prod.pricing.regularPrice.toLocaleString()}` : '',
                        buttonText: 'View Product',
                        buttonLink: `/product/${prod.id}`,
                        secondaryButtonText: 'Call for Service',
                        secondaryButtonLink: 'tel:+8801540535150',
                        secondaryText: 'Call for Service',
                        secondaryLink: 'tel:+8801540535150',
                        highlights
                      });
                    }}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-medium"
                  >
                    <option value="">-- Choose a Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.brand} - {p.name} ({p.modelNumber}) {p.pricing?.regularPrice ? `[৳${p.pricing.regularPrice.toLocaleString()}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Product Summary & Gallery Selection */}
                {editingSlide.productId && (() => {
                  const prod = products.find(p => p.id === editingSlide.productId);
                  if (!prod) return null;
                  return (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{prod.brand} {prod.name}</strong>
                          <span className="text-slate-500 block font-mono text-[11px]">{prod.modelNumber} · {prod.category}</span>
                        </div>
                        <span className="font-extrabold text-[#F15A24]">
                          {prod.pricing?.regularPrice ? `৳${prod.pricing.regularPrice.toLocaleString()}` : 'Quotation'}
                        </span>
                      </div>

                      {/* Transparent image picker from gallery */}
                      {prod.gallery && prod.gallery.length > 0 && (
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-1">
                            Pick Hero Image from Product Gallery:
                          </span>
                          <div className="flex items-center gap-2">
                            {prod.gallery.map((imgUrl, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setEditingSlide({ ...editingSlide, image: imgUrl })}
                                className={`w-12 h-12 p-1 rounded-lg border flex items-center justify-center bg-slate-50 ${
                                  editingSlide.image === imgUrl ? 'border-[#F15A24] ring-2 ring-[#F15A24]/30' : 'border-slate-200'
                                }`}
                              >
                                <img src={imgUrl} alt={`gallery-${i}`} className="w-full h-full object-contain" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Per-field Overrides Toggle & Fields */}
                <div className="pt-2 border-t border-orange-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Per-Field Custom Overrides (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const hasOverrides = !!editingSlide.overrides;
                        setEditingSlide({
                          ...editingSlide,
                          overrides: hasOverrides ? undefined : {
                            headline: editingSlide.headline,
                            description: editingSlide.description,
                            modelNumber: editingSlide.modelNumber,
                            eyebrow: editingSlide.eyebrow,
                            tabLabel: editingSlide.tabLabel
                          }
                        });
                      }}
                      className="text-xs font-bold text-[#F15A24] hover:underline"
                    >
                      {editingSlide.overrides ? 'Disable Overrides' : '+ Enable Overrides'}
                    </button>
                  </div>

                  {editingSlide.overrides && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Headline</label>
                          <input
                            type="text"
                            value={editingSlide.overrides.headline || ''}
                            onChange={(e) => setEditingSlide({
                              ...editingSlide,
                              overrides: { ...editingSlide.overrides, headline: e.target.value }
                            })}
                            placeholder="Custom Headline"
                            className="w-full bg-slate-50 border border-slate-300 p-2 rounded"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Model Number</label>
                          <input
                            type="text"
                            value={editingSlide.overrides.modelNumber || ''}
                            onChange={(e) => setEditingSlide({
                              ...editingSlide,
                              overrides: { ...editingSlide.overrides, modelNumber: e.target.value }
                            })}
                            placeholder="Custom Model Number"
                            className="w-full bg-slate-50 border border-slate-300 p-2 rounded font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Eyebrow Text</label>
                          <input
                            type="text"
                            value={editingSlide.overrides.eyebrow || ''}
                            onChange={(e) => setEditingSlide({
                              ...editingSlide,
                              overrides: { ...editingSlide.overrides, eyebrow: e.target.value }
                            })}
                            placeholder="Custom Eyebrow Text"
                            className="w-full bg-slate-50 border border-slate-300 p-2 rounded uppercase"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Tab Label (Max 22 chars)</label>
                          <input
                            type="text"
                            maxLength={22}
                            value={editingSlide.overrides.tabLabel || ''}
                            onChange={(e) => setEditingSlide({
                              ...editingSlide,
                              overrides: { ...editingSlide.overrides, tabLabel: e.target.value }
                            })}
                            placeholder="Custom Tab Label"
                            className="w-full bg-slate-50 border border-slate-300 p-2 rounded"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Description</label>
                        <input
                          type="text"
                          value={editingSlide.overrides.description || ''}
                          onChange={(e) => setEditingSlide({
                            ...editingSlide,
                            overrides: { ...editingSlide.overrides, description: e.target.value }
                          })}
                          placeholder="Custom short description"
                          className="w-full bg-slate-50 border border-slate-300 p-2 rounded"
                        />
                      </div>

                      <ImagePickerField
                        label="Override Image URL (Transparent PNG/WebP)"
                        value={editingSlide.overrides.image || ''}
                        onChange={(url) => setEditingSlide({
                          ...editingSlide,
                          overrides: { ...editingSlide.overrides, image: url }
                        })}
                        placeholder="Custom transparent image URL"
                        theme="light"
                        modalTitle="Select Override Slide Image from Media Library"
                      />
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* MODE 3: AUTO COLLECTION */}
            {editingSlide.sourceMode === 'collection' && (
              <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-200">
                <span className="text-xs font-bold text-purple-950 block uppercase tracking-wider">
                  Mode 3: Auto Collection Rule
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Collection Rule *</label>
                    <select
                      value={editingSlide.collectionRule || 'newest'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, collectionRule: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                    >
                      <option value="newest">Newest Products (Last 30 Days)</option>
                      <option value="featured">Featured Products (Promoted)</option>
                      <option value="hot">Hot Products (Bestsellers)</option>
                      <option value="category">Products by Category</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Slide Count Limit (1 to 6)</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={editingSlide.collectionCount || 3}
                      onChange={(e) => setEditingSlide({ ...editingSlide, collectionCount: parseInt(e.target.value) || 3 })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                    />
                  </div>
                </div>

                {editingSlide.collectionRule === 'category' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Target Category *</label>
                    <select
                      value={editingSlide.collectionCategoryId || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, collectionCategoryId: e.target.value })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="p-3 bg-white rounded-lg border border-purple-200 text-xs text-slate-600">
                  ⚡ <strong>Auto-Resolution:</strong> Slides generated by this rule will automatically pull real product specs, prices, and badges. Any unpublished or imageless product is automatically skipped.
                </div>
              </div>
            )}

            {/* LIVE PREVIEW BOX */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Live Storefront Preview
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setHeroPreviewMode('desktop')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      heroPreviewMode === 'desktop' ? 'bg-white text-[#111827] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Desktop (1280px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroPreviewMode('mobile')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      heroPreviewMode === 'mobile' ? 'bg-white text-[#111827] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Mobile (375px)
                  </button>
                </div>
              </div>

              {heroPreviewMode === 'desktop' ? (
                /* DESKTOP PREVIEW */
                <div className="bg-[#FAF7F2] border border-slate-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
                  {/* Radial Glow */}
                  <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-[#F15A24]/[0.08] rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Left Column (55%) */}
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {editingSlide.showBadge !== false && (editingSlide.overrides?.badge || editingSlide.badge) && (
                          <span className="inline-block bg-[#F15A24] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                            {editingSlide.overrides?.badge || editingSlide.badge}
                          </span>
                        )}
                        {(editingSlide.overrides?.modelNumber || editingSlide.modelNumber) && (
                          <span className="font-mono text-[11px] font-medium text-slate-500">
                            {editingSlide.overrides?.modelNumber || editingSlide.modelNumber}
                          </span>
                        )}
                      </div>

                      {(editingSlide.overrides?.eyebrow || editingSlide.eyebrow) && (
                        <div className="text-[11px] font-black text-[#F15A24] tracking-wider uppercase">
                          {editingSlide.overrides?.eyebrow || editingSlide.eyebrow}
                        </div>
                      )}

                      <h3 className="text-xl sm:text-2xl font-black text-[#111827] font-heading leading-tight">
                        {editingSlide.overrides?.headline || editingSlide.headline || 'Product Headline'}
                      </h3>

                      <p className="text-xs text-[#5B6472] leading-relaxed line-clamp-2">
                        {editingSlide.overrides?.description || editingSlide.description || 'Intelligent hardware configuration designed for enterprise video surveillance.'}
                      </p>

                      {/* Dual CTA buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button type="button" className="bg-[#F15A24] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-xs">
                          {editingSlide.buttonText || 'View Product'}
                        </button>
                        <button type="button" className="bg-transparent border border-slate-300 text-[#111827] font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>{editingSlide.secondaryButtonText || editingSlide.secondaryText || 'Call for Service'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column (45%): Floating PNG + Spec Card */}
                    <div className="md:col-span-5 relative flex items-center justify-center min-h-[160px]">
                      {/* Ground Shadow */}
                      <div className="absolute bottom-2 w-44 h-4 bg-black/15 rounded-full blur-md" />
                      {editingSlide.overrides?.image || editingSlide.image ? (
                        <img
                          src={editingSlide.overrides?.image || editingSlide.image}
                          alt="Preview"
                          className="max-h-44 max-w-full object-contain relative z-10 drop-shadow-[0_16px_24px_rgba(0,0,0,0.12)] mix-blend-multiply"
                        />
                      ) : (
                        <div className="text-slate-300 text-xs text-center py-6">
                          <ImageIcon className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                          <span>Permanent vector placeholder active</span>
                        </div>
                      )}

                      {/* Floating Spec Highlights Card */}
                      {editingSlide.highlights && editingSlide.highlights.length > 0 && (
                        <div className="absolute -top-2 right-0 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-2.5 shadow-md w-36 space-y-1.5 z-20">
                          {editingSlide.highlights.slice(0, 4).map((h, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] border-b border-slate-100 last:border-b-0 pb-1 last:pb-0">
                              <span className="text-slate-500 truncate">{h.label}</span>
                              <span className="font-bold text-[#111827] ml-1">{h.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tab strip preview */}
                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tab Preview:</span>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#F15A24]/40 rounded-full text-xs font-bold text-[#F15A24] shadow-2xs">
                      <span className="font-mono text-[10px] opacity-70">01</span>
                      <span>{editingSlide.overrides?.tabLabel || editingSlide.tabLabel || 'Slide Tab'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* MOBILE PREVIEW (375px Container) */
                <div className="max-w-[360px] mx-auto bg-[#FAF7F2] border border-slate-300 rounded-[24px] p-5 shadow-md space-y-4">
                  <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Mobile Viewport (375px)
                  </div>

                  {/* Mobile Image First */}
                  <div className="relative h-36 flex items-center justify-center">
                    <div className="absolute bottom-1 w-36 h-3 bg-black/15 rounded-full blur-sm" />
                    {editingSlide.overrides?.image || editingSlide.image ? (
                      <img
                        src={editingSlide.overrides?.image || editingSlide.image}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain relative z-10 drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)] mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-slate-300 text-xs text-center">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span>Placeholder image</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Spec 2x2 Grid under Image */}
                  {editingSlide.highlights && editingSlide.highlights.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200">
                      {editingSlide.highlights.slice(0, 4).map((h, i) => (
                        <div key={i} className="text-[10px]">
                          <span className="text-slate-400 block">{h.label}</span>
                          <span className="font-bold text-[#111827]">{h.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mobile Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {editingSlide.showBadge !== false && (editingSlide.overrides?.badge || editingSlide.badge) && (
                        <span className="inline-block bg-[#F15A24] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          {editingSlide.overrides?.badge || editingSlide.badge}
                        </span>
                      )}
                      {(editingSlide.overrides?.modelNumber || editingSlide.modelNumber) && (
                        <span className="font-mono text-[10px] text-slate-500">
                          {editingSlide.overrides?.modelNumber || editingSlide.modelNumber}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-[#111827] font-heading leading-tight">
                      {editingSlide.overrides?.headline || editingSlide.headline || 'Product Headline'}
                    </h4>

                    <p className="text-[11px] text-[#5B6472] line-clamp-2 leading-relaxed">
                      {editingSlide.overrides?.description || editingSlide.description || 'Intelligent security with AcuSense AI.'}
                    </p>

                    {/* Stacked Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button type="button" className="w-full bg-[#F15A24] text-white font-bold text-xs py-2.5 rounded-full shadow-xs">
                        {editingSlide.buttonText || 'View Product'}
                      </button>
                      <button type="button" className="w-full bg-white border border-slate-300 text-[#111827] font-bold text-xs py-2 rounded-full flex items-center justify-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
                        <span>{editingSlide.secondaryButtonText || editingSlide.secondaryText || 'Call for Service'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSlideModalOpen(false);
                  setEditingSlide(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={() => handleSaveSlide(editingSlide)}
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>Save Hero Slide</span>
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* CATEGORY EDITOR MODAL */}
      {categoryModalOpen && editingCategory && (
        <Modal
          isOpen={categoryModalOpen}
          onClose={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          title={editingCategory.id ? 'Edit Hardware Category' : 'Create New Category'}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-slate-900">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
              <input
                type="text"
                value={editingCategory.name || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory,
                  name: e.target.value,
                  slug: editingCategory.id ? editingCategory.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                })}
                placeholder="e.g. Network Switches & PoE"
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">URL Slug *</label>
                <input
                  type="text"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="e.g. network-switches"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingCategory.displayOrder || 1}
                  onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Linked Spec Template *</label>
              <select
                value={editingCategory.specTemplateId || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, specTemplateId: e.target.value })}
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-medium"
              >
                <option value="">-- Choose Specification Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.fields.length} specs)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Parent Category Group</label>
                <select
                  value={editingCategory.parentId || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value || null })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium"
                >
                  <option value="">None (Top-Level Category Group)</option>
                  {categories.filter(c => c.id !== editingCategory.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status / Enabled</label>
                <select
                  value={editingCategory.status || 'active'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium"
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            {/* SUBCATEGORIES MANAGEMENT */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Subcategories</h4>
                  <p className="text-[10px] text-slate-500">Manage subcategories (add, rename, reorder, enable/disable).</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = editingCategory.subcategories || [];
                    const nextOrder = current.length + 1;
                    const newSub: Subcategory = {
                      id: `subcat-${Date.now()}`,
                      name: `New Subcategory ${nextOrder}`,
                      slug: `new-subcategory-${nextOrder}`,
                      order: nextOrder,
                      enabled: true
                    };
                    setEditingCategory({ ...editingCategory, subcategories: [...current, newSub] });
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#F15A24] text-white rounded-lg hover:bg-[#d94e1b] transition-colors cursor-pointer"
                >
                  + Add Subcategory
                </button>
              </div>

              {(!editingCategory.subcategories || editingCategory.subcategories.length === 0) ? (
                <div className="text-[11px] text-slate-400 italic py-2 text-center bg-white rounded-lg border border-dashed border-slate-200">
                  No subcategories defined for this group.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editingCategory.subcategories.map((sc, scIdx) => (
                    <div key={sc.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={scIdx === 0}
                          onClick={() => {
                            const subs = [...(editingCategory.subcategories || [])];
                            const temp = subs[scIdx];
                            subs[scIdx] = subs[scIdx - 1];
                            subs[scIdx - 1] = temp;
                            subs.forEach((s, i) => { s.order = i + 1; });
                            setEditingCategory({ ...editingCategory, subcategories: subs });
                          }}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-20 text-[10px] cursor-pointer"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={scIdx === (editingCategory.subcategories?.length || 1) - 1}
                          onClick={() => {
                            const subs = [...(editingCategory.subcategories || [])];
                            const temp = subs[scIdx];
                            subs[scIdx] = subs[scIdx + 1];
                            subs[scIdx + 1] = temp;
                            subs.forEach((s, i) => { s.order = i + 1; });
                            setEditingCategory({ ...editingCategory, subcategories: subs });
                          }}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-20 text-[10px] cursor-pointer"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>

                      <input
                        type="text"
                        value={sc.name}
                        onChange={(e) => {
                          const subs = [...(editingCategory.subcategories || [])];
                          subs[scIdx] = {
                            ...subs[scIdx],
                            name: e.target.value,
                            slug: subs[scIdx].slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                          };
                          setEditingCategory({ ...editingCategory, subcategories: subs });
                        }}
                        placeholder="Subcategory Name"
                        className="flex-1 bg-white border border-slate-300 text-xs p-1.5 rounded font-medium"
                      />

                      <input
                        type="text"
                        value={sc.slug}
                        onChange={(e) => {
                          const subs = [...(editingCategory.subcategories || [])];
                          subs[scIdx] = { ...subs[scIdx], slug: e.target.value };
                          setEditingCategory({ ...editingCategory, subcategories: subs });
                        }}
                        placeholder="Slug"
                        className="w-28 bg-white border border-slate-300 text-xs p-1.5 rounded font-mono text-[11px]"
                      />

                      <label className="flex items-center gap-1 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={sc.enabled !== false}
                          onChange={(e) => {
                            const subs = [...(editingCategory.subcategories || [])];
                            subs[scIdx] = { ...subs[scIdx], enabled: e.target.checked };
                            setEditingCategory({ ...editingCategory, subcategories: subs });
                          }}
                          className="rounded text-orange-600 w-3.5 h-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-600">
                          {sc.enabled !== false ? 'ON' : 'OFF'}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const subs = (editingCategory.subcategories || []).filter((_, i) => i !== scIdx);
                          subs.forEach((s, i) => { s.order = i + 1; });
                          setEditingCategory({ ...editingCategory, subcategories: subs });
                        }}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Delete Subcategory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ImagePickerField
              label="Category Image URL (Transparent PNG or SVG)"
              value={editingCategory.image || ''}
              onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
              placeholder="e.g. /images/products/hikvision-bullet.svg"
              helperText="Leave empty to use automatic consistent SVG hardware illustration fallback. Never use unrelated stock photos."
              theme="light"
              modalTitle="Select Category Image from Media Library"
            />


            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Description (Max 70 chars for 2-line cards)</label>
                <span className={`text-[10px] font-mono ${(editingCategory.description || '').length > 70 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {(editingCategory.description || '').length}/70
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={90}
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                placeholder="Summary for homepage category card and catalog SEO"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
            </div>

            <PromoTileEditor
              value={editingCategory.promoTile}
              onChange={(updated) => setEditingCategory({ ...editingCategory, promoTile: updated })}
              categoryName={editingCategory.name || ''}
            />

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCategory.showOnHomepage !== false}
                  onChange={(e) => setEditingCategory({ ...editingCategory, showOnHomepage: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">Show on Homepage Category Grid</span>
              </label>
              <p className="text-[10px] text-slate-500 ml-6 mt-0.5">
                Displays this category in the homepage "Shop by Category" section (at most 8 categories are shown; ordered by Display Order).
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editingCategory.isAccessoryCategory}
                  onChange={(e) => setEditingCategory({ ...editingCategory, isAccessoryCategory: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">Accessory Category (Feeds "Accessories & Add-ons" Row)</span>
              </label>
              <p className="text-[10px] text-slate-500 ml-6 mt-0.5">
                Flag this category so its products appear in the homepage "Accessories & Add-ons" row (e.g. cables, hard drives, mounts, power units).
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editingCategory.showAsHomepageRow}
                  onChange={(e) => setEditingCategory({ ...editingCategory, showAsHomepageRow: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">Show as Dedicated Homepage Product Row</span>
              </label>
              <p className="text-[10px] text-slate-500 ml-6 mt-0.5">
                When enabled, products from this category get a dedicated horizontal showcase row on the storefront homepage (requires at least 2 items).
              </p>
            </div>

            {/* Category SEO & Search Engine Preview */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#F15A24]" />
                  <span>Category SEO Metadata</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/category/{editingCategory.slug || 'slug'}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={editingCategory.seo?.metaTitle || ''}
                    onChange={e => setEditingCategory({
                      ...editingCategory,
                      seo: { ...(editingCategory.seo || {}), metaTitle: e.target.value }
                    })}
                    placeholder={editingCategory.name ? `${editingCategory.name} - CamneX BD` : ''}
                    className="w-full bg-white border border-slate-300 text-xs p-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={editingCategory.seo?.metaDescription || ''}
                    onChange={e => setEditingCategory({
                      ...editingCategory,
                      seo: { ...(editingCategory.seo || {}), metaDescription: e.target.value }
                    })}
                    placeholder="Search engine summary for this hardware category..."
                    className="w-full bg-white border border-slate-300 text-xs p-1.5 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryModalOpen(false);
                  setEditingCategory(null);
                }}
              >
                Cancel
              </Button>
              <Button size="md" onClick={handleSaveCategory}>
                <Check className="w-4 h-4 mr-1.5" />
                <span>Save Category</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CCTV PACKAGE EDITOR MODAL */}
      {packageModalOpen && editingPackage && (
        <PackageEditModal
          isOpen={packageModalOpen}
          onClose={() => {
            setPackageModalOpen(false);
            setEditingPackage(null);
          }}
          pkg={editingPackage}
          packageSystemTypes={packageSystemTypes}
          packageSeries={packageSeries}
          allProducts={products}
          onSaveSuccess={() => {
            packageService.getPackages().then(setPackages);
          }}
        />
      )}

      {/* BULK TOOLS MODAL */}
      {bulkToolsModalOpen && (
        <BulkToolsModal
          isOpen={bulkToolsModalOpen}
          onClose={() => setBulkToolsModalOpen(false)}
          selectedProductIds={selectedProductIds}
          products={products}
          categories={categories}
          onSuccess={() => {
            productService.getProducts({ limit: 100 }).then(res => {
              if (res) {
                setProducts(Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []));
                if (typeof res.total === 'number') {
                  setTotalProductsCount(res.total);
                }
              }
            });
            setSelectedProductIds([]);
          }}
        />
      )}

      {/* ORDER INVOICE & DETAILS MODAL */}
      {orderInvoiceModalOpen && selectedOrderForInvoice && (
        <OrderDetailModal
          isOpen={orderInvoiceModalOpen}
          onClose={() => {
            setOrderInvoiceModalOpen(false);
            setSelectedOrderForInvoice(null);
          }}
          order={selectedOrderForInvoice}
          onOrderUpdated={() => {
            refreshAllData();
          }}
        />
      )}

      {/* PRODUCT CREATE & EDIT MODAL */}
      {productEditModalOpen && editingProduct && (
        <ProductEditModal
          isOpen={productEditModalOpen}
          onClose={() => {
            setProductEditModalOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          categories={categories}
          brands={brands}
          templates={templates}
          allProducts={products}
          onSaveSuccess={() => {
            productService.getProducts({ limit: 100 }).then(res => {
              if (res) {
                setProducts(Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []));
                if (typeof res.total === 'number') {
                  setTotalProductsCount(res.total);
                }
              }
            });
          }}
        />
      )}

      {/* CONFIRM DIALOG FOR CLEAR DEMO DATA */}
      <ConfirmDialog
        isOpen={clearDemoModalOpen}
        title="Remove All Sample Demo Content"
        message="This operation will permanently purge all seeded demo products, packages, projects, and testimonials. Real store data and customer records will be preserved."
        confirmPhrase="CLEAR DEMO DATA"
        confirmLabel="Clear Demo Data"
        variant="danger"
        isLoading={isClearingDemo}
        onConfirm={handleClearDemoData}
        onCancel={() => setClearDemoModalOpen(false)}
      />

      {/* CONFIRM DIALOG FOR RESET DATABASE */}
      <ConfirmDialog
        isOpen={resetSeedsModalOpen}
        title="Reset Database to Initial Seeds"
        message="WARNING: This operation will reset all database tables back to default baseline seeds. Any newly created catalog records will be overwritten. This action cannot be undone."
        confirmPhrase="RESET DATABASE"
        confirmLabel="Reset Store Seeds"
        variant="danger"
        isLoading={isResettingSeeds}
        onConfirm={handleResetSeeds}
        onCancel={() => setResetSeedsModalOpen(false)}
      />

    </div>
  );
};

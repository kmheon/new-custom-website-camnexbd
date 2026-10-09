import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, FolderTree, Tag, Sliders, Layers, ShoppingCart, Users,
  FileText, Settings, Sparkles, Check, X, AlertCircle, RefreshCw, Trash2, Edit3, Plus,
  Search, Shield, Eye, Database, ArrowRight, ExternalLink, ArrowUp, ArrowDown,
  Image as ImageIcon, SlidersHorizontal, Calendar, BookOpen, HelpCircle, Briefcase, Star, Globe, Compass
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Button, Input, Select, Badge, Card, Modal, Alert } from '../components/common/UI';
import { useAdminAuthStore, useSettingsStore } from '../store';
import {
  productService, categoryService, brandService, specTemplateService,
  packageService, orderService, quoteService, cmsService, productResearchService
} from '../services';
import { INITIAL_CTA_DATA } from '../services/seedData';
import {
  Product, Category, Brand, SpecTemplate, SecurityPackage, Order,
  QuoteRequest, SiteSettings, HomepageSection, ProductResearchResult, Role,
  HeroSlide, HeroFeatureHighlight
} from '../types';
import { ProductEditModal } from '../components/admin/ProductEditModal';
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

export const AdminDashboard: React.FC<{ onNavigate: (route: string, param?: string) => void }> = ({ onNavigate }) => {
  const { currentUser, isAdminAuthenticated, checkAuth, login, logout, isLoading: authLoading, error: authError } = useAdminAuthStore();
  const { settings, loadSettings, updateSettings } = useSettingsStore();

  const [authChecked, setAuthChecked] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  const [activeModule, setActiveModule] = useState<string>('dashboard');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  
  // Hero Slide Editor Modal State
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Category Editor Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // CCTV Package Editor Modal State
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<SecurityPackage> | null>(null);

  // Product Form / Edit Modal State
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

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
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await productService.deleteProduct(id);
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.items);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
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

  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadSettings();
      refreshAllData();
    }
  }, [isAdminAuthenticated]);

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

  const refreshAllData = () => {
    productService.getProducts({ limit: 100 }).then(r => setProducts(r.items));
    categoryService.getCategories().then(setCategories);
    brandService.getBrands().then(setBrands);
    specTemplateService.getTemplates().then(setTemplates);
    packageService.getPackages().then(setPackages);
    orderService.getAllOrders().then(setOrders);
    quoteService.getQuotes().then(setQuotes);
    cmsService.getHomepageSections().then(setSections);
    cmsService.getHeroSlides().then(setHeroSlides);
  };

  const handleOpenNewSlide = () => {
    setEditingSlide({
      id: `slide-${Date.now()}`,
      title: 'New Hardware Banner Slide',
      enabled: true,
      order: heroSlides.length + 1,
      sourceMode: 'manual',
      badge: 'New',
      headline: 'Hikvision 4K Smart Hybrid Bullet Camera',
      description: 'Intelligent 4K security with dual smart illumination and AcuSense AI.',
      image: '/images/hero/hikvision-bullet.jpg',
      priceText: '৳4,850',
      buttonText: 'View Product',
      buttonLink: '/catalog',
      secondaryText: 'Request quotation',
      secondaryLink: '/quote',
      highlights: [
        { icon: 'camera', value: '4K Ultra HD', label: 'Resolution' },
        { icon: 'eye', value: '40m IR', label: 'Smart IR' },
        { icon: 'shield', value: 'IP67', label: 'Weatherproof' }
      ]
    });
    setSlideModalOpen(true);
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
      specTemplateId: templates[0]?.id || 'tpl-cctv',
      status: 'active',
      displayOrder: categories.length + 1
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editingCategory.name?.trim()) return;
    const slug = editingCategory.slug?.trim() || editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (editingCategory.id) {
      await categoryService.updateCategory(editingCategory.id, { ...editingCategory, slug });
    } else {
      await categoryService.createCategory({
        name: editingCategory.name,
        slug,
        description: editingCategory.description || '',
        specTemplateId: editingCategory.specTemplateId || templates[0]?.id || 'tpl-cctv',
        status: editingCategory.status || 'active',
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

  // Commit Approved Product from Review Screen
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
      status: 'active',
      websiteVisible: true,
      posAvailable: true,
      images: ['/images/products/hikvision-bullet.svg'],
      primaryImage: '/images/products/hikvision-bullet.svg',
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
    if (confirm('Clear all sample/demo data? Only your real saved records will remain.')) {
      await cmsService.clearDemoData();
      refreshAllData();
      alert('Sample data cleared.');
    }
  };

  const handleResetSeeds = async () => {
    if (confirm('Reset store to default sample data seeds?')) {
      await cmsService.resetToInitialSeeds();
      refreshAllData();
      alert('Store reset to initial demonstration state.');
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

  if (!isAdminAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F15A24]"></span>
            <span className="text-sm font-black text-white tracking-tight font-heading">Camne<span className="text-[#F15A24]">X</span> Portal</span>
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
              Administration Portal
            </h2>
            <p className="mt-1 text-center text-xs text-slate-400">
              Sign in with your verified administrator credentials
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
                  <span>Sign In as Administrator</span>
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

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 flex flex-col">
      <SEO title="Platform Admin Dashboard | CamneX Business Platform" description="Role-gated administration portal." noIndex={true} />

      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-white font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-[#F15A24]"></span>
            <span>Camne<strong className="text-[#F15A24]">X</strong> Platform Admin</span>
          </button>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-400 font-mono">Phase 1 E-Commerce & Catalog</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{currentUser?.name}</span>
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
        <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Core Modules</div>
          
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'products', label: 'Products & Catalog', icon: <Package className="w-4 h-4" /> },
            { id: 'categories', label: 'Categories', icon: <FolderTree className="w-4 h-4" /> },
            { id: 'templates', label: 'Spec Templates', icon: <Sliders className="w-4 h-4" /> },
            { id: 'packages', label: 'CCTV Packages & Rules', icon: <Layers className="w-4 h-4" /> },
            { id: 'orders', label: 'Orders & Timeline', icon: <ShoppingCart className="w-4 h-4" /> },
            { id: 'customers', label: 'Customers & CRM', icon: <Users className="w-4 h-4" /> },
            { id: 'quotes', label: 'Quotes & Surveys', icon: <FileText className="w-4 h-4" /> },
            { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'heroslides', label: 'Hero Slides (Slider)', icon: <Sparkles className="w-4 h-4 text-[#F15A24]" /> },
            { id: 'sections', label: 'Homepage Sections', icon: <Layers className="w-4 h-4" /> },
            { id: 'projects', label: 'Projects & Portfolio', icon: <Briefcase className="w-4 h-4" /> },
            { id: 'pages', label: 'Pages & Policy CMS', icon: <Globe className="w-4 h-4" /> },
            { id: 'testimonials', label: 'Customer Testimonials', icon: <Star className="w-4 h-4" /> },
            { id: 'brands', label: 'Brands & Badges', icon: <Tag className="w-4 h-4" /> },
            { id: 'scenarios', label: 'Scenarios & Topologies', icon: <Compass className="w-4 h-4 text-emerald-400" /> },
            { id: 'redirects', label: 'URL Redirects (301)', icon: <Compass className="w-4 h-4" /> },
            { id: 'blog', label: 'Blog & Articles', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'faqs', label: 'FAQ Knowledgebase', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'settings', label: 'Site Settings & SEO', icon: <Settings className="w-4 h-4" /> }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeModule === m.id ? 'bg-[#F15A24] text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}

          <div className="pt-6 border-t border-slate-800 mt-6 px-3 space-y-2">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Data Management</span>
            <button
              onClick={handleClearDemoData}
              className="w-full text-left text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-2 py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sample Data</span>
            </button>
            <button
              onClick={handleResetSeeds}
              className="w-full text-left text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Sample Seeds</span>
            </button>
          </div>
        </aside>

        {/* Module Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-900">
          
          {/* 1. DASHBOARD OVERVIEW */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Business Platform Overview</h2>
                  <p className="text-xs text-slate-400">Phase 1 E-Commerce Operations & Queue Summary</p>
                </div>
                <Button size="sm" onClick={() => setAssistantModalOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span>Product Research Assistant</span>
                </Button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-2xl font-black text-white font-heading">{products.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Catalog Products</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-2xl font-black text-[#F15A24] font-heading">{orders.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Total Orders</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-2xl font-black text-emerald-400 font-heading">{quotes.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Quote Inquiries</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-2xl font-black text-blue-400 font-heading">{categories.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Categories Configured</div>
                </div>
              </div>

              {/* Recent Orders Queue */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
                <h3 className="font-bold text-sm text-white">Recent Hardware Orders</h3>
                {orders.length > 0 ? (
                  <div className="divide-y divide-slate-800 text-xs">
                    {orders.slice(0, 5).map(ord => (
                      <div key={ord.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white font-mono">{ord.orderNumber}</span>
                          <span className="text-slate-400 ml-2">{ord.customerName} ({ord.customerPhone})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#F15A24]">৳{ord.total?.toLocaleString ? ord.total.toLocaleString() : (ord.total ?? 0)}</span>
                          <Badge variant="dark">{ord.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No orders placed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* 2. PRODUCTS & CREATION ASSISTANT */}
          {activeModule === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Catalog Products</h2>
                  <p className="text-xs text-slate-400">Total {products.length} products published or in draft</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleOpenProductCreate} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>+ Add Product</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAssistantModalOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-1.5 text-[#F15A24]" />
                    <span>Research Assistant</span>
                  </Button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Model / SKU</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Selling Price</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <img src={p.primaryImage} alt="" className="w-7 h-7 object-cover rounded bg-slate-800" />
                          <span>{p.name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{p.modelNumber}</td>
                        <td className="p-3.5">{p.category}</td>
                        <td className="p-3.5 font-bold text-[#F15A24]">
                          {p.pricing?.regularPrice ? `৳${p.pricing.regularPrice.toLocaleString()}` : 'Quote Request'}
                        </td>
                        <td className="p-3.5">
                          <Badge variant={p.status === 'active' ? 'success' : 'gray'}>{p.status}</Badge>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => onNavigate('product', p.id)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOpenProductEdit(p)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="text-xs text-rose-400 hover:text-rose-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <th className="p-3.5">Order</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {categories.map(c => {
                      const tpl = templates.find(t => t.id === c.specTemplateId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-white">
                            <div>{c.name}</div>
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
                          <td className="p-3.5 text-slate-400">{c.displayOrder || 1}</td>
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
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {packages.map(p => (
                  <div key={p.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="orange">{p.cameraResolution || '2MP Full HD'}</Badge>
                        <Badge variant={p.isActive ? 'success' : 'gray'}>{p.isActive ? 'Active' : 'Disabled'}</Badge>
                      </div>
                      <h3 className="font-bold text-base text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                      
                      <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Camera Model:</span>
                          <span className="font-mono text-slate-200">{p.cameraModel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">DVR Unit:</span>
                          <span className="font-mono text-slate-200">{p.dvrModel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base Price:</span>
                          <span className="font-bold text-[#F15A24]">৳{p.basePrice?.toLocaleString ? p.basePrice.toLocaleString() : (p.basePrice ?? 'Quote')}</span>
                        </div>
                      </div>

                      {/* Inclusions count */}
                      <div className="pt-2 text-[11px] text-slate-400">
                        Includes: <strong className="text-slate-200">{p.inclusions?.length || 0} turnkey hardware components</strong>
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

          {/* 6. ORDERS MODULE */}
          {activeModule === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Customer Orders & Timeline Control</h2>
                <p className="text-xs text-slate-400">Manage dispatch and update status timeline visible to clients.</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Order Number</th>
                      <th className="p-3.5">Customer & Phone</th>
                      <th className="p-3.5">Payment & Details</th>
                      <th className="p-3.5">Delivery & Install</th>
                      <th className="p-3.5">Total (BDT)</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white font-mono">{o.orderNumber}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{o.customerName}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{o.customerPhone}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-200 capitalize">
                            {o.paymentMethod === 'cod' ? 'Cash on Delivery' :
                             o.paymentMethod === 'bkash_manual' ? 'bKash Send Money' :
                             o.paymentMethod === 'nagad_manual' ? 'Nagad' :
                             o.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Online Gateway'}
                          </div>
                          {o.paymentDetails?.transactionId && (
                            <div className="text-[11px] font-mono text-emerald-400">Trx: {o.paymentDetails.transactionId}</div>
                          )}
                          {o.paymentDetails?.depositRef && (
                            <div className="text-[11px] font-mono text-emerald-400">Ref: {o.paymentDetails.depositRef}</div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            {o.paymentStatus === 'unverified' ? (
                              <>
                                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                  Unverified
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await orderService.updatePaymentStatus(o.id, 'paid');
                                    refreshAllData();
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-colors"
                                  title="Audit and verify payment transaction"
                                >
                                  Verify Payment
                                </button>
                              </>
                            ) : (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                o.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {o.paymentStatus === 'paid' ? 'Paid / Verified' : 'Unpaid'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="line-clamp-1 text-slate-300">{o.deliveryAddress}</div>
                          {o.installation?.requested && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold">
                              + Installation ({o.installation.preferredDate || 'Standard'})
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-[#F15A24]">৳{o.total?.toLocaleString ? o.total.toLocaleString() : (o.total ?? 0)}</td>
                        <td className="p-3.5"><Badge variant="orange">{o.status}</Badge></td>
                        <td className="p-3.5 text-right">
                          <select
                            value={o.status}
                            onChange={async (e) => {
                              await orderService.updateOrderStatus(o.id, e.target.value, `Admin updated status to ${e.target.value}`);
                              refreshAllData();
                            }}
                            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                  Total Inquiries: <span className="text-[#F15A24]">{quotes.length}</span>
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
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No quotation requests received yet.
                        </td>
                      </tr>
                    ) : (
                      quotes.map(q => (
                        <tr key={q.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-white font-mono">{q.quoteNumber}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-white">{q.customerName}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{q.phone}</div>
                            {q.email && <div className="text-slate-500 text-[11px]">{q.email}</div>}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[#F15A24] capitalize">{q.serviceType.replace(/_/g, ' ')}</div>
                            <div className="text-slate-400 capitalize">{q.propertyType} Premises</div>
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
                          <td className="p-3.5 text-right">
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

          {/* MEDIA LIBRARY MODULE */}
          {activeModule === 'media' && (
            <MediaLibraryView />
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
                  <div className="bg-slate-950 p-8 text-center rounded-xl border border-slate-800 text-slate-400 text-xs">
                    No hero slides configured yet. Click "Add New Hero Slide" above.
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

          {/* 6. SITE SETTINGS & FOOTER CONTROLS */}
          {activeModule === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Platform Settings & Footer Navigation</h2>
                <p className="text-xs text-slate-400">Edit company details, business hours, and footer CMS configuration.</p>
              </div>

              {settings && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 max-w-3xl text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Company Name</span>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => updateSettings({ companyName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Phone Line</span>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => updateSettings({ phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Primary Email</span>
                      <input
                        type="text"
                        value={settings.email}
                        onChange={(e) => updateSettings({ email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Facebook URL</span>
                      <input
                        type="text"
                        value={settings.facebookUrl}
                        onChange={(e) => updateSettings({ facebookUrl: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 block mb-1">Physical Address (Chandrima Model Town)</span>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => updateSettings({ address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 block mb-1">
                      Business Hours <span className="text-slate-500 font-normal">(only renders in footer if entered)</span>
                    </span>
                    <input
                      type="text"
                      value={settings.businessHours || ''}
                      onChange={(e) => updateSettings({ businessHours: e.target.value })}
                      placeholder="e.g. Saturday – Thursday: 9:30 AM – 7:30 PM (Friday On-Call)"
                      className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                    />
                  </div>

                  {/* Storefront Promo / Announcement Banner */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[#F15A24] font-bold block uppercase tracking-wider text-xs">
                      Storefront Top Announcement & Promo Banner
                    </span>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="promoBannerEnabled"
                        checked={!!settings.promoBanner?.enabled}
                        onChange={(e) => updateSettings({
                          promoBanner: {
                            enabled: e.target.checked,
                            text: settings.promoBanner?.text || 'Official Hikvision & ZKTeco Partner in Bangladesh. Genuine Warranty.',
                            link: settings.promoBanner?.link || ''
                          }
                        })}
                        className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                      />
                      <label htmlFor="promoBannerEnabled" className="text-slate-300 font-semibold cursor-pointer">
                        Enable Announcement / Promo Banner on Storefront
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Banner Text</span>
                        <input
                          type="text"
                          value={settings.promoBanner?.text || ''}
                          onChange={(e) => updateSettings({
                            promoBanner: {
                              enabled: !!settings.promoBanner?.enabled,
                              text: e.target.value,
                              link: settings.promoBanner?.link || ''
                            }
                          })}
                          placeholder="e.g. Free site survey in Dhaka on CCTV packages this month!"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Banner Link (Optional)</span>
                        <input
                          type="text"
                          value={settings.promoBanner?.link || ''}
                          onChange={(e) => updateSettings({
                            promoBanner: {
                              enabled: !!settings.promoBanner?.enabled,
                              text: settings.promoBanner?.text || '',
                              link: e.target.value
                            }
                          })}
                          placeholder="e.g. /services or /quote"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Specific Settings */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[#F15A24] font-bold block uppercase tracking-wider text-xs">
                      Footer Navigation & Copyright Text
                    </span>

                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Footer Brand Short Description</span>
                      <input
                        type="text"
                        value={settings.footer?.description || ''}
                        onChange={(e) => updateSettings({
                          footer: { ...settings.footer, description: e.target.value } as any
                        })}
                        placeholder="Security, surveillance, enterprise networking..."
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Newsletter Subscribe Subtext</span>
                        <input
                          type="text"
                          value={settings.footer?.newsletterText || ''}
                          onChange={(e) => updateSettings({
                            footer: { ...settings.footer, newsletterText: e.target.value } as any
                          })}
                          placeholder="Subscribe for engineering updates..."
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Copyright Bottom Notice</span>
                        <input
                          type="text"
                          value={settings.footer?.copyrightText || ''}
                          onChange={(e) => updateSettings({
                            footer: { ...settings.footer, copyrightText: e.target.value } as any
                          })}
                          placeholder="© 2026 CamneX Bangladesh. All Rights Reserved."
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Global SEO Defaults Configuration */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[#F15A24] font-bold block uppercase tracking-wider text-xs">
                      Global SEO & Social Share Metadata
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Site Title Template</span>
                        <input
                          type="text"
                          value={settings.seoTitle || ''}
                          onChange={(e) => updateSettings({ seoTitle: e.target.value })}
                          placeholder="e.g. CamneX Bangladesh | Security & Surveillance"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Social Share Image (OG Image URL)</span>
                        <input
                          type="text"
                          value={settings.seoOgImage || ''}
                          onChange={(e) => updateSettings({ seoOgImage: e.target.value })}
                          placeholder="e.g. /images/og-share.png"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Default Meta Description</span>
                      <textarea
                        rows={2}
                        value={settings.seoDescription || ''}
                        onChange={(e) => updateSettings({ seoDescription: e.target.value })}
                        placeholder="e.g. Premium CCTV security, IP surveillance, ZKTeco biometric time attendance, and enterprise networking systems in Dhaka, Bangladesh."
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                      />
                    </div>
                  </div>

                  {/* Payment Accounts & MFS Configuration */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[#F15A24] font-bold block uppercase tracking-wider text-xs">
                      Payment Methods & MFS Accounts (Empty methods hidden at checkout)
                    </span>

                    <div className="flex items-center justify-between p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-bold text-white block text-sm">Cash on Delivery (COD)</span>
                        <span className="text-xs text-slate-400">Offer customers option to pay in cash upon physical hardware delivery. Off by default until enabled.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(settings.enableCashOnDelivery)}
                          onChange={(e) => updateSettings({ enableCashOnDelivery: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">bKash Merchant / Personal Number</span>
                        <input
                          type="text"
                          value={settings.bkashMerchantNumber || ''}
                          onChange={(e) => updateSettings({ bkashMerchantNumber: e.target.value })}
                          placeholder="Leave empty to hide bKash at checkout"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded font-mono"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Nagad Merchant / Personal Number</span>
                        <input
                          type="text"
                          value={settings.nagadMerchantNumber || ''}
                          onChange={(e) => updateSettings({ nagadMerchantNumber: e.target.value })}
                          placeholder="Leave empty to hide Nagad at checkout"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                      <span className="font-bold text-slate-300 block">Corporate Bank Deposit Account</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Bank Name</span>
                          <input
                            type="text"
                            value={settings.bankDetails?.bankName || ''}
                            onChange={(e) => updateSettings({
                              bankDetails: { ...(settings.bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' }), bankName: e.target.value }
                            })}
                            placeholder="e.g. City Bank Ltd"
                            className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Account Name</span>
                          <input
                            type="text"
                            value={settings.bankDetails?.accountName || ''}
                            onChange={(e) => updateSettings({
                              bankDetails: { ...(settings.bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' }), accountName: e.target.value }
                            })}
                            placeholder="e.g. CamneX Bangladesh"
                            className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Account Number</span>
                          <input
                            type="text"
                            value={settings.bankDetails?.accountNumber || ''}
                            onChange={(e) => updateSettings({
                              bankDetails: { ...(settings.bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' }), accountNumber: e.target.value }
                            })}
                            placeholder="e.g. 1540535150001"
                            className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Branch Name</span>
                          <input
                            type="text"
                            value={settings.bankDetails?.branch || ''}
                            onChange={(e) => updateSettings({
                              bankDetails: { ...(settings.bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' }), branch: e.target.value }
                            })}
                            placeholder="e.g. Mirpur Branch, Dhaka"
                            className="w-full bg-slate-950 border border-slate-700 text-white p-1.5 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Installation Fees Configuration */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[#F15A24] font-bold block uppercase tracking-wider text-xs">
                      Delivery & Installation Fees (BDT)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Inside Dhaka Delivery Fee</span>
                        <input
                          type="number"
                          value={settings.deliveryFeeInsideDhaka != null ? settings.deliveryFeeInsideDhaka : ''}
                          onChange={(e) => updateSettings({
                            deliveryFeeInsideDhaka: e.target.value === '' ? null : parseInt(e.target.value) || 0
                          })}
                          placeholder="e.g. 100 (Empty = To be confirmed)"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Outside Dhaka Delivery Fee</span>
                        <input
                          type="number"
                          value={settings.deliveryFeeOutsideDhaka != null ? settings.deliveryFeeOutsideDhaka : ''}
                          onChange={(e) => updateSettings({
                            deliveryFeeOutsideDhaka: e.target.value === '' ? null : parseInt(e.target.value) || 0
                          })}
                          placeholder="e.g. 150 (Empty = At actual)"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Installation Base Fee / Device</span>
                        <input
                          type="number"
                          value={settings.installationBaseFee != null ? settings.installationBaseFee : ''}
                          onChange={(e) => updateSettings({
                            installationBaseFee: e.target.value === '' ? null : parseInt(e.target.value) || 0
                          })}
                          placeholder="e.g. 500 (Empty = Quoted on survey)"
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Policy Documents Configuration */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[#F15A24] font-bold block uppercase tracking-wider text-xs">
                      Official Policy Text Documents
                    </span>
                    <div className="space-y-3">
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Warranty Policy Document</span>
                        <textarea
                          rows={3}
                          value={settings.warrantyPolicyText || ''}
                          onChange={(e) => updateSettings({ warrantyPolicyText: e.target.value })}
                          placeholder="Custom warranty terms, durations, and claim instructions..."
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Return & Refund Policy Document</span>
                        <textarea
                          rows={3}
                          value={settings.returnPolicyText || ''}
                          onChange={(e) => updateSettings({ returnPolicyText: e.target.value })}
                          placeholder="Official return windows, conditions, and refund turnaround..."
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Terms & Conditions Document</span>
                        <textarea
                          rows={3}
                          value={settings.termsPolicyText || ''}
                          onChange={(e) => updateSettings({ termsPolicyText: e.target.value })}
                          placeholder="Official commercial terms, orders, and legal terms..."
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block mb-1">Privacy Policy Document</span>
                        <textarea
                          rows={3}
                          value={settings.privacyPolicyText || ''}
                          onChange={(e) => updateSettings({ privacyPolicyText: e.target.value })}
                          placeholder="Customer information protection and privacy terms..."
                          className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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

                <div className="pt-4 border-t border-slate-200 flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => { setResearchResult(null); setManualReviewConfirmed(false); }}>
                    Discard Research
                  </Button>
                  <Button
                    size="md"
                    onClick={handleSaveReviewedProduct}
                    disabled={!manualReviewConfirmed}
                    className={!manualReviewConfirmed ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    <span>Approve & Save to Catalog</span>
                  </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Badge Pill (Optional)</label>
                <select
                  value={editingSlide.badge || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, badge: (e.target.value as any) || undefined })}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-800 p-2 rounded-lg"
                >
                  <option value="">No Badge</option>
                  <option value="New">New</option>
                  <option value="Featured">Featured</option>
                  <option value="Hot">Hot</option>
                </select>
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

                {/* Product Image URL with Transparency Check Notice */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Floating Transparent Product Image URL *
                  </label>
                  <input
                    type="text"
                    value={editingSlide.image || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                    placeholder="/images/hero/hikvision-bullet.jpg or transparent PNG/WebP URL"
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
                  />

                  {/* Sample presets shortcut */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, image: '/images/hero/hikvision-bullet.jpg' })}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded font-mono"
                    >
                      Bullet Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, image: '/images/hero/ruijie-wifi6.jpg' })}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded font-mono"
                    >
                      Wi-Fi 6 AP
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, image: '/images/hero/zkteco-biometric.jpg' })}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded font-mono"
                    >
                      Biometric Terminal
                    </button>
                  </div>

                  {/* Transparency Warning */}
                  {editingSlide.image && (editingSlide.image.toLowerCase().endsWith('.jpg') || editingSlide.image.toLowerCase().endsWith('.jpeg')) && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Notice:</strong> JPEG format files lack transparent alpha channels. The Hero Slider uses multiply blend mode to float light backgrounds, but for best visual quality, transparent <strong>.png</strong> or <strong>.webp</strong> is recommended.
                      </div>
                    </div>
                  )}
                </div>

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

                      setEditingSlide({
                        ...editingSlide,
                        productId: prod.id,
                        headline: `${prod.brand} ${prod.name}`,
                        description: prod.shortDescription || '',
                        image: prod.primaryImage || '',
                        priceText: prod.pricing?.regularPrice ? `৳${prod.pricing.regularPrice.toLocaleString()}` : '',
                        buttonText: 'View Product',
                        buttonLink: `/product/${prod.id}`,
                        secondaryText: 'Request quotation',
                        secondaryLink: '/quote',
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

                {/* Overrides Toggle & Fields */}
                <div className="pt-2 border-t border-orange-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Custom Field Overrides (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const hasOverrides = !!editingSlide.overrides;
                        setEditingSlide({
                          ...editingSlide,
                          overrides: hasOverrides ? undefined : { headline: editingSlide.headline, description: editingSlide.description }
                        });
                      }}
                      className="text-xs font-bold text-[#F15A24] hover:underline"
                    >
                      {editingSlide.overrides ? 'Disable Overrides' : '+ Enable Overrides'}
                    </button>
                  </div>

                  {editingSlide.overrides && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
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

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Override Image URL</label>
                        <input
                          type="text"
                          value={editingSlide.overrides.image || ''}
                          onChange={(e) => setEditingSlide({
                            ...editingSlide,
                            overrides: { ...editingSlide.overrides, image: e.target.value }
                          })}
                          placeholder="Custom transparent image URL"
                          className="w-full bg-slate-50 border border-slate-300 p-2 rounded"
                        />
                      </div>
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
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Live Storefront Preview
              </span>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                {/* Subtle dot pattern */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.05]"
                  style={{
                    backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />
                {/* Radial Glow */}
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-[#F15A24]/[0.08] rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left Content */}
                  <div className="space-y-3 max-w-md">
                    {editingSlide.badge && (
                      <span className="inline-block bg-[#F15A24] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                        {editingSlide.badge}
                      </span>
                    )}
                    <h3 className="text-lg font-black text-[#111827] leading-tight">
                      {editingSlide.overrides?.headline || editingSlide.headline || 'Product Headline'}
                    </h3>
                    <p className="text-xs text-[#4B5563] line-clamp-2">
                      {editingSlide.overrides?.description || editingSlide.description || 'Short product description explaining key benefits and technical capability.'}
                    </p>

                    {/* Highlight Chips */}
                    {editingSlide.highlights && editingSlide.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {editingSlide.highlights.slice(0, 4).map((chip, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[10px] flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24]" />
                            <strong className="text-[#111827]">{chip.value}</strong>
                            <span className="text-[#6B7280]">{chip.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <button type="button" className="bg-[#F15A24] text-white font-bold text-xs px-4 py-2 rounded-xl">
                        {editingSlide.buttonText || 'View Product'}
                      </button>
                      {editingSlide.priceText && (
                        <span className="text-xs font-black text-[#111827]">{editingSlide.priceText}</span>
                      )}
                    </div>
                  </div>

                  {/* Right Image */}
                  <div className="relative w-48 h-40 flex items-center justify-center">
                    {/* Ground Shadow */}
                    <div className="absolute -bottom-2 w-32 h-4 bg-black/15 rounded-full blur-md" />
                    {editingSlide.image ? (
                      <img
                        src={editingSlide.image}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain relative z-10 drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)] mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-slate-300 text-xs text-center">
                        <ImageIcon className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
              <textarea
                rows={2}
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                placeholder="Summary for catalog category banner and SEO"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
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
        <Modal
          isOpen={packageModalOpen}
          onClose={() => {
            setPackageModalOpen(false);
            setEditingPackage(null);
          }}
          title={editingPackage.id ? 'Edit Turnkey CCTV Package' : 'Create CCTV Package'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-slate-900 max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Package Name *</label>
              <input
                type="text"
                value={editingPackage.name || ''}
                onChange={(e) => setEditingPackage({
                  ...editingPackage,
                  name: e.target.value,
                  slug: editingPackage.id ? editingPackage.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                })}
                placeholder="e.g. 2MP Turbo HD Full Turnkey Package"
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Camera Resolution *</label>
                <input
                  type="text"
                  value={editingPackage.cameraResolution || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, cameraResolution: e.target.value })}
                  placeholder="e.g. 2MP (1080p)"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Base Price (BDT) *</label>
                <input
                  type="number"
                  value={editingPackage.basePrice || 15000}
                  onChange={(e) => setEditingPackage({ ...editingPackage, basePrice: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-bold text-[#F15A24]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Default Camera Model</label>
                <input
                  type="text"
                  value={editingPackage.cameraModel || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, cameraModel: e.target.value })}
                  placeholder="e.g. Hikvision DS-2CE16D0T-IRPF"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Default DVR Unit</label>
                <input
                  type="text"
                  value={editingPackage.dvrModel || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, dvrModel: e.target.value })}
                  placeholder="e.g. Hikvision DS-7104HQHI-K1"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Package Description</label>
              <textarea
                rows={2}
                value={editingPackage.description || ''}
                onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                placeholder="Turnkey description explaining target home / office use..."
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Turnkey Inclusions (one per line)</label>
              <textarea
                rows={4}
                value={(editingPackage.inclusions || []).join('\n')}
                onChange={(e) => setEditingPackage({
                  ...editingPackage,
                  inclusions: e.target.value.split('\n').filter(Boolean)
                })}
                placeholder="Hikvision Cameras&#10;Turbo HD DVR&#10;1TB Surveillance HDD&#10;Cat6 Cable..."
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPackageModalOpen(false);
                  setEditingPackage(null);
                }}
              >
                Cancel
              </Button>
              <Button size="md" onClick={handleSavePackage}>
                <Check className="w-4 h-4 mr-1.5" />
                <span>Save Package</span>
              </Button>
            </div>
          </div>
        </Modal>
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
          onSaveSuccess={() => {
            productService.getProducts({ limit: 100 }).then(res => setProducts(res.items));
          }}
        />
      )}

    </div>
  );
};

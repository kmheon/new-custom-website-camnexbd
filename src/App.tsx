import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SEO } from './components/common/SEO';
import { Button } from './components/common/UI';
import { useCartStore, useSettingsStore } from './store';

// Lazy-loaded routes for code splitting and performance optimization
const PackagesPage = lazy(() => import('./pages/PackagesPage').then(m => ({ default: m.PackagesPage })));
const PackageBuilderPage = lazy(() => import('./pages/PackageBuilderPage').then(m => ({ default: m.PackageBuilderPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const CartAndCheckoutPage = lazy(() => import('./pages/CartAndCheckoutPage').then(m => ({ default: m.CartAndCheckoutPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const QuoteAndServicesPage = lazy(() => import('./pages/QuoteAndServicesPage').then(m => ({ default: m.QuoteAndServicesPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const CustomerAccountPage = lazy(() => import('./pages/CustomerAccountPage').then(m => ({ default: m.CustomerAccountPage })));
const ContentPages = lazy(() => import('./pages/ContentPages').then(m => ({ default: m.ContentPages })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));
const WhyChooseUsPage = lazy(() => import('./pages/CompanyProfilePage').then(m => ({ default: m.WhyChooseUsPage })));
const CertificationsCompliancePage = lazy(() => import('./pages/CompanyProfilePage').then(m => ({ default: m.CertificationsCompliancePage })));
const BrandsPage = lazy(() => import('./pages/BrandsPage').then(m => ({ default: m.BrandsPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center py-16">
    <div className="text-center space-y-3">
      <div className="w-10 h-10 border-4 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto"></div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading...</div>
    </div>
  </div>
);

const NotFoundPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => (
  <div className="bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center py-16 px-4">
    <SEO title="404 - Page Not Found" description="The requested page could not be found." noIndex={true} />
    <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#F15A24] flex items-center justify-center mx-auto text-2xl font-black font-mono">
        404
      </div>
      <h1 className="text-2xl font-black text-[#111827] font-heading">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        The requested URL was not found on our server. The hardware model or page may have been moved or removed.
      </p>
      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="md" onClick={() => onNavigate('home')}>
          Return to Homepage
        </Button>
        <Button variant="outline" size="md" onClick={() => onNavigate('catalog')}>
          Browse Catalog
        </Button>
      </div>
    </div>
  </div>
);

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);

  const loadCart = useCartStore((s) => s.loadCart);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadCart();
    loadSettings();

    // Parse initial URL
    const parseUrl = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setCurrentRoute('home');
        setRouteParam(undefined);
      } else if (path === '/catalog') {
        setCurrentRoute('catalog');
        setRouteParam(undefined);
      } else if (path === '/brands' || path === '/brands/') {
        setCurrentRoute('brands');
        setRouteParam(undefined);
      } else if (path.startsWith('/category/')) {
        setCurrentRoute('category');
        setRouteParam(path.replace('/category/', ''));
      } else if (path.startsWith('/brand/')) {
        setCurrentRoute('brand');
        setRouteParam(path.replace('/brand/', ''));
      } else if (path.startsWith('/brands/')) {
        setCurrentRoute('brand');
        setRouteParam(path.replace('/brands/', ''));
      } else if (path.startsWith('/product/')) {
        setCurrentRoute('product');
        setRouteParam(path.replace('/product/', ''));
      } else if (path === '/compare') {
        setCurrentRoute('compare');
      } else if (path.startsWith('/packages')) {
        setCurrentRoute('packages');
        const parts = path.split('/');
        setRouteParam(parts[2]);
      } else if (path.startsWith('/package-builder') || path.startsWith('/package-maker')) {
        setCurrentRoute('packages');
        setRouteParam('custom');
      } else if (path === '/cart') {
        setCurrentRoute('cart');
      } else if (path === '/checkout') {
        setCurrentRoute('checkout');
      } else if (path.startsWith('/tracking') || path.startsWith('/order-tracking')) {
        setCurrentRoute('tracking');
        const parts = path.split('/');
        setRouteParam(parts[2]);
      } else if (path === '/quote') {
        setCurrentRoute('quote');
      } else if (path === '/wishlist') {
        setCurrentRoute('wishlist');
      } else if (path === '/services') {
        setCurrentRoute('services');
      } else if (path.startsWith('/search')) {
        setCurrentRoute('search');
        const params = new URLSearchParams(window.location.search);
        setRouteParam(params.get('q') || undefined);
      } else if (path === '/solutions' || path.startsWith('/solutions/')) {
        setCurrentRoute('solutions');
        if (path.startsWith('/solutions/')) {
          setRouteParam(path.replace('/solutions/', ''));
        } else {
          setRouteParam(undefined);
        }
      } else if (path === '/projects') {
        setCurrentRoute('projects');
      } else if (path === '/testimonials') {
        setCurrentRoute('testimonials');
      } else if (path === '/faq') {
        setCurrentRoute('faq');
      } else if (path === '/contact' || path === '/support') {
        setCurrentRoute('contact');
      } else if (path === '/certifications') {
        setCurrentRoute('certifications');
        setRouteParam(undefined);
      } else if (path === '/about' || path === '/company-profile' || path.startsWith('/company-profile')) {
        const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
        if (hash === 'certifications') {
          setCurrentRoute('certifications');
          setRouteParam(undefined);
        } else {
          setCurrentRoute('company_profile');
          setRouteParam(hash || undefined);
        }
      } else if (path === '/why-choose-us') {
        setCurrentRoute('why_choose_us');
      } else if (path === '/warranty') {
        setCurrentRoute('warranty');
      } else if (path === '/terms') {
        setCurrentRoute('terms');
      } else if (path === '/privacy') {
        setCurrentRoute('privacy');
      } else if (path === '/refund') {
        setCurrentRoute('refund');
      } else if (path === '/blog') {
        setCurrentRoute('blog');
      } else if (path.startsWith('/blog/')) {
        setCurrentRoute('blog_post');
        setRouteParam(path.replace('/blog/', ''));
      } else if (path.startsWith('/admin')) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('404');
      }
    };

    parseUrl();

    const handlePopState = () => parseUrl();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadCart, loadSettings]);

  const navigate = (route: string, param?: string) => {
    if (route === 'company_profile' && param === 'certifications') {
      setCurrentRoute('certifications');
      setRouteParam(undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState({}, '', '/certifications');
      return;
    }

    setCurrentRoute(route);
    setRouteParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let newUrl = '/';
    if (route === 'home') newUrl = '/';
    else if (route === 'catalog') newUrl = '/catalog';
    else if (route === 'brands') newUrl = '/brands';
    else if (route === 'category' && param) newUrl = `/category/${param}`;
    else if (route === 'brand' && param) newUrl = `/brand/${param}`;
    else if (route === 'product' && param) newUrl = `/product/${param}`;
    else if (route === 'compare') newUrl = '/compare';
    else if (route === 'packages') newUrl = param ? `/packages/${param}` : '/packages';
    else if (route === 'package_builder' || route === 'package-builder') newUrl = param ? `/packages/${param}` : '/package-builder';
    else if (route === 'cart') newUrl = '/cart';
    else if (route === 'checkout') newUrl = '/checkout';
    else if (route === 'tracking') newUrl = param ? `/tracking/${param}` : '/tracking';
    else if (route === 'quote') newUrl = '/quote';
    else if (route === 'wishlist') newUrl = '/wishlist';
    else if (route === 'services') newUrl = '/services';
    else if (route === 'search') newUrl = `/search?q=${encodeURIComponent(param || '')}`;
    else if (route === 'account') newUrl = '/account';
    else if (route === 'solutions') newUrl = param ? `/solutions/${param}` : '/solutions';
    else if (route === 'projects') newUrl = '/projects';
    else if (route === 'testimonials') newUrl = '/testimonials';
    else if (route === 'faq') newUrl = '/faq';
    else if (route === 'contact') newUrl = '/contact';
    else if (route === 'company_profile') newUrl = param ? `/company-profile#${param}` : '/company-profile';
    else if (route === 'why_choose_us') newUrl = '/why-choose-us';
    else if (route === 'certifications') newUrl = '/certifications';
    else if (route === 'about') newUrl = '/company-profile';
    else if (route === 'warranty') newUrl = '/warranty';
    else if (route === 'terms') newUrl = '/terms';
    else if (route === 'privacy') newUrl = '/privacy';
    else if (route === 'refund') newUrl = '/refund';
    else if (route === 'blog') newUrl = '/blog';
    else if (route === 'blog_post' && param) newUrl = `/blog/${param}`;
    else if (route === 'admin') newUrl = '/admin';

    window.history.pushState({}, '', newUrl);
  };

  const isAdmin = currentRoute === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#111827] font-sans antialiased selection:bg-[#F15A24] selection:text-white">
      {!isAdmin && <Header onNavigate={navigate} currentRoute={currentRoute} />}

      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {currentRoute === 'home' && <HomePage onNavigate={navigate} />}
          {currentRoute === 'catalog' && <CatalogPage onNavigate={navigate} />}
          {currentRoute === 'brands' && <BrandsPage onNavigate={navigate} />}
          {currentRoute === 'category' && <CatalogPage onNavigate={navigate} categorySlug={routeParam} />}
          {currentRoute === 'brand' && <CatalogPage onNavigate={navigate} brandSlug={routeParam} />}
          {currentRoute === 'product' && routeParam && <ProductDetailPage productId={routeParam} onNavigate={navigate} />}
          {currentRoute === 'compare' && <ComparePage onNavigate={navigate} />}
          {currentRoute === 'packages' && (
            routeParam ? (
              <PackageBuilderPage packageSlug={routeParam} onNavigate={navigate} />
            ) : (
              <PackagesPage onNavigate={navigate} />
            )
          )}
          {currentRoute === 'cart' && <CartAndCheckoutPage onNavigate={navigate} initialStep="cart" />}
          {currentRoute === 'checkout' && <CartAndCheckoutPage onNavigate={navigate} initialStep="checkout" />}
          {currentRoute === 'tracking' && <OrderTrackingPage initialOrderNumber={routeParam} onNavigate={navigate} />}
          {currentRoute === 'quote' && <QuoteAndServicesPage onNavigate={navigate} defaultService="site_survey" />}
          {currentRoute === 'wishlist' && <WishlistPage onNavigate={navigate} />}
          {currentRoute === 'services' && <ServicesPage onNavigate={navigate} />}
          {currentRoute === 'search' && <SearchPage initialQuery={routeParam} onNavigate={navigate} />}
          {currentRoute === 'account' && <CustomerAccountPage onNavigate={navigate} />}
          {currentRoute === 'solutions' && <ContentPages type="solutions" param={routeParam} onNavigate={navigate} />}
          {currentRoute === 'projects' && <ContentPages type="projects" onNavigate={navigate} />}
          {currentRoute === 'testimonials' && <ContentPages type="testimonials" onNavigate={navigate} />}
          {currentRoute === 'faq' && <ContentPages type="faq" onNavigate={navigate} />}
          {currentRoute === 'contact' && <ContentPages type="contact" onNavigate={navigate} />}
          {currentRoute === 'company_profile' && <CompanyProfilePage initialTab={routeParam} onNavigate={navigate} />}
          {currentRoute === 'why_choose_us' && <WhyChooseUsPage onNavigate={navigate} />}
          {currentRoute === 'certifications' && <CertificationsCompliancePage onNavigate={navigate} />}
          {currentRoute === 'about' && <CompanyProfilePage initialTab={routeParam} onNavigate={navigate} />}
          {currentRoute === 'warranty' && <ContentPages type="warranty" onNavigate={navigate} />}
          {currentRoute === 'terms' && <ContentPages type="terms" onNavigate={navigate} />}
          {currentRoute === 'privacy' && <ContentPages type="privacy" onNavigate={navigate} />}
          {currentRoute === 'refund' && <ContentPages type="refund" onNavigate={navigate} />}
          {currentRoute === 'blog' && <ContentPages type="blog" onNavigate={navigate} />}
          {currentRoute === 'blog_post' && <ContentPages type="blog_post" param={routeParam} onNavigate={navigate} />}
          {currentRoute === 'admin' && <AdminDashboard onNavigate={navigate} />}
          {currentRoute === '404' && <NotFoundPage onNavigate={navigate} />}
        </Suspense>
      </main>

      {!isAdmin && <Footer onNavigate={navigate} />}
    </div>
  );
}

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Ensure ChevronDown is imported
if (!code.includes('ChevronDown')) {
  code = code.replace(/ChevronRight,/, 'ChevronRight, ChevronDown,');
}

// 2. Find insertion point for state inside AdminDashboard component
const stateHookMarker = 'const [activeModule, setActiveModule] = useState<string>(() => {';
if (!code.includes(stateHookMarker)) {
  console.error('Could not find activeModule state hook marker');
  process.exit(1);
}

const sidebarStateCode = `
  // Sidebar Search, Navigation Hubs & State
  const [sidebarSearch, setSidebarSearch] = useState('');
  const sidebarSearchRef = useRef<HTMLInputElement>(null);
  const [collapsedHubs, setCollapsedHubs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('camnex_admin_collapsed_hubs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleHub = useCallback((hubId: string) => {
    setCollapsedHubs((prev) => {
      const next = { ...prev, [hubId]: !prev[hubId] };
      try {
        localStorage.setItem('camnex_admin_collapsed_hubs', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  const handleSelectModule = useCallback((id: string) => {
    setActiveModule(id);
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
`;

// Insert sidebar state right after activeModule definition
const activeModuleEndIdx = code.indexOf('});\r\n', code.indexOf(stateHookMarker));
const activeModuleEndIdxUnix = code.indexOf('});\n', code.indexOf(stateHookMarker));
const actualEndIdx = (activeModuleEndIdx !== -1) ? activeModuleEndIdx + 4 : activeModuleEndIdxUnix + 3;

code = code.slice(0, actualEndIdx) + sidebarStateCode + code.slice(actualEndIdx);

// 3. Locate the <aside> tag and replace it
const asideStart = code.indexOf('<aside className="w-64');
const asideEnd = code.indexOf('</aside>', asideStart) + '</aside>'.length;

if (asideStart === -1 || asideEnd === -1) {
  console.error('Could not locate <aside block');
  process.exit(1);
}

const newSidebarJsx = `{/* Upgraded 6-Hub Enterprise Navigation Sidebar */}
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
              <button
                type="button"
                data-module="dashboard"
                onClick={() => handleSelectModule('dashboard')}
                className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all \${
                  activeModule === 'dashboard'
                    ? 'bg-[#F15A24] text-white shadow-lg shadow-[#F15A24]/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }\`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                  <span>Dashboard Overview</span>
                </div>
                {activeModule === 'dashboard' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                )}
              </button>
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
                const isAutoExpanded = Boolean(sidebarSearch) || hub.items.some((i) => i.id === activeModule);
                const isCollapsed = !isAutoExpanded && Boolean(collapsedHubs[hub.id]);

                return (
                  <div key={hub.id} className="space-y-1">
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
                          <span className={\`px-1.5 py-0.5 rounded-full text-[9px] font-bold \${hub.badgeColor || 'bg-slate-800 text-slate-400'}\`}>
                            {hub.badge}
                          </span>
                        )}
                        <ChevronDown
                          className={\`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 \${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }\`}
                        />
                      </div>
                    </button>

                    {/* Hub Items */}
                    {!isCollapsed && (
                      <div className="space-y-0.5 pl-1.5">
                        {hub.items.map((item) => {
                          const isActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              data-module={item.id}
                              onClick={() => handleSelectModule(item.id)}
                              className={\`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all \${
                                isActive
                                  ? 'bg-[#F15A24] text-white font-bold shadow-md shadow-[#F15A24]/20'
                                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                              }\`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {item.icon}
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span
                                  className={\`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 \${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : (item.badgeColor || 'bg-slate-800 text-slate-300')
                                  }\`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
        </aside>`;

code = code.slice(0, asideStart) + newSidebarJsx + code.slice(asideEnd);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully upgraded AdminDashboard.tsx sidebar to 6-Hub architecture!');


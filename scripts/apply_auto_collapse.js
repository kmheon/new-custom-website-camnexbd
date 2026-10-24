const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Helper function mapping modules to their parent hub
const hubMapCode = `
  const getHubForModule = (modId: string): string | null => {
    if (['orders', 'quotes', 'customers'].includes(modId)) return 'operations';
    if (['products', 'categories', 'templates', 'packages', 'coupons'].includes(modId)) return 'commerce';
    if (['heroslides', 'sections', 'scenarios', 'services', 'projects', 'testimonials'].includes(modId)) return 'storefront';
    if (['pages', 'company', 'blog', 'faqs', 'glossary'].includes(modId)) return 'content';
    if (['media', 'documents', 'brands'].includes(modId)) return 'media';
    if (['integrations', 'systemlogs', 'redirects', 'settings'].includes(modId)) return 'system';
    return null;
  };
`;

// Replace old sidebar state
const oldSidebarStateStart = code.indexOf('// Sidebar Search, Navigation Hubs & State');
const oldSidebarStateEnd = code.indexOf('// Keyboard shortcut: Ctrl+K or Cmd+K to jump to sidebar search', oldSidebarStateStart);

if (oldSidebarStateStart === -1 || oldSidebarStateEnd === -1) {
  console.error('Could not find sidebar state section');
  process.exit(1);
}

const newSidebarState = `// Sidebar Search, Navigation Hubs & State (Accordion Auto-Collapse)
  const [sidebarSearch, setSidebarSearch] = useState('');
  const sidebarSearchRef = useRef<HTMLInputElement>(null);

  ${hubMapCode.trim()}

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
`;

code = code.slice(0, oldSidebarStateStart) + newSidebarState + code.slice(oldSidebarStateEnd);

// Replace the hub map rendering logic in the sidebar
code = code.replace(
  /const isAutoExpanded = Boolean\(sidebarSearch\) \|\| hub\.items\.some\(\(i\) => i\.id === activeModule\);\s*const isCollapsed = !isAutoExpanded && Boolean\(collapsedHubs\[hub\.id\]\);/g,
  `const isExpanded = Boolean(sidebarSearch) || expandedHubId === hub.id;
                const isCollapsed = !isExpanded;`
);

// Also update the collapse condition on items container
code = code.replace(/!isCollapsed && \(/g, 'isExpanded && (');

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully updated AdminDashboard.tsx to Accordion Auto-Collapse mode!');

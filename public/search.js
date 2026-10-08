// CamneX Unified Real-Time Header Search Component
function headerSearch() {
  return {
    query: '',
    results: { products: [], categories: [], services: [], packages: [] },
    isLoading: false,
    isOpen: false,
    hasSearched: false,
    init() {
      window.addEventListener('keydown', (e) => {
        if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault();
          const el = this.$refs.desktopSearchInput || this.$refs.mobileSearchInput;
          if (el) {
            el.focus();
            this.isOpen = true;
          }
        }
      });
    },
    async doSearch() {
      const q = this.query.trim();
      if (!q) {
        this.results = { products: [], categories: [], services: [], packages: [] };
        this.isOpen = false;
        this.hasSearched = false;
        return;
      }
      this.isLoading = true;
      this.isOpen = true;
      this.hasSearched = true;
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        if (res.ok) {
          this.results = await res.json();
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        this.isLoading = false;
      }
    },
    clearSearch() {
      this.query = '';
      this.results = { products: [], categories: [], services: [], packages: [] };
      this.isOpen = false;
      this.hasSearched = false;
    },
    submitSearch() {
      if (this.query.trim()) {
        window.location.href = '/catalog.html?search=' + encodeURIComponent(this.query.trim());
      }
    },
    get totalMatches() {
      return (this.results.products?.length || 0) +
             (this.results.categories?.length || 0) +
             (this.results.services?.length || 0) +
             (this.results.packages?.length || 0);
    }
  };
}

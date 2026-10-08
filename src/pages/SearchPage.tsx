import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, ArrowRight } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { productService } from '../services';
import { Product } from '../types';
import { useCartStore } from '../store';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (route: string, param?: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const res = await productService.getProducts({ search: q.trim(), limit: 30 });
      setResults(res.items);
      setTotal(res.total);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title={`Search results for "${query}" | CamneX Bangladesh`}
        description={`Hardware search results matching ${query}.`}
        noIndex={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Search Results' }
          ]}
        />

        <div className="my-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
            Hardware Search: "{query}"
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Found {total} verified products matching your query
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-xl mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performSearch(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by model, SKU, switch, camera..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#F15A24]"
            />
            <Button size="md" type="submit" isLoading={isLoading}>
              Search
            </Button>
          </form>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => onNavigate('product', prod.id)}
                    className="h-44 rounded-xl overflow-hidden bg-slate-100 cursor-pointer mb-3 relative"
                  >
                    <img src={prod.primaryImage} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge variant="dark">{prod.brand}</Badge>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-400 mb-1">{prod.modelNumber}</div>
                  <h3
                    onClick={() => onNavigate('product', prod.id)}
                    className="font-bold text-sm text-[#111827] hover:text-[#F15A24] cursor-pointer font-heading line-clamp-1 mb-1"
                  >
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {prod.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-base font-black text-[#F15A24] font-heading">
                    {prod.pricing.regularPrice ? `৳${prod.pricing.regularPrice.toLocaleString()}` : 'Quote'}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('product', prod.id)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Details
                    </button>
                    <Button size="sm" onClick={() => addItemToCart(prod, 1)}>
                      <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">No matching hardware found for "{query}"</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please check your spelling or search for broader keywords like "CCTV", "Dome", "Hikvision", or "Switch".
            </p>
            <Button size="sm" onClick={() => onNavigate('catalog')}>
              Return to Catalog
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

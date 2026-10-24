const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add category and package filter states
const stateMarker = 'const [quoteStatusTab, setQuoteStatusTab] = useState<';
const stateMarkerIdx = code.indexOf(stateMarker);

if (stateMarkerIdx === -1) {
  console.error('Could not find quoteStatusTab marker in AdminDashboard.tsx');
  process.exit(1);
}

const stateEndLineIdx = code.indexOf('\n', stateMarkerIdx);
const commerceStates = `
  // Commerce & Catalog Hub States
  const [productPipelineTab, setProductPipelineTab] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock' | 'draft' | 'archived'>('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryFilterTab, setCategoryFilterTab] = useState<'all' | 'homepage' | 'with_subcats'>('all');
  const [packageFilterTab, setPackageFilterTab] = useState<string>('all');
`;

code = code.slice(0, stateEndLineIdx + 1) + commerceStates + code.slice(stateEndLineIdx + 1);

// 2. Upgrade Products Module: Replace lines between `{activeModule === 'products' && (` and `{activeModule === 'categories' && (`
const productsMarker = "{activeModule === 'products' && (";
const categoriesMarker = "{activeModule === 'categories' && (";

const prodStartIdx = code.indexOf(productsMarker);
const catStartIdx = code.indexOf(categoriesMarker);

if (prodStartIdx === -1 || catStartIdx === -1) {
  console.error('Could not find products / categories blocks');
  process.exit(1);
}

const newProductsJsx = `{activeModule === 'products' && (() => {
            // Pipeline Tab Filter calculations
            const activeCount = operationalProducts.filter(p => p.status === 'active' && p.websiteVisible !== false).length;
            const lowStockCount = operationalProducts.filter(p => (p.inventory?.available ?? 0) > 0 && (p.inventory?.available ?? 0) <= 5).length;
            const outOfStockCount = operationalProducts.filter(p => (p.inventory?.available ?? 0) <= 0 || p.inventory?.status === 'out_of_stock').length;
            const draftCount = operationalProducts.filter(p => p.status === 'draft' || p.websiteVisible === false).length;
            const archivedCount = operationalProducts.filter(p => p.status === 'archived' || (p as any).is_archived).length;

            return (
              <div className="space-y-6">
                {/* Header & Main Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#F15A24]" />
                      <span>Security Hardware Catalog & Stock Control</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Total {displayedProductTotal} models published, in inventory, or draft status.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkToolsModalOpen(true)}
                      className="border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
                    >
                      <SlidersHorizontal className="w-4 h-4 mr-1.5 text-orange-400" />
                      <span>Bulk Tools {selectedProductIds.length > 0 ? \`(\${selectedProductIds.length})\` : ''}</span>
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

                {/* Catalog Health & Inventory Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Catalog</div>
                    <div className="text-2xl font-black text-white mt-1">{displayedProductTotal}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{brands.length} authorized hardware brands</div>
                  </div>

                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active & Published</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
                    <div className="text-[11px] text-emerald-500/80 mt-0.5">Visible on live storefront</div>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Low Stock Alert</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{lowStockCount}</div>
                    <div className="text-[11px] text-amber-500/80 mt-0.5">1 to 5 units remaining</div>
                  </div>

                  <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4">
                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Out of Stock</span>
                    </div>
                    <div className="text-2xl font-black text-rose-400 mt-1">{outOfStockCount}</div>
                    <div className="text-[11px] text-rose-500/80 mt-0.5">Requires inventory replenishment</div>
                  </div>
                </div>

                {/* Pipeline Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
                  {[
                    { id: 'all', label: 'All Models', count: displayedProductTotal },
                    { id: 'active', label: 'Active (Published)', count: activeCount },
                    { id: 'low_stock', label: 'Low Stock (<5)', count: lowStockCount, alert: lowStockCount > 0 },
                    { id: 'out_of_stock', label: 'Out of Stock (0)', count: outOfStockCount, alert: outOfStockCount > 0 },
                    { id: 'draft', label: 'Drafts / Hidden', count: draftCount },
                    { id: 'archived', label: 'Archived', count: archivedCount }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setProductPipelineTab(tab.id as any);
                        setProductPage(1);
                        if (tab.id === 'all') {
                          setProductStatusFilter('');
                          setProductStockFilter('');
                        } else if (tab.id === 'active') {
                          setProductStatusFilter('active');
                          setProductStockFilter('');
                        } else if (tab.id === 'low_stock') {
                          setProductStatusFilter('');
                          setProductStockFilter('low_stock');
                        } else if (tab.id === 'out_of_stock') {
                          setProductStatusFilter('');
                          setProductStockFilter('out_of_stock');
                        } else if (tab.id === 'draft') {
                          setProductStatusFilter('draft');
                          setProductStockFilter('');
                        } else if (tab.id === 'archived') {
                          setProductStatusFilter('archived');
                          setProductStockFilter('');
                        }
                      }}
                      className={\`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 \${
                        productPipelineTab === tab.id
                          ? 'bg-[#F15A24] text-white shadow-md shadow-[#F15A24]/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span>{tab.label}</span>
                      <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-black \${
                        productPipelineTab === tab.id
                          ? 'bg-white/20 text-white'
                          : tab.alert
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }\`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
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
                        placeholder="Search catalog by model number, SKU, product name, or brand..."
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

                    {(productSearchQuery || productCategoryFilter || productBrandFilter || productStatusFilter || productStockFilter || productPipelineTab !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchQuery('');
                          setProductCategoryFilter('');
                          setProductBrandFilter('');
                          setProductStatusFilter('');
                          setProductStockFilter('');
                          setProductPipelineTab('all');
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
                              <tr key={p.id} className={\`hover:bg-slate-900/40 transition-colors \${isSelected ? 'bg-orange-950/20' : ''}\`}>
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
                                      className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                                      title="Archive Product (Hide from catalog while preserving historical order references)"
                                    >
                                      Archive
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                                    title="Delete Product"
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

                  {/* Pagination Toolbar */}
                  {totalProductPages > 1 && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                      <div>
                        Showing {(validProductPage - 1) * productPageSize + 1} to {Math.min(validProductPage * productPageSize, totalFilteredProducts)} of {totalFilteredProducts} products
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={validProductPage <= 1}
                          onClick={() => setProductPage(p => Math.max(1, p - 1))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                        >
                          Previous
                        </button>
                        <span>Page {validProductPage} of {totalProductPages}</span>
                        <button
                          type="button"
                          disabled={validProductPage >= totalProductPages}
                          onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          `;

code = code.slice(0, prodStartIdx) + newProductsJsx + code.slice(catStartIdx);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully upgraded Commerce & Catalog Hub in AdminDashboard.tsx!');


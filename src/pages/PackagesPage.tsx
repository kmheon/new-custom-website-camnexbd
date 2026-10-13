import React, { useState, useEffect, useMemo } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/UI';
import { PackageFilterBar } from '../components/packages/PackageFilterBar';
import { PackageCard } from '../components/cards/PackageCard';
import { CctvPackageSvg } from '../components/packages/CctvPackageSvg';
import { packageService } from '../services';
import { SecurityPackage, PackageSystemType, PackageSeries } from '../types';
import {
  FilterState,
  filterPackages,
  sortPackages,
  parseFilterQuery,
  buildFilterQuery,
  resolveDependentFilterSelection
} from '../utils/packageFilters';

interface PackagesPageProps {
  onNavigate: (route: string, param?: string) => void;
}

const PAGE_SIZE = 12;

export const PackagesPage: React.FC<PackagesPageProps> = ({ onNavigate }) => {
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [systemTypes, setSystemTypes] = useState<PackageSystemType[]>([]);
  const [seriesList, setSeriesList] = useState<PackageSeries[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize filter state from URL query
  const [filters, setFilters] = useState<FilterState>(() => {
    return parseFilterQuery(window.location.search);
  });

  // Load packages, system types, and series list
  useEffect(() => {
    setLoading(true);
    Promise.all([
      packageService.getPackages(),
      packageService.getPackageSystemTypes().catch(() => []),
      packageService.getPackageSeries().catch(() => [])
    ])
      .then(([pkgs, sys, ser]) => {
        setPackages(pkgs || []);
        setSystemTypes(sys || []);
        setSeriesList(ser || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const parsed = parseFilterQuery(window.location.search, {
          systemTypes,
          seriesList
        });
        setFilters(parsed);
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [systemTypes, seriesList]);

  // Handler for filter changes with URL sync
  const handleFilterChange = (newFilters: FilterState) => {
    // If system type changed, resolve dependent filters
    let resolved = newFilters;
    if (newFilters.systemSlug !== filters.systemSlug) {
      const depResolved = resolveDependentFilterSelection(
        newFilters.systemSlug || 'all',
        newFilters.cameraCount || 'All',
        newFilters.nightViewSlug || 'all',
        packages,
        { systemTypes, seriesList }
      );
      resolved = {
        ...newFilters,
        systemSlug: depResolved.systemSlug,
        cameraCount: depResolved.cameraCount,
        nightViewSlug: depResolved.nightViewSlug,
        page: 1
      };
    }

    setFilters(resolved);

    try {
      const query = buildFilterQuery(resolved);
      const newUrl = window.location.pathname + query + window.location.hash;
      window.history.pushState({}, '', newUrl);
    } catch (_) {}
  };

  // Handler for clearing all filters
  const handleClearFilters = () => {
    const defaultFilters: FilterState = {
      systemSlug: 'all',
      cameraCount: 'All',
      nightViewSlug: 'all',
      minPrice: undefined,
      maxPrice: undefined,
      includeAskForPrice: false,
      storage: undefined,
      channels: undefined,
      cameraType: undefined,
      resolution: undefined,
      audio: undefined,
      brand: undefined,
      tag: undefined,
      installation: undefined,
      sortBy: 'recommended',
      page: 1
    };
    handleFilterChange(defaultFilters);
  };

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    return filterPackages(packages, filters, { systemTypes, seriesList });
  }, [packages, filters, systemTypes, seriesList]);

  const sortedPackages = useMemo(() => {
    return sortPackages(filteredPackages, filters.sortBy || 'recommended');
  }, [filteredPackages, filters.sortBy]);

  // Pagination calculations
  const totalCount = sortedPackages.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, filters.page || 1), totalPages);

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedPackages.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedPackages, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    handleFilterChange({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-6 sm:py-10">
      <SEO
        title="Complete CCTV Packages | CamneX Bangladesh"
        description="Browse all complete security camera sets for homes, offices, and commercial sites. Filter by IP, Analogue, Wi-Fi, camera count, night vision, storage, and price."
        canonicalPath="/packages"
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Security Packages' }
          ]}
        />

        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111827]">
            Complete CCTV Packages
          </h1>
          <p className="text-sm text-[#5B6472]">
            Camera sets with matching recorder, surveillance storage and cables. Sized and configured for Bangladeshi homes and businesses.
          </p>
        </div>

        {/* Full Variant Package Filter Bar */}
        <PackageFilterBar
          variant="full"
          packages={packages}
          systemTypes={systemTypes}
          seriesList={seriesList}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          totalFilteredCount={totalCount}
          totalPackagesCount={packages.length}
        />

        {/* Packages Grid or Empty State */}
        {loading ? (
          <div className="py-20 text-center text-[#5B6472] text-sm">
            Loading CCTV packages...
          </div>
        ) : paginatedPackages.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#EDE8E1] p-10 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F15A24] flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#111827]">
              No packages match these filters
            </h3>
            <p className="text-xs text-[#5B6472] leading-relaxed">
              We couldn't find any packages matching your filter selection. Try adjusting your filter parameters or resetting all filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onNavigate={onNavigate}
                  renderSvgFallback={(p) => <CctvPackageSvg pkg={p} />}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 rounded-xl border border-[#EDE8E1] bg-white text-[13px] font-semibold text-[#111827] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#F15A24] text-white shadow-xs'
                            : 'bg-white border border-[#EDE8E1] text-[#111827] hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 rounded-xl border border-[#EDE8E1] bg-white text-[13px] font-semibold text-[#111827] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


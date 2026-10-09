export * from './types/index';

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

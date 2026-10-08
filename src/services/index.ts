import {
  MockProductService,
  MockCategoryService,
  MockBrandService,
  MockSpecTemplateService,
  MockPackageService,
  MockCartService,
  MockOrderService,
  MockQuoteService,
  MockCmsService,
  MockProductResearchService
} from './mockAdapter';
import {
  RestProductService,
  RestCategoryService,
  RestBrandService,
  RestSpecTemplateService,
  RestPackageService,
  RestCartService,
  RestOrderService,
  RestQuoteService,
  RestCmsService,
  RestProductResearchService,
  RestCustomerService,
  RestMediaService
} from './restAdapter';
import {
  IProductService,
  ICategoryService,
  IBrandService,
  ISpecTemplateService,
  IPackageService,
  ICartService,
  IOrderService,
  IQuoteService,
  ICmsService,
  IProductResearchService
} from '../api/contracts';

// The application defaults to the real REST backend + SQLite single source of truth.
// Offline mock adapter is strictly an optional offline development switch.
const isOfflineMock = typeof window !== 'undefined' && (
  window.localStorage?.getItem('CAMNEX_DEV_OFFLINE_MOCK') === 'true' ||
  (window as any).__CAMNEX_OFFLINE_MOCK__ === true
);

export const productService: IProductService = isOfflineMock ? new MockProductService() : new RestProductService();
export const categoryService: ICategoryService = isOfflineMock ? new MockCategoryService() : new RestCategoryService();
export const brandService: IBrandService = isOfflineMock ? new MockBrandService() : new RestBrandService();
export const specTemplateService: ISpecTemplateService = isOfflineMock ? new MockSpecTemplateService() : new RestSpecTemplateService();
export const packageService: IPackageService = isOfflineMock ? new MockPackageService() : new RestPackageService();
export const cartService: ICartService = isOfflineMock ? new MockCartService() : new RestCartService();
export const orderService: IOrderService = isOfflineMock ? new MockOrderService() : new RestOrderService();
export const quoteService: IQuoteService = isOfflineMock ? new MockQuoteService() : new RestQuoteService();
export const cmsService: ICmsService = isOfflineMock ? new MockCmsService() : new RestCmsService();
export const productResearchService: IProductResearchService = isOfflineMock ? new MockProductResearchService() : new RestProductResearchService();
export const customerService = new RestCustomerService();
export const mediaService = new RestMediaService();

export { isOfflineMock };

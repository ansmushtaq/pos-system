import { useQuery } from '@tanstack/react-query';
import { getSalesSummary, getTopProducts, getProfitBySeller, getStockValuation, type ReportParams } from '../api/report.api';

export const useSalesSummary = (params: ReportParams = {}) =>
  useQuery({
    queryKey: ['reports', 'sales-summary', params],
    queryFn: () => getSalesSummary(params),
    enabled: !!params.startDate || !!params.endDate,
  });

export const useTopProducts = (params: ReportParams = {}) =>
  useQuery({
    queryKey: ['reports', 'top-products', params],
    queryFn: () => getTopProducts(params),
    enabled: !!params.startDate || !!params.endDate,
  });

export const useProfitBySeller = (params: ReportParams = {}) =>
  useQuery({
    queryKey: ['reports', 'profit-by-seller', params],
    queryFn: () => getProfitBySeller(params),
    enabled: !!params.startDate || !!params.endDate,
  });

export const useStockValuation = () =>
  useQuery({
    queryKey: ['reports', 'stock-valuation'],
    queryFn: () => getStockValuation(),
  });

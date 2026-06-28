import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductPrice,
  deleteProduct,
  getPriceHistory,
  type ProductListParams,
  type CreateProductPayload,
  type UpdateProductPayload,
  type UpdatePricePayload,
} from '../api/product.api';

export const useProducts = (params: ProductListParams = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });

export const useProduct = (id: number) =>
  useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductPayload }) =>
      updateProduct(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProductPrice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePricePayload }) =>
      updateProductPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const usePriceHistory = (productId: number) =>
  useQuery({
    queryKey: ['products', productId, 'price-history'],
    queryFn: () => getPriceHistory(productId),
    enabled: !!productId,
  });

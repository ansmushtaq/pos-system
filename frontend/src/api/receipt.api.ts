import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types/api';

export interface ReceiptItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface ReceiptData {
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  logoUrl: string | null;
  receiptHeader: string | null;
  receiptFooter: string;
  currencySymbol: string;
  invoiceNumber: string;
  date: string;
  time: string;
  cashierName: string;
  customerName: string;
  items: ReceiptItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountTendered: number;
  changeGiven: number;
  amountOnCredit: number;
  totalProfit: number | null;
}

export const getReceipt = async (saleId: number): Promise<ReceiptData> => {
  const { data } = await axiosInstance.get<ApiResponse<ReceiptData>>(`/sales/${saleId}/receipt`);
  return data.data!;
};

export const printReceipt = async (saleId: number, format: 'escpos' | 'pdf' = 'escpos'): Promise<Blob> => {
  const response = await axiosInstance.get(`/sales/${saleId}/receipt/print`, {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
};

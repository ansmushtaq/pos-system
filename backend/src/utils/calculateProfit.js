export { calculateCostPrice } from '../services/pricing.service.js';

export const calculateProfitAmount = (unitPrice, costPrice, discount, quantity) => {
  return (unitPrice - costPrice - discount) * quantity;
};

export const calculateProfitMarginPercent = (salePrice, costPrice) => {
  if (salePrice === 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
};

export const formatCurrency = (amount: number, currencySymbol = 'Rs.'): string => {
  if (typeof amount !== 'number' || !isFinite(amount)) return `${currencySymbol} 0.00`;
  return `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

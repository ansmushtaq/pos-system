/**
 * Profit calculation helpers — pure functions, no DB calls.
 * Follows MASTER_CONTEXT.md Section 10.1 rules:
 *   totalPrice   = (unitPrice - discount) * quantity
 *   profitAmount = (unitPrice - costPrice - discount) * quantity
 */

export const calculateItemProfit = (unitPrice, costPrice, discount, quantity) => {
  return (unitPrice - costPrice - discount) * quantity;
};

export const calculateItemTotal = (unitPrice, discount, quantity) => {
  return (unitPrice - discount) * quantity;
};

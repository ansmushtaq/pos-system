export const calculateChange = (tendered: number, total: number) => ({
  change: tendered >= total ? tendered - total : 0,
  shortfall: tendered < total ? total - tendered : 0,
  isInsufficient: tendered < total,
});

export const calculateSemiCredit = (tendered: number, total: number) => ({
  cashPaid: tendered,
  amountOnCredit: Math.max(0, total - tendered),
});

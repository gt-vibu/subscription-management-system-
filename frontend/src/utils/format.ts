export const ANNUAL_DISCOUNT = 0.85;

export const formatCentsToUsd = (cents: number, decimals: number = 2): string => {
  return (cents / 100).toFixed(decimals);
};

export const calculateAnnualPrice = (monthlyPriceCents: number): number => {
  return monthlyPriceCents * 12 * ANNUAL_DISCOUNT;
};

export const formatMonthlyPrice = (priceCents: number): string => {
  return `$${formatCentsToUsd(priceCents)}/mo`;
};

export const formatAnnualPrice = (monthlyPriceCents: number): string => {
  return `$${formatCentsToUsd(calculateAnnualPrice(monthlyPriceCents))}/yr`;
};

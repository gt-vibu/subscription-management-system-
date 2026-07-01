const ANNUAL_DISCOUNT = 0.85;

const calculateSubscriptionPricing = (planPrice, billingCycle, months = 1) => {
  if (billingCycle === 'ANNUAL') {
    return {
      pricePaid: Math.round(planPrice * 12 * ANNUAL_DISCOUNT),
      endDate: calculateEndDate('ANNUAL', new Date())
    };
  }
  return {
    pricePaid: planPrice * months,
    endDate: calculateEndDate('MONTHLY', new Date(), months)
  };
};

const calculateEndDate = (billingCycle, startDate = new Date(), months = 1) => {
  const date = new Date(startDate);
  if (billingCycle === 'ANNUAL') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setDate(date.getDate() + (30 * months));
  }
  return date;
};

const calculateMrrContribution = (planPrice, billingCycle) => {
  return billingCycle === 'ANNUAL' ? Math.round(planPrice / 12) : planPrice;
};

module.exports = {
  ANNUAL_DISCOUNT,
  calculateSubscriptionPricing,
  calculateEndDate,
  calculateMrrContribution
};

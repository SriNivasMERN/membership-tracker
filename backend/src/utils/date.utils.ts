import dayjs from "dayjs";

// Calculate end date from start date and duration
export const calculateEndDate = (
  startDate: string | Date,
  durationDays: number
): Date => {
  return dayjs(startDate)
    .add(durationDays, "day")
    .toDate();
};

// Derive member status from dates and alert window
export const deriveMemberStatus = (
  startDate: Date,
  endDate: Date,
  expiryAlertDays: number
): "active" | "expiring_soon" | "expired" => {
  const today = dayjs();
  const end = dayjs(endDate);
  const alertThreshold = end.subtract(expiryAlertDays, "day");

  if (today.isAfter(end)) {
    return "expired";
  }

  if (today.isAfter(alertThreshold) || today.isSame(alertThreshold)) {
    return "expiring_soon";
  }

  return "active";
};

// Calculate total paid amount from payments array
export const calculatePaidAmount = (
  payments: { amount: number }[]
): number => {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
};

// Calculate pending amount
export const calculatePendingAmount = (
  finalPrice: number,
  payments: { amount: number }[]
): number => {
  const paid = calculatePaidAmount(payments);
  return finalPrice - paid;
};
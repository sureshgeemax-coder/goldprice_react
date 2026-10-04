const weightPattern = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export function validateWeight(input, minimum, maximum = 1000) {
  const value = String(input ?? '').trim();
  if (!value) return { value: null, error: 'Enter a weight in grams.' };
  if (!weightPattern.test(value)) return { value: null, error: 'Enter a valid decimal weight in grams.' };

  const weight = Number(value);
  if (!Number.isFinite(weight)) return { value: null, error: 'Enter a valid decimal weight in grams.' };
  if (weight < minimum) return { value: null, error: `Minimum weight is ${minimum} g.` };
  if (weight > maximum) return { value: null, error: `Maximum weight is ${maximum} g.` };
  return { value: weight, error: '' };
}

export function parsePercentage(input) {
  const value = String(input ?? '').trim();
  if (!value || !weightPattern.test(value)) return null;
  const percentage = Number(value);
  return Number.isFinite(percentage) && percentage >= 0 ? percentage : null;
}

export function calculateGoldPrice(ratePerGram, weight, makingChargePercent, gstPercent) {
  if (![ratePerGram, weight, makingChargePercent, gstPercent].every(Number.isFinite)) return null;
  if (ratePerGram <= 0 || weight <= 0 || makingChargePercent < 0 || gstPercent < 0) return null;

  const goldValue = ratePerGram * weight;
  const makingCharge = goldValue * makingChargePercent / 100;
  const beforeGst = goldValue + makingCharge;
  const gst = beforeGst * gstPercent / 100;

  return { goldValue, makingCharge, beforeGst, gst, total: beforeGst + gst };
}
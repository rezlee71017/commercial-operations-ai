// Money is stored and calculated as integer cents. Floats are only used for display.
export const toDollars = (cents: number) => cents / 100;
export const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

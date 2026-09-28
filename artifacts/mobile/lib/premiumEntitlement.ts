export const PRO_ENTITLEMENT_IDENTIFIER = "pro";

export function hasProEntitlement(customerInfo: unknown): boolean {
  if (!customerInfo || typeof customerInfo !== "object") return false;
  const entitlements = (customerInfo as { entitlements?: unknown }).entitlements;
  if (!entitlements || typeof entitlements !== "object") return false;
  const active = (entitlements as { active?: unknown }).active;
  return Boolean(
    active &&
      typeof active === "object" &&
      (active as Record<string, unknown>)[PRO_ENTITLEMENT_IDENTIFIER],
  );
}

export function isPurchaseCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const purchaseError = error as { code?: unknown; userCancelled?: unknown };
  return purchaseError.code === "1" || purchaseError.userCancelled === true;
}

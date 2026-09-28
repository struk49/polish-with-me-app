export class BillingOperationInProgressError extends Error {
  constructor() {
    super("A billing operation is already in progress.");
    this.name = "BillingOperationInProgressError";
  }
}

export function createBillingOperationLock(
  onActiveChange: (isActive: boolean) => void = () => {},
) {
  let isActive = false;

  return {
    get isActive() {
      return isActive;
    },

    async run<T>(operation: () => Promise<T>): Promise<T> {
      if (isActive) {
        throw new BillingOperationInProgressError();
      }

      isActive = true;
      onActiveChange(true);

      try {
        return await operation();
      } finally {
        isActive = false;
        onActiveChange(false);
      }
    },
  };
}

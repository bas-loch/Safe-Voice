// Stub — brancher react-native-iap en prod
export const IAPService = {
  async purchase(productId: string): Promise<boolean> {
    console.log('[IAP] purchase stub:', productId);
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  },

  async removeAds(): Promise<boolean> {
    console.log('[IAP] removeAds stub');
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  },

  async restorePurchases(): Promise<string[]> {
    return [];
  },
};

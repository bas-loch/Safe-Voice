// Stub — brancher react-native-google-mobile-ads en prod
export const AdService = {
  async showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  },

  async showInterstitial(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  },

  isAdAvailable(): boolean {
    return true;
  },
};

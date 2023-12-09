export const isMobile = () => {
  if (!window || !window.navigator) return false;
  const mobileDeviceRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileDeviceRegex.test(navigator.userAgent);
};

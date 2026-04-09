export const environment = {
  production: true,
  // In production, Angular is served by nginx which proxies /api → gateway
  // and the gateway is at the same host. Change these to your actual domain.
  apiUrl: '/api',
  hubUrl: '/hubs',
  // Replace with your actual Razorpay live key before deploying to production.
  // Never commit real keys to source control — use environment variables or CI/CD secrets.
  razorpayKeyId: 'rzp_live_REPLACE_WITH_YOUR_KEY'
};

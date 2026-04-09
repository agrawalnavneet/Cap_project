export const environment = {
  production: false,
  apiUrl: 'http://localhost:5010/api',
  // SignalR connects directly to OrderService — bypasses gateway to avoid WebSocket proxy issues
  hubUrl: 'http://localhost:5303/hubs',
  // BUG-3 FIX: Use test placeholder key to match backend config.
  // The backend also uses 'rzp_test_placeholder' → both sides fall through to mock/dev flow.
  // Replace BOTH frontend + backend keys when you have real Razorpay credentials.
  razorpayKeyId: 'rzp_test_placeholder'
};

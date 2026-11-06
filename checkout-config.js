// Public checkout configuration only. NEVER put an API key or bank details here.
// Live checkout uses the separate production licensing service.
window.POCKETDROP_CHECKOUT = Object.freeze({
  enabled: true,
  environment: 'production',
  clientToken: 'live_a4aa5a2623870891b98d7670606',
  priceId: 'pri_01m6rg8vccf8ef8s04fvrqspkh', // USD 15.59, quantity 1, non-recurring.
  licenseEndpoint: 'https://pocketdrop-licenses-live.pocketdrop-licensing.workers.dev'
});

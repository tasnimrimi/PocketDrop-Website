// Public checkout configuration only. NEVER put an API key or bank details here.
// Local sandbox only. Live payments require verification and Pro fulfillment.
window.POCKETDROP_CHECKOUT = Object.freeze({
  enabled: true,
  environment: 'sandbox',
  clientToken: 'test_8d05def1e87081859b80177a995',
  priceId: 'pri_01m6read4swhr50gmg0mrecq8b' // USD 15.59, quantity 1, non-recurring.
});

const dialog = document.querySelector('#pro-dialog');
const checkoutForm = document.querySelector('#checkout-form');
const receiptEmail = document.querySelector('#receipt-email');
const checkoutButton = document.querySelector('#checkout-continue');
const checkoutMessage = document.querySelector('#checkout-message');
const checkoutPreview = document.querySelector('.checkout-preview');
if (window.POCKETDROP_CHECKOUT?.enabled) {
  checkoutPreview.hidden = window.POCKETDROP_CHECKOUT.environment === 'production';
  checkoutPreview.textContent = 'Test checkout · No real charge.';
}
let checkoutLoading = false, checkoutScript, paddleReady = false, dialogGeneration = 0;
function checkoutNotice(text) { checkoutMessage.textContent = text; checkoutMessage.hidden = !text; }
document.querySelector('#pro-button').addEventListener('click', () => {
  checkoutNotice(''); dialog.showModal(); receiptEmail.focus();
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => {
  dialogGeneration++; checkoutForm.reset(); checkoutNotice('');
  checkoutLoading = false; checkoutButton.disabled = false;
  checkoutButton.textContent = 'Continue to card payment ↗';
});
function loadCardCheckout() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => { clearTimeout(timer); script.remove(); checkoutScript = null; reject(new Error('The secure checkout could not load. Check your connection and try again.')); };
    const timer = setTimeout(fail, 15000);
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'; script.async = true;
    script.onerror = fail;
    script.onload = () => { clearTimeout(timer); window.Paddle ? resolve(window.Paddle) : fail(); };
    document.head.append(script);
  });
  return checkoutScript;
}
checkoutForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (checkoutLoading) return;
  receiptEmail.value = receiptEmail.value.trim();
  if (!checkoutForm.reportValidity()) return;
  const config = window.POCKETDROP_CHECKOUT;
  if (!config?.enabled) {
    checkoutNotice('Local preview: card payments are not connected yet. Your email has not been sent and no payment will be taken.'); return;
  }
  const tokenPrefix = config.environment === 'sandbox' ? 'test_' : 'live_';
  if (!['sandbox', 'production'].includes(config.environment) || !config.clientToken?.startsWith(tokenPrefix) || !/^pri_[a-z0-9]{26}$/.test(config.priceId)) {
    checkoutNotice('Checkout is unavailable right now. Please contact support.'); return;
  }
  const email = receiptEmail.value, generation = dialogGeneration;
  checkoutLoading = true; checkoutButton.disabled = true; checkoutButton.textContent = 'Opening secure checkout…'; checkoutNotice('');
  try {
    const paddle = await loadCardCheckout();
    // Closing the email dialog cancels a pending launch. No surprise checkout later.
    if (!dialog.open || generation !== dialogGeneration) return;
    if (!paddleReady) {
      if (config.environment === 'sandbox') paddle.Environment.set('sandbox');
      paddle.Initialize({ token: config.clientToken }); paddleReady = true;
    }
    paddle.Checkout.open({
      items: [{ priceId: config.priceId, quantity: 1 }],
      customer: { email },
      settings: { displayMode: 'overlay', theme: 'light', locale: 'en', allowedPaymentMethods: ['card'], showAddDiscounts: false, allowLogout: true }
    });
    dialog.close();
    // A checkout event/redirect must never grant Pro. Fulfillment must verify
    // the provider's signed payment notification on a private backend.
  } catch (error) {
    if (dialog.open && generation === dialogGeneration) checkoutNotice(error.message || 'Checkout could not open. Please try again.');
  } finally {
    if (generation === dialogGeneration) {
      checkoutLoading = false; checkoutButton.disabled = false; checkoutButton.textContent = 'Continue to card payment ↗';
    }
  }
});
const productCards = [...document.querySelectorAll('.product-shot')];
productCards.forEach(card => {
  card.tabIndex = 0;
  card.setAttribute('aria-label', card.querySelector('h3').textContent + ' — focus or tap to bring forward');
  const select = () => productCards.forEach(item => item.classList.toggle('selected', item === card));
  card.addEventListener('click', select);
  card.addEventListener('focus', select);
  card.addEventListener('mouseenter', () => productCards.forEach(item => item.classList.remove('selected')));
});
const featureStrip = document.querySelector('.scrolling-strip');
const stripToggle = document.querySelector('.strip-toggle');
stripToggle.addEventListener('click', () => {
  const paused = featureStrip.classList.toggle('paused');
  stripToggle.setAttribute('aria-pressed', String(paused));
  stripToggle.setAttribute('aria-label', paused ? 'Resume scrolling features' : 'Pause scrolling features');
  stripToggle.textContent = paused ? '▶' : 'Ⅱ';
});

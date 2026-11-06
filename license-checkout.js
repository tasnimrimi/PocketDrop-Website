// Loaded before Paddle. Only a hash of the recovery key is sent to Paddle.
(() => {
  const config = window.POCKETDROP_CHECKOUT;
  const storage = 'pocketdrop-checkout-key-' + config.environment;
  const valid = value => /^pd_[A-Za-z0-9_-]{43}$/.test(value || '');
  const incoming = new URLSearchParams(location.hash.slice(1)).get('activate');
  if (incoming) history.replaceState(null, '', location.pathname + location.search + '#pricing');
  let key = valid(incoming) ? incoming : localStorage.getItem(storage);
  if (!valid(key)) key = 'pd_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  localStorage.setItem(storage, key);
  const section = document.createElement('section'); section.className='wrap pd-activation'; section.hidden=true;
  section.setAttribute('aria-labelledby','pd-activation-title');
  section.innerHTML=`<div class="pd-activation-card">
    <div class="pd-activation-brand" aria-hidden="true"><div class="pd-activation-logo"><img src="assets/logo.svg" alt=""><span class="pd-pro-badge">PRO</span></div></div>
    <p class="pd-activation-label">POCKETDROP PRO</p>
    <h2 id="pd-activation-title">Verifying your payment</h2>
    <p class="pd-activation-status" role="status" aria-live="polite"></p>
    <div class="pd-recovery" hidden>
      <div class="pd-recovery-heading"><label for="pd-recovery-key">Your recovery key</label><span>Keep it private</span></div>
      <div class="pd-recovery-controls"><input id="pd-recovery-key" type="password" readonly autocomplete="off" spellcheck="false" aria-label="Private recovery key"><button type="button" class="pd-key-toggle" aria-label="Show recovery key" aria-pressed="false">Show</button><button type="button" class="pd-key-copy">Copy key <span aria-hidden="true">↗</span></button></div>
      <p class="pd-key-feedback" role="status" aria-live="polite"></p>
      <details><summary>Use Pro on another browser</summary><p>In PocketDrop, select <strong>Already purchased? Restore Pro</strong>, then paste this recovery key.</p></details>
    </div>
    <p class="pd-activation-note">Return to PocketDrop to continue.</p>
  </div>`;
  document.querySelector('#pricing').after(section);
  const message=section.querySelector('.pd-activation-status'), recovery=section.querySelector('.pd-recovery');
  const title=section.querySelector('h2'), input=section.querySelector('input'), toggle=section.querySelector('.pd-key-toggle'), feedback=section.querySelector('.pd-key-feedback');
  toggle.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';toggle.textContent=show?'Hide':'Show';toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',show?'Hide recovery key':'Show recovery key');};
  section.querySelector('.pd-key-copy').onclick=async()=>{try{await navigator.clipboard.writeText(key);feedback.textContent='Copied. Save your key somewhere safe.';}catch{input.type='text';toggle.textContent='Hide';toggle.setAttribute('aria-pressed','true');toggle.setAttribute('aria-label','Hide recovery key');input.focus();input.select();feedback.textContent='Copy the selected key manually.';}};
  let timer, busy=false, attempts=0;
  async function check() {
    if(busy)return; busy=true;
    try {
      const response=await fetch(config.licenseEndpoint+'/v1/activation',{method:'POST',headers:{Authorization:'Bearer '+key},cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error('Could not check activation yet. Keep this page open and try again shortly.');
      const result=await response.json();
      if(result.environment!==config.environment)throw Error('Activation service environment mismatch.');
      if(result.status==='active') {clearInterval(timer);section.dataset.state='active';title.textContent='You’re all set.';message.textContent='Payment verified. Your lifetime Pro access is active.'; recovery.hidden=false;input.value=key;}
      else if(result.status==='revoked'){clearInterval(timer);section.dataset.state='revoked';title.textContent='Access is no longer active';message.textContent='This purchase was refunded or disputed. Contact support if this is unexpected.';recovery.hidden=true;input.value='';}
      else if(result.status==='pending'){section.dataset.state='pending';title.textContent='Verifying your payment';recovery.hidden=true;input.value='';message.textContent='Waiting for payment confirmation. You don’t need to pay again.';}
      else throw Error('The activation response could not be verified. Please try again shortly.');
    } catch(error){message.textContent=error.message;}
    finally{busy=false;}
  }
  function startChecking(){
    clearInterval(timer);attempts=0;void check();
    timer=setInterval(()=>{if(++attempts>=60)clearInterval(timer);void check();},5000);
  }
  window.PocketDropLicense={
    async customData(){
      const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
      return {pocketdrop_claim:Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join(''),pocketdrop_environment:config.environment};
    },
    event(event){
      if(event.name!=='checkout.completed')return;
      // Browser events only start polling; they never grant access.
      section.hidden=false;section.scrollIntoView({behavior:'smooth',block:'center'});
      sessionStorage.setItem(storage+'-checking','true');
      startChecking();
    }
  };
  if(sessionStorage.getItem(storage+'-checking')){section.hidden=false;startChecking();}
  window.addEventListener('focus',()=>{if(!section.hidden)void check();});
})();

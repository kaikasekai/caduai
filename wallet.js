// Simple EIP-1193 wallet connect + mock plan logic.
const WALLET_KEY = 'walletAddress';
const PLAN_KEY = 'userPlan'; // 'free' | 'pro1' | 'pro2'

function planFromQuery() {
  const p = new URLSearchParams(location.search).get('plan');
  if (['free','pro1','pro2'].includes((p||'').toLowerCase())) return p.toLowerCase();
  return null;
}

// Mock: derive plan from address for demo
function mockPlanForAddress(addr) {
  if (!addr) return 'free';
  const last = addr.slice(-1).toLowerCase();
  if ('0123'.includes(last)) return 'pro2';
  if ('4567'.includes(last)) return 'pro1';
  return 'free';
}

async function connectWallet() {
  if (!window.ethereum) {
    alert('Please install MetaMask or a compatible wallet.');
    return;
  }
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  localStorage.setItem(WALLET_KEY, address);
  const queryPlan = planFromQuery();
  const plan = queryPlan || mockPlanForAddress(address);
  localStorage.setItem(PLAN_KEY, plan);
  updateUI(address, plan);
  document.dispatchEvent(new CustomEvent('wallet-changed', { detail: { address, plan }}));
}

function disconnectWallet() {
  localStorage.removeItem(WALLET_KEY);
  localStorage.setItem(PLAN_KEY, 'free');
  updateUI(null, 'free');
  document.dispatchEvent(new CustomEvent('wallet-changed', { detail: { address:null, plan:'free' }}));
}

function currentSession() {
  const addr = localStorage.getItem(WALLET_KEY);
  const qp = planFromQuery();
  const plan = qp || localStorage.getItem(PLAN_KEY) || 'free';
  return { address: addr, plan };
}

function updateUI(address, plan) {
  const badge = document.getElementById('planBadge');
  const btn = document.getElementById('connectBtn');
  badge.textContent = `Plan: ${plan.toUpperCase()}`;
  if (address) {
    btn.textContent = short(address);
    btn.onclick = disconnectWallet;
    btn.classList.add('connected');
  } else {
    btn.textContent = 'Connect Wallet';
    btn.onclick = connectWallet;
    btn.classList.remove('connected');
  }
}

function short(a){ return a.slice(0,6)+'…'+a.slice(-4); }

window.addEventListener('DOMContentLoaded', () => {
  const { address, plan } = currentSession();
  updateUI(address, plan);
  const btn = document.getElementById('connectBtn');
  btn.onclick = address ? disconnectWallet : connectWallet;

  // Accordion
  document.querySelectorAll('.accordion-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{ btn.classList.toggle('active'); });
  });
});

// Expose to script.js
window.currentSession = currentSession;

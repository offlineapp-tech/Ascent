/* ASCENT Protocol — site + app shell. Vanilla JS, ethers v6 vendored.
   Preview mode until contract addresses are set in config.js. */
(function () {
  "use strict";

  const CFG = window.ASCENT_CONFIG;
  const PREVIEW = !CFG.contracts.ascentToken;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-on"), 4200);
  }

  const fmt = (n, d = 2) =>
    n.toLocaleString("en-US", {maximumFractionDigits: d, minimumFractionDigits: d});

  // ------------------------------------------------------------ navigation

  const VIEWS = ["home", "ecosystem", "token", "community", "app"];

  function show(view) {
    if (!VIEWS.includes(view)) return;
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + view));
    $$(".nav-links a").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === view));
    if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) { e.preventDefault(); show(nav.dataset.nav); }
    const app = e.target.closest("[data-app]");
    if (app) {
      $$(".side-link").forEach((b) => b.classList.toggle("is-active", b === app));
      $$(".app-pane").forEach((p) => p.classList.toggle("is-active", p.id === "app-" + app.dataset.app));
    }
  });

  const boot = location.hash.replace("#", "");
  if (VIEWS.includes(boot)) show(boot);
  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#", "");
    if (VIEWS.includes(h)) show(h);
  });

  // ------------------------------------------------------------ demo data

  const demoLaunches = [
    {tag: "NV", name: "Nova Yield", chain: "Solana", blurb: "Automated yield routing across Solana money markets.", raised: 84, total: "400k", ends: "2d 14h"},
    {tag: "PX", name: "Pulsar DEX", chain: "Robinhood Chain", blurb: "Order-book DEX for tokenized stocks, 100 ms blocks.", raised: 56, total: "250k", ends: "5d 02h"},
    {tag: "AE", name: "Aether Bridge", chain: "Ethereum", blurb: "Fast-finality messaging layer for cross-chain apps.", raised: 31, total: "600k", ends: "9d 20h"},
    {tag: "OR", name: "Orbital Pay", chain: "Solana", blurb: "Tap-to-pay stablecoin rails for emerging markets.", raised: 12, total: "180k", ends: "12d 08h"},
  ];

  const demoProposals = [
    {title: "AIP-7: Route 20% of swap fees to the staking pool", state: "Active", yes: 74, quorum: "8.2M ve", ends: "3d 11h", body: "Redirects a fifth of router revenue from treasury to veASCENT stakers."},
    {title: "AIP-6: Launchpad listing standards v2", state: "Active", yes: 61, quorum: "6.9M ve", ends: "1d 04h", body: "Requires audited contracts and locked team allocations for all launches."},
    {title: "AIP-5: Deploy bridge contracts to Robinhood Chain", state: "Closed", yes: 92, quorum: "11.4M ve", ends: "ended", body: "Passed. Deployment enters the Phase 1 roadmap."},
  ];

  function renderLaunchpad() {
    const grid = $("#lpGrid");
    grid.innerHTML = "";
    demoLaunches.forEach((l) => {
      const card = document.createElement("article");
      card.className = "lp-card";
      card.innerHTML =
        `<div class="lp-top"><span class="lp-logo">${l.tag}</span><h4>${l.name}</h4><span class="lp-chain">${l.chain}</span></div>` +
        `<p>${l.blurb}</p>` +
        `<div class="lp-bar"><span class="lp-fill" style="width:${l.raised}%"></span></div>` +
        `<div class="lp-meta"><span>Raised <b>${l.raised}%</b> of $${l.total}</span><span>Ends in <b>${l.ends}</b></span></div>` +
        `<button class="btn btn-grad btn-block lp-join">Join sale</button>`;
      grid.appendChild(card);
    });
    grid.addEventListener("click", (e) => {
      if (e.target.closest(".lp-join")) guardTx();
    });
  }

  function renderGov() {
    const list = $("#govList");
    list.innerHTML = "";
    demoProposals.forEach((p) => {
      const card = document.createElement("article");
      card.className = "gov-card";
      card.innerHTML =
        `<div class="gov-top"><h4>${p.title}</h4><span class="gov-state${p.state === "Closed" ? " is-closed" : ""}">${p.state}</span></div>` +
        `<p>${p.body}</p>` +
        `<div class="gov-bar"><span class="gov-yes" style="width:${p.yes}%"></span><span class="gov-no" style="width:${100 - p.yes}%"></span></div>` +
        `<div class="gov-meta"><span>For <b>${p.yes}%</b> · Against ${100 - p.yes}%</span><span>Quorum ${p.quorum} · ${p.ends}</span></div>` +
        (p.state === "Active"
          ? `<div class="gov-actions"><button class="btn btn-grad gov-vote">Vote for</button><button class="btn btn-line gov-vote">Vote against</button></div>`
          : "");
      list.appendChild(card);
    });
    list.addEventListener("click", (e) => {
      if (e.target.closest(".gov-vote")) guardTx();
    });
  }

  // ------------------------------------------------------------ charts

  function lineChart(canvas, pts, opts = {}) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, pad = 10;
    const min = Math.min(...pts), max = Math.max(...pts);
    const x = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = (p) => H - pad - ((p - min) / (max - min || 1)) * (H - pad * 2);

    ctx.clearRect(0, 0, W, H);
    if (opts.grid) {
      ctx.strokeStyle = "rgba(154,163,186,0.12)";
      ctx.lineWidth = 1;
      for (let g = 1; g <= 3; g++) {
        ctx.beginPath(); ctx.moveTo(pad, (H / 4) * g); ctx.lineTo(W - pad, (H / 4) * g); ctx.stroke();
      }
    }
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, "#6C5CFF");
    grad.addColorStop(1, "#00E0FF");

    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p)) : ctx.moveTo(x(i), y(p))));
    ctx.lineTo(x(pts.length - 1), H - pad);
    ctx.lineTo(x(0), H - pad);
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, 0, 0, H);
    fill.addColorStop(0, "rgba(108,92,255,0.35)");
    fill.addColorStop(1, "rgba(0,224,255,0)");
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p)) : ctx.moveTo(x(i), y(p))));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x(pts.length - 1), y(pts[pts.length - 1]), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#00E0FF";
    ctx.fill();
  }

  function seriesFor(len, base, vol) {
    const pts = [];
    let v = base;
    for (let i = 0; i < len; i++) {
      v *= 1 + 0.004 * Math.sin(i * 1.9) + 0.0035 * Math.sin(i * 0.7 + 2) + 0.0016;
      pts.push(v * (1 + vol * Math.sin(i * 3.1)));
    }
    return pts;
  }

  // ------------------------------------------------------------ wallet

  let provider = null, signer = null, account = null;

  async function connect() {
    if (!window.ethereum) {
      toast("No wallet found. Install MetaMask (or any EIP-1193 wallet) and reload.");
      return;
    }
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      account = ethers.getAddress(accounts[0]);
      await ensureChain();
      signer = await provider.getSigner();
      const btn = $("#connectBtn");
      btn.textContent = account.slice(0, 6) + "…" + account.slice(-4);
      toast("Wallet connected.");
    } catch (err) {
      if (err && err.code === 4001) toast("Connection request was declined in the wallet.");
      else toast("Couldn’t connect: " + (err.shortMessage || err.message || err));
    }
  }

  async function ensureChain() {
    const net = CFG.network;
    try {
      await window.ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: net.chainIdHex}]});
    } catch (err) {
      if (err && (err.code === 4902 || String(err.message || "").includes("4902"))) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{chainId: net.chainIdHex, chainName: net.name, rpcUrls: [net.rpcUrl], nativeCurrency: net.currency, blockExplorerUrls: [net.explorer]}],
        });
      } else if (err && err.code === 4001) {
        toast("Network switch declined — you’re connected on another chain.");
      } else { throw err; }
    }
  }

  $("#connectBtn").addEventListener("click", connect);
  if (window.ethereum) {
    window.ethereum.on?.("accountsChanged", () => location.reload());
    window.ethereum.on?.("chainChanged", () => location.reload());
  }

  function guardTx() {
    if (PREVIEW) { toast("Preview build — transactions unlock when contracts are deployed."); return false; }
    if (!signer) { toast("Connect your wallet first."); return false; }
    return true;
  }

  // ------------------------------------------------------------ forms

  const RATE = {ETH: 3300, USDG: 1, ASCENT: 0.042};

  function updateSwap() {
    const amt = parseFloat(String($("#swapIn").value).replace(/[,\s]/g, ""));
    const from = $("#swapInTok").value, to = $("#swapOutTok").value;
    if (!isFinite(amt) || amt <= 0) { $("#swapOut").value = ""; return; }
    const out = (amt * RATE[from]) / RATE[to] * 0.997; // 0.3% fee
    $("#swapOut").value = fmt(out, out < 1 ? 6 : 2);
    $("#swapRoute").textContent = `${$("#swapInChain").value} → ${$("#swapOutChain").value} · 0.30% fee`;
  }
  ["#swapIn", "#swapInTok", "#swapOutTok", "#swapInChain", "#swapOutChain"].forEach((s) =>
    $(s).addEventListener("input", updateSwap)
  );
  $("#swapFlip").addEventListener("click", () => {
    const a = $("#swapInTok"), b = $("#swapOutTok");
    [a.value, b.value] = [b.value, a.value];
    const c = $("#swapInChain"), d = $("#swapOutChain");
    [c.value, d.value] = [d.value, c.value];
    updateSwap();
  });

  $("#swapForm").addEventListener("submit", (e) => { e.preventDefault(); guardTx(); });
  $("#stakeForm").addEventListener("submit", (e) => { e.preventDefault(); guardTx(); });

  // ------------------------------------------------------------ boot

  renderLaunchpad();
  renderGov();
  $("#stakeTotal").textContent = "184.2M ASCENT (preview)";
  lineChart($("#phoneChart"), seriesFor(48, 100, 0.004));
  lineChart($("#dashChart"), seriesFor(90, 100, 0.006), {grid: true});
  if (!PREVIEW) $("#demoNote").classList.add("is-hidden");
})();

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plano Docente — planos de ensino para professores de Santa Catarina",
  description:
    "O Plano Docente organiza os currículos (BNCC, Currículo Catarinense, Currículo de Educação Digital de SC) em uma primeira versão do seu plano de ensino, para você revisar, adaptar e exportar em Word ou PDF.",
};

const PAGE_CSS = `
/* Layout concept: a light, airy "control room" feel -- soft gradient-mesh glow behind
   the hero and closing moment, a frosted sticky nav, and gradient-filled accents that
   carry the brand mark's colors through buttons, cards and icon chips. */
:root{
  color-scheme: light;
  --bg:#F5F7FF;
  --surface:#FFFFFF;
  --surface-2:#ECF0FE;
  --text:#15162C;
  --text-muted:#5B5E7A;
  --border:rgba(21,22,44,.10);
  --primary:#5B4FE8;
  --primary-2:#14C7DE;
  --pop:#FF6B6B;
  --glass:rgba(255,255,255,.70);
  --blob-1:rgba(91,79,232,.22);
  --blob-2:rgba(20,199,222,.20);
  --blob-3:rgba(255,107,107,.15);
  --shadow: 0 1px 2px rgba(21,22,44,.05), 0 16px 34px -16px rgba(91,79,232,.28);
  --font-display:'Unbounded',Georgia,sans-serif;
  --font-body:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    color-scheme: dark;
    --bg:#0B0C1E;
    --surface:#14152C;
    --surface-2:#1B1D3B;
    --text:#F1F1FA;
    --text-muted:#A7AAC8;
    --border:rgba(241,241,250,.13);
    --primary:#8477FF;
    --primary-2:#35E4F6;
    --pop:#FF8A8A;
    --glass:rgba(16,17,38,.62);
    --blob-1:rgba(132,119,255,.38);
    --blob-2:rgba(53,228,246,.30);
    --blob-3:rgba(255,138,138,.22);
    --shadow: 0 1px 2px rgba(0,0,0,.35), 0 16px 34px -16px rgba(53,228,246,.28);
  }
}
:root[data-theme="dark"]{
  color-scheme: dark;
  --bg:#0B0C1E;
  --surface:#14152C;
  --surface-2:#1B1D3B;
  --text:#F1F1FA;
  --text-muted:#A7AAC8;
  --border:rgba(241,241,250,.13);
  --primary:#8477FF;
  --primary-2:#35E4F6;
  --pop:#FF8A8A;
  --glass:rgba(16,17,38,.62);
  --blob-1:rgba(132,119,255,.38);
  --blob-2:rgba(53,228,246,.30);
  --blob-3:rgba(255,138,138,.22);
  --shadow: 0 1px 2px rgba(0,0,0,.35), 0 16px 34px -16px rgba(53,228,246,.28);
}

*{box-sizing:border-box;}
body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:var(--font-body);
  font-size:16px;
  line-height:1.56;
  -webkit-font-smoothing:antialiased;
}
@media (prefers-reduced-motion: no-preference){
  html{scroll-behavior:smooth;}
}
h1,h2,h3{font-family:var(--font-display);color:var(--text);margin:0;text-wrap:balance;font-weight:600;letter-spacing:-.01em;}
p{margin:0;}
a{color:inherit;}
img{max-width:100%;display:block;}
.wrap{max-width:1180px;margin-inline:auto;padding-inline:clamp(20px,5vw,40px);position:relative;z-index:1;}
.eyebrow{
  font-family:var(--font-body);
  font-weight:700;
  font-size:.78rem;
  letter-spacing:.09em;
  text-transform:uppercase;
  color:var(--primary);
  display:flex;align-items:center;gap:.6em;
}
.eyebrow::before{
  content:"";
  width:8px;height:8px;border-radius:50%;
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  display:inline-block;
}
.fs-h1{font-size:clamp(2rem,1.45rem + 2.5vw,3.3rem);line-height:1.1;}
.fs-h2{font-size:clamp(1.55rem,1.28rem + 1.25vw,2.25rem);line-height:1.16;}
.fs-h3{font-size:clamp(1.05rem,.98rem + .3vw,1.2rem);line-height:1.3;}
.lead{font-size:clamp(1.05rem,.98rem + .3vw,1.2rem);color:var(--text-muted);line-height:1.6;}
.section{padding-block:clamp(56px,8vw,96px);position:relative;}
.section-alt{background:var(--surface-2);}
.mesh{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;}
.mesh span{position:absolute;border-radius:50%;filter:blur(64px);}
.mesh .b1{width:420px;height:420px;background:var(--blob-1);top:-140px;left:-80px;}
.mesh .b2{width:460px;height:460px;background:var(--blob-2);top:-60px;right:-160px;}
.mesh .b3{width:360px;height:360px;background:var(--blob-3);bottom:-180px;left:38%;}

/* ---------- buttons ---------- */
.btn{
  font-family:var(--font-body);
  font-weight:700;
  font-size:.98rem;
  border-radius:999px;
  padding:.9em 1.7em;
  display:inline-flex;
  align-items:center;
  gap:.5em;
  text-decoration:none;
  border:1.5px solid transparent;
  cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background-color .15s ease, border-color .15s ease, filter .15s ease;
  white-space:nowrap;
}
.btn:active{transform:translateY(1px);}
.btn:focus-visible{outline:3px solid var(--primary-2);outline-offset:2px;}
.btn-primary{
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  color:#fff;
  box-shadow:0 14px 30px -12px var(--blob-1), 0 6px 16px -8px var(--blob-2);
}
.btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 18px 36px -12px var(--blob-1), 0 8px 20px -8px var(--blob-2);}
.btn-ghost{background:var(--surface);color:var(--text);border-color:var(--border);}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);}
.btn-on-gradient{background:#fff;color:var(--primary);}
.btn-on-gradient:hover{filter:brightness(1.04);transform:translateY(-1px);}
.btn-row{display:flex;flex-wrap:wrap;gap:14px;}
.icon{width:1.1em;height:1.1em;flex:none;}

/* ---------- header ---------- */
.site-header{
  position:sticky;
  top:env(safe-area-inset-top,0px);
  z-index:40;
  background:var(--glass);
  backdrop-filter:blur(16px) saturate(160%);
  -webkit-backdrop-filter:blur(16px) saturate(160%);
  border-bottom:1px solid var(--border);
}
.site-header .wrap{
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding-block:13px;
}
.brand{display:flex;align-items:center;gap:.6em;text-decoration:none;color:var(--text);}
.brand-mark{width:30px;height:30px;flex:none;}
.brand-word{font-family:var(--font-display);font-weight:600;font-size:1.02rem;letter-spacing:-.01em;}
.site-nav{display:flex;align-items:center;gap:28px;}
.site-nav a{font-size:.92rem;font-weight:600;color:var(--text-muted);text-decoration:none;transition:color .15s ease;}
.site-nav a:hover{color:var(--primary);}
.header-cta{display:flex;align-items:center;gap:10px;flex:none;}
@media (max-width:820px){.site-nav{display:none;}}
@media (max-width:480px){
  .brand-word{display:none;}
  .header-cta .btn{padding:.68em 1.05em;font-size:.86rem;}
}

/* ---------- hero ---------- */
.hero .wrap{
  display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(28px,5vw,64px);align-items:center;
  padding-block:clamp(48px,7vw,84px);
}
@media (max-width:900px){.hero .wrap{grid-template-columns:1fr;}.hero-media{order:-1;}}
.hero-copy{display:flex;flex-direction:column;gap:22px;}
.hero-copy .lead{max-width:46ch;}
.hero-media{position:relative;}
.hero-media img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:22px;box-shadow:var(--shadow);}
.hero-media .tag{
  position:absolute;left:18px;bottom:-16px;
  background:var(--surface);border:1px solid var(--border);border-radius:13px;box-shadow:var(--shadow);
  padding:10px 14px;display:flex;align-items:center;gap:.6em;
  font-size:.82rem;font-weight:600;color:var(--text);max-width:calc(100% - 36px);
}
.hero-media .tag .icon{color:var(--primary);}
.hero-badges{display:flex;flex-wrap:wrap;gap:10px;}
.chip{display:inline-flex;align-items:center;gap:.55em;font-size:.84rem;font-weight:700;border-radius:999px;padding:.6em 1.15em;line-height:1.25;}
.chip .icon{width:1.1em;height:1.1em;flex:none;}
.chip-solid{background:linear-gradient(135deg,var(--primary),var(--primary-2));color:#fff;box-shadow:0 10px 24px -10px var(--blob-1);}
.chip-stat{background:var(--surface);border:1.5px solid var(--primary);color:var(--text);box-shadow:var(--shadow);}
.chip-stat strong{color:var(--primary);font-family:var(--font-display);font-size:1.05em;}
@media (max-width:480px){.chip{font-size:.8rem;padding:.55em 1em;}}
.curricula-strip{display:flex;flex-wrap:wrap;gap:10px;padding-top:4px;}
.curric-chip{display:inline-flex;align-items:center;gap:.55em;font-size:.8rem;font-weight:700;color:var(--primary);background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:.5em 1.05em;}
.curric-chip::before{content:"";width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-2));flex:none;}

@keyframes rise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@media (prefers-reduced-motion: no-preference){
  .hero-copy > *{animation:rise .6s cubic-bezier(.2,.7,.3,1) both;}
  .hero-copy > *:nth-child(2){animation-delay:.05s;}
  .hero-copy > *:nth-child(3){animation-delay:.1s;}
  .hero-copy > *:nth-child(4){animation-delay:.15s;}
  .hero-copy > *:nth-child(5){animation-delay:.2s;}
  .hero-media{animation:rise .7s .1s cubic-bezier(.2,.7,.3,1) both;}
}

/* ---------- rotina ---------- */
.rotina-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,64px);align-items:center;}
@media (max-width:900px){.rotina-grid{grid-template-columns:1fr;}}
.rotina-media img{border-radius:22px;box-shadow:var(--shadow);width:100%;aspect-ratio:4/3;object-fit:cover;}
.rotina-copy{display:flex;flex-direction:column;gap:20px;}
.pain-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;}
.pain-list li{display:flex;gap:12px;align-items:flex-start;font-size:.98rem;color:var(--text);}
.pain-list .icon{color:var(--primary);margin-top:.15em;}
.closing-note{border-left:3px solid var(--primary);padding-left:16px;font-size:.98rem;color:var(--text-muted);}

/* ---------- como funciona ---------- */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px;}
@media (max-width:980px){.steps{grid-template-columns:1fr 1fr;}}
@media (max-width:620px){.steps{grid-template-columns:1fr;}}
.step-card{
  background:var(--surface);border:1px solid var(--border);border-radius:18px;
  padding:26px 22px;display:flex;flex-direction:column;gap:14px;
  transition:transform .15s ease, box-shadow .15s ease;
}
.step-card:hover{transform:translateY(-3px);box-shadow:var(--shadow);}
.step-num{
  width:38px;height:38px;border-radius:12px;
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  color:#fff;font-family:var(--font-display);font-weight:600;font-size:1rem;
  display:flex;align-items:center;justify-content:center;
}
.step-card h3{font-size:1.05rem;font-family:var(--font-body);font-weight:700;}
.step-card p{font-size:.92rem;color:var(--text-muted);}
.callout{
  margin-top:40px;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--primary);
  border-radius:16px;padding:clamp(22px,4vw,30px) clamp(22px,5vw,36px);
  display:flex;gap:18px;align-items:flex-start;box-shadow:var(--shadow);
}
.callout .icon-chip{
  width:2.4em;height:2.4em;border-radius:12px;flex:none;
  background:linear-gradient(135deg,var(--primary),var(--primary-2));
  display:flex;align-items:center;justify-content:center;
}
.callout .icon-chip .icon{color:#fff;width:1.3em;height:1.3em;}
.callout strong{font-family:var(--font-display);font-size:1.15rem;font-weight:600;display:block;margin-bottom:6px;}
.callout span{color:var(--text-muted);font-size:.95rem;}

/* ---------- santa catarina ---------- */
.curriculo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:32px;}
@media (max-width:760px){.curriculo-grid{grid-template-columns:1fr;}}
.curriculo-card{
  background:var(--surface);border:1px solid var(--border);border-radius:16px;
  padding:18px 20px;display:flex;gap:14px;align-items:flex-start;
  transition:transform .15s ease, box-shadow .15s ease;
}
.curriculo-card:hover{transform:translateY(-2px);box-shadow:var(--shadow);}
.curriculo-card .icon-chip{
  width:2.1em;height:2.1em;border-radius:10px;flex:none;background:var(--surface-2);
  display:flex;align-items:center;justify-content:center;
}
.curriculo-card .icon-chip .icon{color:var(--primary);width:1.15em;height:1.15em;}
.curriculo-card h4{margin:0 0 3px;font-size:.98rem;font-weight:700;font-family:var(--font-body);}
.curriculo-card p{font-size:.86rem;color:var(--text-muted);}
.sc-note{
  margin-top:32px;background:var(--surface);border:1px dashed var(--border);border-radius:16px;
  padding:20px 24px;font-size:.95rem;color:var(--text);max-width:80ch;
}

/* ---------- resultado ---------- */
.mock-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:36px;}
@media (max-width:980px){.mock-grid{grid-template-columns:1fr;}}
.mock-card{display:flex;flex-direction:column;gap:10px;}
.mock-frame{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);overflow:hidden;}
.mock-bar{background:var(--surface-2);border-bottom:1px solid var(--border);padding:8px 12px;display:flex;gap:6px;}
.mock-bar span{width:8px;height:8px;border-radius:50%;background:var(--border);}
.mock-body{padding:16px;display:flex;flex-direction:column;gap:10px;min-height:190px;}
.mock-search{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--text-muted);font-size:.8rem;}
.mock-chip{display:flex;align-items:center;gap:8px;font-size:.74rem;}
.mock-chip code{font-family:var(--font-mono);background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:2px 6px;font-size:.72rem;color:var(--primary);}
.mock-chip .bar{flex:1;height:7px;border-radius:4px;background:var(--surface-2);}
.mock-doc-line{height:8px;border-radius:4px;background:var(--surface-2);}
.mock-doc-line.short{width:55%;}
.mock-doc-line.med{width:78%;}
.mock-doc-head{font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--primary);margin-top:4px;}
.mock-export{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;flex:1;}
.file-row{display:flex;gap:12px;}
.file-badge{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:var(--text-muted);}
.file-badge .icon{width:2.4em;height:2.4em;color:var(--primary);}
.mock-caption{font-size:.84rem;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;gap:10px;}
.mock-caption .pill{
  font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--primary);
  background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:3px 9px;white-space:nowrap;
}
.result-note{margin-top:26px;font-size:.92rem;color:var(--text-muted);max-width:70ch;}
.doc-divider{margin-top:52px;padding-top:40px;border-top:1px solid var(--border);}
.mock-grid-docs{display:grid;grid-template-columns:repeat(2,1fr);gap:22px;margin-top:30px;}
@media (max-width:980px){.mock-grid-docs{grid-template-columns:1fr;}}
.doc-mock{background:#fff;color:#20202e;}
.doc-ribbon{display:inline-flex;align-items:center;gap:6px;font-size:.64rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#8a5a00;background:#FFF3CF;border:1px solid #F0B429;border-radius:999px;padding:.32em .8em;margin:14px 14px 0;}
.doc-head{font-size:.68rem;line-height:1.55;color:#3a3a46;padding:10px 14px 0;}
.doc-head b{color:#15152a;}
.doc-mock-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:0 14px 14px;}
.doc-table{width:100%;min-width:480px;border-collapse:collapse;font-size:.7rem;margin:12px 0 2px;}
.doc-table td{border:1px solid #d7d7e0;padding:7px 10px;vertical-align:top;line-height:1.5;}
.doc-table td.lbl{width:29%;background:#f2f3f9;font-weight:700;color:#23233a;}
.doc-table td.val{color:#2b2b3c;}
.doc-table .doc-skill{display:block;margin-bottom:6px;}
.doc-table .doc-skill:last-child{margin-bottom:0;}
.doc-table .doc-skill code{font-family:var(--font-mono);font-size:.82em;background:#eef0fb;padding:.08em .4em;border-radius:4px;color:#4338CA;font-weight:700;}

/* ---------- pricing ---------- */
.pricing-wrap{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(28px,5vw,56px);align-items:start;}
@media (max-width:920px){.pricing-wrap{grid-template-columns:1fr;}}
.pricing-copy{display:flex;flex-direction:column;gap:18px;}
.pricing-card{
  background:linear-gradient(145deg,var(--primary),var(--primary-2));
  color:#fff;border-radius:26px;padding:clamp(28px,4vw,38px);
  box-shadow:0 26px 50px -20px var(--blob-1), 0 10px 26px -10px var(--blob-2);
  display:flex;flex-direction:column;gap:22px;
}
.pricing-plan{font-weight:700;font-size:.85rem;letter-spacing:.04em;text-transform:uppercase;opacity:.85;}
.pricing-amount{font-family:var(--font-display);font-size:clamp(2.1rem,1.85rem + 1.1vw,2.75rem);font-weight:600;line-height:1;}
.pricing-amount sub{font-family:var(--font-body);font-size:1rem;font-weight:700;vertical-align:baseline;}
.pricing-features{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:11px;}
.pricing-features li{display:flex;gap:10px;align-items:flex-start;font-size:.92rem;}
.pricing-features .icon{width:1.15em;height:1.15em;flex:none;margin-top:.1em;}
.pricing-fineprint{font-size:.82rem;opacity:.85;border-top:1px solid rgba(255,255,255,.25);padding-top:16px;}
details.conditions{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:4px 20px;}
details.conditions summary{cursor:pointer;padding:14px 0;font-weight:700;font-size:.95rem;display:flex;align-items:center;justify-content:space-between;list-style:none;}
details.conditions summary::-webkit-details-marker{display:none;}
details.conditions summary .chev{transition:transform .2s ease;color:var(--primary);}
details.conditions[open] summary .chev{transform:rotate(180deg);}
.conditions-body{padding-bottom:18px;display:flex;flex-direction:column;gap:12px;font-size:.92rem;color:var(--text-muted);}
.conditions-body strong{color:var(--text);}
.placeholder{color:var(--primary);background:var(--surface-2);border:1px dashed var(--primary);border-radius:6px;padding:0 5px;font-style:normal;}

/* ---------- faq ---------- */
.faq-list{display:flex;flex-direction:column;gap:12px;margin-top:32px;max-width:820px;}
details.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:4px 22px;transition:border-color .15s ease;}
details.faq-item[open]{border-color:var(--primary);}
details.faq-item summary{cursor:pointer;padding:18px 0;font-weight:700;font-size:1rem;display:flex;align-items:center;justify-content:space-between;gap:16px;list-style:none;}
details.faq-item summary::-webkit-details-marker{display:none;}
details.faq-item summary .chev{transition:transform .2s ease;color:var(--primary);flex:none;}
details.faq-item[open] summary .chev{transform:rotate(180deg);}
.faq-body{padding-bottom:20px;font-size:.95rem;color:var(--text-muted);max-width:68ch;}

/* ---------- closing ---------- */
.closing{text-align:center;overflow:hidden;}
.closing .wrap{display:flex;flex-direction:column;align-items:center;gap:22px;}
.closing h2{max-width:22ch;}
.closing p{color:var(--text-muted);max-width:50ch;font-size:1.02rem;}

/* ---------- footer ---------- */
.site-footer{background:var(--surface-2);padding-block:34px;}
.site-footer .wrap{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;}
.footer-note{font-size:.84rem;max-width:56ch;line-height:1.6;color:var(--text-muted);}
.footer-links{display:flex;gap:20px;flex-wrap:wrap;font-size:.85rem;}
.footer-links a{text-decoration:none;color:var(--text-muted);}
.footer-links a:hover{color:var(--primary);}
.footer-bottom{border-top:1px solid var(--border);margin-top:26px;padding-top:18px;font-size:.8rem;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;}
`;

const PAGE_BODY_HTML = `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="#inicio">
      <svg class="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0%" style="stop-color:var(--primary)"/>
      <stop offset="100%" style="stop-color:var(--primary-2)"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#logoGrad)"/>
  <rect x="9" y="10.2" width="14" height="2.6" rx="1.3" fill="#fff"/>
  <rect x="9" y="15.4" width="10.5" height="2.6" rx="1.3" fill="#fff" fill-opacity=".85"/>
  <path d="M9 22.2 13 26.2 21.5 17.2" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
      <span class="brand-word">Plano Docente</span>
    </a>
    <nav class="site-nav" aria-label="Navegação principal">
      <a href="#como-funciona">Como funciona</a>
      <a href="#santa-catarina">Para Santa Catarina</a>
      <a href="#resultado">Veja como fica</a>
      <a href="#faq">Perguntas</a>
    </nav>
    <div class="header-cta">
      <a class="btn btn-ghost" href="https://planodocente.com.br/login" target="_blank" rel="noopener noreferrer">Entrar</a>
      <a class="btn btn-primary" href="#assinatura">Conhecer a assinatura</a>
    </div>
  </div>
</header>

<main>

<section class="hero" id="inicio">
  <div class="mesh"><span class="b1"></span><span class="b2"></span><span class="b3"></span></div>
  <div class="wrap">
    <div class="hero-copy">
      <div class="hero-badges">
        <span class="chip chip-solid"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 3 7v3c0 6 4 10.5 9 12 5-1.5 9-6 9-12V7l-9-5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>Feito para professores da Rede Estadual de Santa Catarina</span>
        <span class="chip chip-stat"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="color:var(--primary);"><circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M15.8 14.2c2.1.3 3.8 1.9 4.2 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><strong>+5.000</strong>&nbsp;professores já usam o Plano Docente</span>
      </div>
      <h1 class="fs-h1">Seu plano de ensino não precisa começar numa folha em branco.</h1>
      <p class="lead">Escolha sua escola, turma e as habilidades dos currículos. O Plano Docente organiza essas escolhas em uma primeira versão para você revisar, adaptar e exportar em Word ou PDF.</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="#como-funciona">Ver como funciona</a>
        <a class="btn btn-ghost" href="#assinatura">Conhecer a assinatura anual</a>
      </div>
      <div class="curricula-strip">
        <span class="curric-chip">BNCC</span>
        <span class="curric-chip">Currículo Catarinense</span>
        <span class="curric-chip">Currículo de Educação Digital de SC</span>
        <span class="curric-chip">Cursos técnicos</span>
      </div>
    </div>
    <div class="hero-media">
      <img src="/hero-professora.jpg" alt="Professora revisando o planejamento de aula no laptop" style="width:100%;aspect-ratio:4/3;border-radius:22px;box-shadow:var(--shadow);display:block;object-fit:cover;" loading="eager"/>
      <div class="tag">
        <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Revisão e exportação sempre com você
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="rotina">
  <div class="wrap rotina-grid">
    <div class="rotina-media">
      <img src="/planejamento-professores.jpg" alt="Dois professores consultando juntos um documento de planejamento" style="width:100%;aspect-ratio:4/3;border-radius:22px;box-shadow:var(--shadow);display:block;object-fit:cover;" loading="lazy"/>
    </div>
    <div class="rotina-copy">
      <p class="eyebrow">A rotina de planejar</p>
      <h2 class="fs-h2">O difícil não é preencher um modelo. É reunir tudo o que o plano exige.</h2>
      <p class="lead" style="font-size:1rem;">Antes da primeira linha, um plano de ensino já pede um trabalho de garimpo: abrir a BNCC, abrir o currículo catarinense, conferir o currículo de educação digital, localizar as habilidades certas para aquela turma e formatar tudo num documento que a escola aceite.</p>
      <ul class="pain-list">
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Consultar documentos diferentes para cada etapa e componente curricular.</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Localizar, entre dezenas de habilidades, as que realmente valem para a turma.</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>Adaptar o mesmo planejamento para turmas e anos diferentes.</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg>Formatar o arquivo final no padrão que a escola pede.</li>
      </ul>
      <p class="closing-note">O Plano Docente cuida dessa parte repetitiva para você chegar direto à decisão pedagógica.</p>
    </div>
  </div>
</section>

<section class="section" id="como-funciona">
  <div class="wrap">
    <p class="eyebrow">Como funciona</p>
    <h2 class="fs-h2">Da escolha ao documento pronto para revisar</h2>
    <div class="steps">
      <div class="step-card"><span class="step-num">1</span><h3>Cadastre escolas e turmas</h3><p>Registre as escolas onde você leciona, as turmas, os anos e os componentes curriculares. Tudo organizado numa única conta.</p></div>
      <div class="step-card"><span class="step-num">2</span><h3>Escolha competências e habilidades</h3><p>Selecione, direto dos currículos oficiais, as competências e habilidades que valem para aquela turma e período.</p></div>
      <div class="step-card"><span class="step-num">3</span><h3>Receba uma primeira versão e revise</h3><p>O Plano Docente estrutura uma primeira versão do plano a partir das suas escolhas, para você revisar a metodologia e a avaliação.</p></div>
      <div class="step-card"><span class="step-num">4</span><h3>Exporte em Word ou PDF</h3><p>Baixe o documento pronto para entregar, editar ou arquivar, no formato que a sua escola pede.</p></div>
    </div>
    <div class="callout">
      <div class="icon-chip"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 4 7v5c0 4.6 3.2 8.4 8 9.9 4.8-1.5 8-5.3 8-9.9V7l-8-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.5 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div>
        <strong>As decisões pedagógicas continuam com você.</strong>
        <span>O Plano Docente organiza os currículos e estrutura o documento. A metodologia, os critérios de avaliação e cada adaptação continuam sendo escolha sua.</span>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="santa-catarina">
  <div class="wrap">
    <p class="eyebrow">Feito para Santa Catarina</p>
    <h2 class="fs-h2">Os currículos da rede estadual, num só lugar</h2>
    <p class="lead" style="font-size:1rem;margin-top:14px;max-width:70ch;">O Plano Docente foi construído a partir dos currículos que orientam o ensino público em Santa Catarina.</p>
    <div class="curriculo-grid">
      <div class="curriculo-card"><div class="icon-chip"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h4>BNCC</h4><p>Base Nacional Comum Curricular.</p></div></div>
      <div class="curriculo-card"><div class="icon-chip"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h4>Currículo Base Catarinense</h4><p>Educação Infantil e Ensino Fundamental.</p></div></div>
      <div class="curriculo-card"><div class="icon-chip"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h4>Currículo Base do Ensino Médio</h4><p>Referência curricular para a etapa em Santa Catarina.</p></div></div>
      <div class="curriculo-card"><div class="icon-chip"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h4>Currículo de Educação Digital de SC</h4><p>Habilidades específicas de educação digital.</p></div></div>
      <div class="curriculo-card" style="grid-column:1/-1;"><div class="icon-chip"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h4>Cursos técnicos da rede estadual</h4><p>Planejamento para componentes de cursos técnicos, além das etapas regulares.</p></div></div>
    </div>
    <p class="sc-note">Numa mesma conta, você pode reunir várias escolas, turmas, disciplinas e áreas de conhecimento — útil para quem leciona em mais de uma unidade ou atende turmas de etapas diferentes. A qualquer momento, também é possível consultar o texto das competências e habilidades direto dos currículos, sem precisar abrir outro documento.</p>
  </div>
</section>

<section class="section" id="resultado">
  <div class="wrap">
    <p class="eyebrow">Veja como fica</p>
    <h2 class="fs-h2">Da seleção de habilidades ao documento exportado</h2>
    <p class="lead" style="font-size:1rem;margin-top:14px;max-width:70ch;">As telas abaixo representam, de forma ilustrativa, as etapas do processo. Capturas reais da plataforma entram aqui.</p>
    <div class="mock-grid">
      <div class="mock-card">
        <div class="mock-frame">
          <div class="mock-bar"><span></span><span></span><span></span></div>
          <div class="mock-body">
            <div class="mock-search"><svg class="icon" style="width:1em;height:1em;" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Buscar habilidade ou código</div>
            <div class="mock-chip"><code>EF67LP08</code><span class="bar"></span></div>
            <div class="mock-chip"><code>EM13LGG101</code><span class="bar" style="width:70%;"></span></div>
            <div class="mock-chip"><code>EI03EO01</code><span class="bar" style="width:85%;"></span></div>
            <div class="mock-chip"><code>EF15DI03</code><span class="bar" style="width:55%;"></span></div>
          </div>
        </div>
        <p class="mock-caption"><span>Seleção de habilidades</span><span class="pill">Exemplo ilustrativo</span></p>
      </div>
      <div class="mock-card">
        <div class="mock-frame">
          <div class="mock-bar"><span></span><span></span><span></span></div>
          <div class="mock-body">
            <div class="mock-doc-head">Identificação</div><div class="mock-doc-line med"></div>
            <div class="mock-doc-head">Habilidades selecionadas</div><div class="mock-doc-line"></div><div class="mock-doc-line short"></div>
            <div class="mock-doc-head">Metodologia</div><div class="mock-doc-line med"></div>
            <div class="mock-doc-head">Avaliação</div><div class="mock-doc-line short"></div>
          </div>
        </div>
        <p class="mock-caption"><span>Primeira versão do plano</span><span class="pill">Exemplo ilustrativo</span></p>
      </div>
      <div class="mock-card">
        <div class="mock-frame">
          <div class="mock-bar"><span></span><span></span><span></span></div>
          <div class="mock-body mock-export">
            <div class="file-row">
              <div class="file-badge"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 13h8M8 16.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>.docx</div>
              <div class="file-badge"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 13h8M8 16.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>.pdf</div>
            </div>
            <span class="btn btn-ghost" style="font-size:.82rem;padding:.6em 1.2em;pointer-events:none;"><svg class="icon" style="width:1em;height:1em;" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Exportar</span>
          </div>
        </div>
        <p class="mock-caption"><span>Exportação</span><span class="pill">Exemplo ilustrativo</span></p>
      </div>
    </div>
    <p class="result-note">Em breve: capturas reais da plataforma.</p>

    <div class="doc-divider">
      <p class="eyebrow">Formato real do documento</p>
      <h3 class="fs-h3" style="margin-top:10px;max-width:62ch;">Mesma estrutura de campos e tabelas do plano exportado, com habilidades da BNCC na íntegra</h3>
      <p class="lead" style="font-size:.95rem;margin-top:10px;max-width:72ch;">Os exemplos abaixo usam escola, professor(a) e município fictícios, apenas para mostrar o formato do documento. Nenhum dado real de aluno ou de escola é exibido, e nenhum selo ou logotipo oficial é usado nestes exemplos.</p>
    </div>
    <div class="mock-grid-docs">
      <div class="mock-card">
        <div class="mock-frame doc-mock">
          <div class="mock-bar"><span></span><span></span><span></span></div>
          <span class="doc-ribbon">Exemplo ilustrativo · dados fictícios</span>
          <div class="doc-head">
            <b>Escola:</b> Escola Estadual Exemplo (fictícia) &nbsp;·&nbsp; <b>Município:</b> Exemplo/SC<br>
            <b>Professor(a):</b> [nome do professor] &nbsp;·&nbsp; <b>Período:</b> 1º bimestre
          </div>
          <div class="doc-mock-scroll">
            <table class="doc-table">
              <tr><td class="lbl">Área de Conhecimento(s)</td><td class="val">Linguagens e suas Tecnologias</td></tr>
              <tr><td class="lbl">Componente(s) curricular(es)</td><td class="val">Língua Portuguesa — 1ª série do Ensino Médio</td></tr>
              <tr><td class="lbl">Número de aulas</td><td class="val">4 aulas (50 minutos cada)</td></tr>
              <tr><td class="lbl">Competência específica</td><td class="val">Competência Específica 2 de Linguagens e suas Tecnologias (BNCC)</td></tr>
              <tr><td class="lbl">Habilidade(s) selecionada(s)</td><td class="val">
                <span class="doc-skill"><code>EM13LP01</code> Relacionar o texto, tanto na produção como na leitura/escuta, com suas condições de produção e seu contexto sócio-histórico de circulação (leitor/audiência previstos, objetivos, pontos de vista e perspectivas, papel social do autor, época, gênero do discurso etc.).</span>
                <span class="doc-skill"><code>EM13LP05</code> Analisar, em textos argumentativos, os posicionamentos assumidos, os movimentos argumentativos (sustentação, refutação/contra-argumentação e negociação) e os argumentos utilizados para sustentá-los, para avaliar sua força e eficácia.</span>
              </td></tr>
              <tr><td class="lbl">Objeto(s) de conhecimento / conteúdos</td><td class="val">Textos argumentativos: contexto de produção e circulação; estratégias de persuasão; construção da argumentação (tese, argumentos e contra-argumentos).</td></tr>
              <tr><td class="lbl">Possível caminho metodológico</td><td class="val">Leitura e análise coletiva de um artigo de opinião, identificando tese e estratégias de persuasão; produção, em duplas, de um texto argumentativo sobre tema de interesse da turma, com roda de leitura e revisão por pares.</td></tr>
              <tr><td class="lbl">Critério(s) de avaliação</td><td class="val">Capacidade de identificar o contexto de produção de um texto argumentativo e de construir, no texto próprio, uma defesa de ponto de vista sustentada por argumentos consistentes.</td></tr>
              <tr><td class="lbl">Instrumentos de avaliação</td><td class="val">Produção textual individual; participação na roda de leitura; autoavaliação orientada por rubrica.</td></tr>
              <tr><td class="lbl">Referências</td><td class="val">BRASIL. Base Nacional Comum Curricular. Brasília: MEC, 2018. SANTA CATARINA. Currículo Base do Território Catarinense — Ensino Médio.</td></tr>
            </table>
          </div>
        </div>
        <p class="mock-caption"><span>Ensino Médio · Língua Portuguesa</span><span class="pill">Exemplo ilustrativo</span></p>
      </div>
      <div class="mock-card">
        <div class="mock-frame doc-mock">
          <div class="mock-bar"><span></span><span></span><span></span></div>
          <span class="doc-ribbon">Exemplo ilustrativo · dados fictícios</span>
          <div class="doc-head">
            <b>Escola:</b> Centro de Educação Infantil Exemplo (fictícia) &nbsp;·&nbsp; <b>Município:</b> Exemplo/SC<br>
            <b>Professor(a):</b> [nome do professor] &nbsp;·&nbsp; <b>Período:</b> 2º trimestre
          </div>
          <div class="doc-mock-scroll">
            <table class="doc-table">
              <tr><td class="lbl">Campo(s) de experiência</td><td class="val">Espaços, tempos, quantidades, relações e transformações</td></tr>
              <tr><td class="lbl">Grupo etário</td><td class="val">Crianças pequenas (4 anos a 5 anos e 11 meses)</td></tr>
              <tr><td class="lbl">Objetivos de aprendizagem e desenvolvimento</td><td class="val">
                <span class="doc-skill"><code>EI03ET01</code> Estabelecer relações de comparação entre objetos, observando suas propriedades.</span>
                <span class="doc-skill"><code>EI03ET07</code> Relacionar números às suas respectivas quantidades e identificar o antes, o depois e o entre em uma sequência.</span>
                <span class="doc-skill"><code>EI03ET08</code> Expressar medidas (peso, altura etc.), construindo gráficos básicos.</span>
              </td></tr>
              <tr><td class="lbl">Experiências e interações propostas</td><td class="val">Brincadeiras de contagem com material concreto (tampinhas e blocos); jogo de trilha com dados, registrando as quantidades percorridas; roda de comparação de alturas e pesos de brinquedos da sala, com registro em gráfico coletivo.</td></tr>
              <tr><td class="lbl">Metodologia / rotina</td><td class="val">Atividade em pequenos grupos, com manipulação de material concreto antes do registro gráfico; rotina semanal, intercalando jogos de contagem e registro em cartaz coletivo exposto na sala.</td></tr>
              <tr><td class="lbl">Instrumentos de registro</td><td class="val">Observação dirigida com registro fotográfico e anotações no portfólio individual da criança; cartaz coletivo de gráficos produzido pela turma.</td></tr>
              <tr><td class="lbl">Referências</td><td class="val">BRASIL. Base Nacional Comum Curricular. Brasília: MEC, 2018 — Campo de Experiências "Espaços, tempos, quantidades, relações e transformações". SANTA CATARINA. Currículo Base Catarinense da Educação Infantil e do Ensino Fundamental.</td></tr>
            </table>
          </div>
        </div>
        <p class="mock-caption"><span>Educação Infantil · Quantidades e relações</span><span class="pill">Exemplo ilustrativo</span></p>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="assinatura">
  <div class="wrap pricing-wrap">
    <div class="pricing-copy">
      <p class="eyebrow">Assinatura</p>
      <h2 class="fs-h2">Uma assinatura anual, acesso completo</h2>
      <p class="lead" style="font-size:1rem;">Um único plano, com acesso a todos os currículos e a todas as etapas cobertas pelo Plano Docente — sem módulos extras para negociar.</p>
      <details class="conditions" id="condicoes">
        <summary>Renovação, cancelamento e uso<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
        <div class="conditions-body">
          <p><strong>Vigência.</strong> A assinatura é anual e dá acesso à plataforma durante todo o período contratado.</p>
          <p><strong>Renovação.</strong> <span class="placeholder">Descreva aqui como funciona a renovação — automática ou manual, e com quanto tempo de antecedência o professor é avisado.</span></p>
          <p><strong>Cancelamento.</strong> <span class="placeholder">Descreva aqui as condições de cancelamento — até quando é possível cancelar e o que acontece com o acesso já pago.</span></p>
          <p><strong>Uso da conta.</strong> A assinatura é individual, para uso do professor titular da conta, e cobre todas as escolas e turmas em que ele leciona.</p>
        </div>
      </details>
    </div>
    <div class="pricing-card">
      <div>
        <p class="pricing-plan">Plano Docente · assinatura anual</p>
        <p class="pricing-amount">R$ <span class="placeholder" style="color:#fff;background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.6);">INSERIR VALOR</span><sub>/ano</sub></p>
      </div>
      <ul class="pricing-features">
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Acesso a todos os currículos listados nesta página</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Escolas, turmas e disciplinas ilimitadas numa única conta</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Primeira versão do plano estruturada a partir das suas escolhas</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Exportação em Word (.docx) e PDF</li>
        <li><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Atualizações da base de currículos incluídas durante a vigência</li>
      </ul>
      <a class="btn btn-on-gradient" href="#condicoes" id="verCondicoes">Conhecer as condições da assinatura</a>
      <p class="pricing-fineprint">Sem período de teste gratuito. Cobrança única, referente à vigência anual.</p>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap">
    <p class="eyebrow">Perguntas frequentes</p>
    <h2 class="fs-h2">O que professores perguntam antes de assinar</h2>
    <div class="faq-list">
      <details class="faq-item"><summary>É possível usar em mais de uma escola?<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><p class="faq-body">Sim. Uma mesma conta pode reunir várias escolas, turmas e disciplinas — útil para quem leciona em mais de uma unidade ou rede.</p></details>
      <details class="faq-item"><summary>Inclui cursos técnicos?<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><p class="faq-body">Sim. Além da Educação Infantil, do Ensino Fundamental e do Ensino Médio, a plataforma também contempla o planejamento para componentes de cursos técnicos da rede estadual.</p></details>
      <details class="faq-item"><summary>O Word pode ser editado?<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><p class="faq-body">Sim. O arquivo exportado em Word (.docx) é um documento comum, que você pode abrir, editar e formatar livremente no Word, no Google Docs ou no LibreOffice.</p></details>
      <details class="faq-item"><summary>Como funcionam as atualizações?<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><p class="faq-body">Quando os currículos oficiais são atualizados, a base de competências e habilidades do Plano Docente é atualizada e fica disponível automaticamente para todos os assinantes, sem custo adicional durante a vigência da assinatura.</p></details>
      <details class="faq-item"><summary>Existe teste grátis?<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><p class="faq-body">Não. O Plano Docente é oferecido apenas por assinatura anual, sem período de teste gratuito. Esta página mostra como a ferramenta funciona antes de você assinar.</p></details>
      <details class="faq-item"><summary>A plataforma é oficial da SED/SC?<svg class="chev icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><p class="faq-body">Não. O Plano Docente é uma ferramenta independente, desenvolvida fora da Secretaria de Estado da Educação de Santa Catarina. Ela usa os currículos públicos oficiais (BNCC e Currículo Catarinense) como referência, mas não tem vínculo, parceria ou chancela institucional com a SED/SC.</p></details>
    </div>
  </div>
</section>

<section class="section closing">
  <div class="mesh"><span class="b1"></span><span class="b2"></span><span class="b3"></span></div>
  <div class="wrap">
    <h2 class="fs-h2">Menos tempo reunindo documentos. Mais tempo para pensar na sua turma.</h2>
    <p>Organize seus currículos, estruture seus planos e leve mais tempo para o que realmente importa: a sua turma.</p>
    <a class="btn btn-primary" href="#assinatura">Conhecer a assinatura anual</a>
  </div>
</section>

</main>

<footer class="site-footer">
  <div class="wrap">
    <a class="brand" href="#inicio" style="text-decoration:none;">
      <svg class="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0%" style="stop-color:var(--primary)"/>
      <stop offset="100%" style="stop-color:var(--primary-2)"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#logoGrad)"/>
  <rect x="9" y="10.2" width="14" height="2.6" rx="1.3" fill="#fff"/>
  <rect x="9" y="15.4" width="10.5" height="2.6" rx="1.3" fill="#fff" fill-opacity=".85"/>
  <path d="M9 22.2 13 26.2 21.5 17.2" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
      <span class="brand-word">Plano Docente</span>
    </a>
    <nav class="footer-links" aria-label="Navegação do rodapé">
      <a href="#como-funciona">Como funciona</a>
      <a href="#santa-catarina">Para Santa Catarina</a>
      <a href="#assinatura">Assinatura</a>
      <a href="#faq">Perguntas</a>
      <a href="https://planodocente.com.br/login" target="_blank" rel="noopener noreferrer">Já é assinante? Entrar</a>
    </nav>
  </div>
  <div class="wrap"><p class="footer-note">O Plano Docente é uma ferramenta independente, sem vínculo, parceria ou chancela institucional com a Secretaria de Estado da Educação de Santa Catarina (SED/SC).</p></div>
  <div class="wrap footer-bottom">
    <span>&copy; <span id="year">2026</span> Plano Docente</span>
    <span>Ferramenta independente · sem vínculo com a SED/SC</span>
  </div>
</footer>`;

const PAGE_SCRIPT = `
(function(){
  try{ var y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); }catch(e){}
  try{
    var link = document.getElementById('verCondicoes');
    var det = document.getElementById('condicoes');
    if(link && det){ link.addEventListener('click', function(){ det.open = true; }); }
  }catch(e){}
})();
`;

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap"
        rel="stylesheet"
      />
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      {/* eslint-disable-next-line react/no-danger */}
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: PAGE_BODY_HTML }}
      />
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: PAGE_SCRIPT }} />
    </>
  );
}

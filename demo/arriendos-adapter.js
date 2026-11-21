/* Surtax · Demo SurArriendos: entrega al sistema la base simulada del navegador. Nada sale de este equipo. */
(function(){
  "use strict";
  var D = window.DemoDB;
  if(!D.seeded() && window.DemoSeedArriendos) D.seed(window.DemoSeedArriendos());
  var downloads = { save: function(o){
    var data = o.data, blob = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = o.filename || "archivo"; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); if(window.__demoTrack) window.__demoTrack("descarga"); return Promise.resolve();
  } };
  var user = { can: function(){ return Promise.resolve(true); }, isOwner: function(){ return true; }, canEdit: function(){ return Promise.resolve(true); },
    id: function(){ return Promise.resolve("demo"); }, me: function(){ return Promise.resolve({ id: "demo", name: "Demo" }); } };
  window.claude = { use: function(n){ return Promise.resolve(({ db: D.db, user: user, downloads: downloads })[n] || null); } };

  var realOpen = window.open;
  window.open = function(u){ var s = String(u || "");
    if(/wa\.me|whatsapp\.com|mailto:/.test(s)){ var t = ""; try { t = decodeURIComponent((s.split(/[?&](?:text|body)=/)[1] || "").replace(/\+/g, " ")); } catch(e){}
      if(window.__demoTrack) window.__demoTrack("aviso-arrendatario"); modal("Así se vería el aviso", "En la demo no se envía nada. Este es el mensaje que el sistema deja listo:", t); return null; }
    return realOpen.apply(window, arguments); };
  document.addEventListener("click", function(e){ var a = e.target.closest('a[href^="https://wa.me"],a[href^="mailto:"]'); if(!a || a.closest("#demo-bar")) return; e.preventDefault(); window.open(a.href); }, true);

  function modal(titulo, sub, texto){
    var d = document.getElementById("demo-modal"); if(!d){ d = document.createElement("div"); d.id = "demo-modal"; document.body.appendChild(d); }
    d.innerHTML = '<div class="dm-box"><h3></h3><p></p><pre></pre><button type="button">Entendido</button></div>';
    d.querySelector("h3").textContent = titulo; d.querySelector("p").textContent = sub; d.querySelector("pre").textContent = texto || ""; d.hidden = false;
    d.querySelector("button").onclick = function(){ d.hidden = true; };
  }
  var css = document.createElement("style");
  css.textContent =
    "#demo-bar{position:fixed;left:0;right:0;bottom:0;z-index:45;background:#06213C;color:#fff;font:14px/1.4 'PT Sans',system-ui,sans-serif;border-top:3px solid #A98A54;padding:8px max(12px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px))}" +
    "#demo-bar .in{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}#demo-bar b{color:#C19257}" +
    "#demo-bar button,#demo-bar a{font:600 13px 'PT Sans',system-ui,sans-serif;border:1px solid #C19257;background:transparent;color:#fff;padding:6px 10px;cursor:pointer;text-decoration:none}" +
    "#demo-bar a.cta{background:#A98A54;color:#06213C;border-color:#A98A54}main{padding-bottom:90px!important}" +
    "#demo-modal{position:fixed;inset:0;z-index:60;background:rgba(6,33,60,.55);display:grid;place-items:center;padding:16px}" +
    "#demo-modal .dm-box{background:#fff;color:#132338;max-width:480px;width:100%;padding:22px;display:grid;gap:10px;font:15px/1.5 'PT Sans',system-ui,sans-serif;border-top:4px solid #A98A54}" +
    "#demo-modal h3{margin:0;font:600 20px Georgia,serif}#demo-modal pre{white-space:pre-wrap;background:#F5F3EE;padding:12px;margin:0;font:14px/1.5 'PT Sans',system-ui,sans-serif}" +
    "#demo-modal button{justify-self:start;font:700 14px 'PT Sans',system-ui,sans-serif;background:#06213C;color:#fff;border:0;padding:10px 16px;cursor:pointer}";
  document.head.appendChild(css);
  function bar(){
    if(document.getElementById("demo-bar")) return;
    var b = document.createElement("div"); b.id = "demo-bar";
    b.innerHTML = '<div class="in"><span><b>DEMO</b> · Cartera de ejemplo: lo que registres queda solo en este equipo y no toca ninguna propiedad real.</span>' +
      '<span style="display:flex;gap:8px"><button type="button" id="demo-reset">Reiniciar demo</button><a class="cta" id="demo-cta" href="https://wa.me/56990787753?text=' +
      encodeURIComponent("Hola Jorge, probé la demo de SurArriendos y me interesa conversar la administración de mi propiedad.") + '" target="_blank" rel="noopener">Quiero SurArriendos</a></span></div>';
    document.body.appendChild(b);
    b.querySelector("#demo-reset").onclick = function(){ D.reset(); if(window.__demoTrack) window.__demoTrack("reiniciar"); location.reload(); };
    b.querySelector("#demo-cta").addEventListener("click", function(e){ if(window.__demoTrack) window.__demoTrack("cta-whatsapp"); e.preventDefault(); e.stopPropagation(); realOpen.call(window, this.href, "_blank", "noopener"); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bar); else bar();
})();

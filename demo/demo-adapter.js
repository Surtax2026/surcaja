/* Surtax · Demo SurCaja: reemplaza Firebase por la base simulada del navegador.
   La app funciona igual que la real, pero nada sale de este equipo. */
(function(){
  "use strict";
  var D = window.DemoDB;
  if(!D.seeded() && window.DemoSeedCaja) D.seed(window.DemoSeedCaja());
  var db = D.db;

  /* Rol que se está mirando: dueña (admin), caja del local o una profesional */
  var ROLKEY = "surtax-demo-caja-rol";
  function rolActual(){ try { return localStorage.getItem(ROLKEY) || "admin"; } catch(e){ return "admin"; } }
  var R = rolActual(), proId = R.indexOf("pro:") === 0 ? R.slice(4) : null, rol = proId ? "profesional" : R;

  var authUser = { uid: "demo-" + rol, email: "demo@surcaja.cl", getIdToken: function(){ return Promise.resolve("demo"); } };
  var auth = { currentUser: authUser, onAuthStateChanged: function(cb){ setTimeout(function(){ cb(authUser); }, 0); return function(){}; },
    signOut: function(){ return Promise.resolve(); }, signInWithEmailAndPassword: function(){ return Promise.resolve(); } };
  function fsFn(){ return db; }
  fsFn.FieldValue = D.FieldValue; fsFn.Timestamp = D.Timestamp;
  window.firebase = { apps: [1], initializeApp: function(){ return {}; }, firestore: fsFn, auth: function(){ return auth; } };

  var user = {
    canEdit: function(){ return Promise.resolve(rol === "admin"); },
    isOwner: function(){ return rol === "admin"; },
    rol: function(){ return rol; },
    profId: function(){ return proId; },
    id: function(){ return Promise.resolve(authUser.uid); },
    me: function(){ return Promise.resolve({ id: authUser.uid, name: "Demo" }); }
  };
  var downloads = { save: function(o){
    var data = o.data, blob = data instanceof Blob ? data : new Blob([data], { type: typeof data === "string" ? "text/html;charset=utf-8" : "application/octet-stream" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = o.filename || "archivo"; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); if(window.__demoTrack) window.__demoTrack("descarga"); return Promise.resolve();
  } };
  window.claude = { use: function(n){ return Promise.resolve(({ db: db, user: user, downloads: downloads })[n] || null); } };

  /* Cobro con la máquina de Mercado Pago: simulado */
  var MP = "surcaja-nuaspa.netlify.app/api", ordenes = {};
  var realFetch = window.fetch.bind(window);
  function jr(o, st){ return Promise.resolve(new Response(JSON.stringify(o), { status: st || 200, headers: { "Content-Type": "application/json" } })); }
  window.fetch = function(u, opt){
    var url = String(u && u.url || u);
    if(url.indexOf(MP) < 0) return realFetch(u, opt);
    var path = url.split("/api")[1] || "", m = (opt && opt.method || "GET").toUpperCase();
    if(window.__demoTrack) window.__demoTrack("mercadopago");
    if(path.indexOf("/status") === 0) return jr({ conectado: true, user_id: "DEMO", terminales: { data: { terminals: [{ id: "DEMO-POINT", operating_mode: "PDV" }] } } });
    if(path === "/orders" && m === "POST"){ var b = {}; try { b = JSON.parse(opt.body); } catch(e){}
      var id = "demo" + Date.now().toString(36); ordenes[id] = { t0: Date.now(), monto: b.amount }; return jr({ id: id, status: "created" }); }
    var mo = path.match(/^\/orders\/([^\/]+)(\/cancel)?$/);
    if(mo){ var o = ordenes[mo[1]] || { t0: Date.now() };
      if(mo[2]){ o.cancel = true; return jr({ id: mo[1], status: "canceled" }); }
      var dt = Date.now() - o.t0, st = o.cancel ? "canceled" : dt < 3000 ? "created" : dt < 7000 ? "at_terminal" : "processed";
      return jr({ id: mo[1], status: st, transactions: { payments: st === "processed" ? [{ id: "9" + Date.now().toString().slice(-9), reference_id: String(11200 + Math.floor(Math.random()*800)), tip_amount: 0 }] : [] } }); }
    if(path === "/oauth/link") return jr({ url: "#" });
    return jr({ ok: true, demo: true });
  };

  /* Mensajes de WhatsApp: en la demo se muestran, no se envían */
  var realOpen = window.open;
  window.open = function(u){
    var s = String(u || "");
    if(/wa\.me|whatsapp\.com/.test(s)){
      var t = ""; try { t = decodeURIComponent((s.split("text=")[1] || "").replace(/\+/g, " ")); } catch(e){}
      if(window.__demoTrack) window.__demoTrack("whatsapp");
      demoModal("Así se vería el WhatsApp", "En la demo no se envía nada. Este es el mensaje que SurCaja deja listo:", t);
      return null;
    }
    if(s === "#" ) return null;
    return realOpen.apply(window, arguments);
  };

  function demoModal(titulo, sub, texto){
    var d = document.getElementById("demo-modal");
    if(!d){ d = document.createElement("div"); d.id = "demo-modal"; document.body.appendChild(d); }
    d.innerHTML = '<div class="dm-box"><h3></h3><p class="dm-sub"></p><pre></pre><button type="button">Entendido</button></div>';
    d.querySelector("h3").textContent = titulo; d.querySelector(".dm-sub").textContent = sub; d.querySelector("pre").textContent = texto || "";
    d.hidden = false; d.querySelector("button").onclick = function(){ d.hidden = true; };
  }

  /* Franja de demo */
  var css = document.createElement("style");
  css.textContent =
    "#demo-bar{position:fixed;left:0;right:0;bottom:0;z-index:45;background:#06213C;color:#fff;font:14px/1.4 'PT Sans',system-ui,sans-serif;border-top:3px solid #A98A54;padding:8px max(12px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px))}" +
    "#demo-bar .in{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}" +
    "#demo-bar b{color:#C19257;letter-spacing:.5px}#demo-bar select,#demo-bar button,#demo-bar a{font:600 13px 'PT Sans',system-ui,sans-serif;border:1px solid #C19257;background:transparent;color:#fff;padding:6px 10px;border-radius:0;cursor:pointer;text-decoration:none}" +
    "#demo-bar a.cta{background:#A98A54;color:#06213C;border-color:#A98A54}#demo-bar select option{color:#06213C}" +
    "body{padding-bottom:64px!important}" +
    "#demo-modal{position:fixed;inset:0;z-index:60;background:rgba(6,33,60,.55);display:grid;place-items:center;padding:16px}" +
    "#demo-modal .dm-box{background:#fff;color:#132338;max-width:480px;width:100%;padding:22px;display:grid;gap:10px;font:15px/1.5 'PT Sans',system-ui,sans-serif;border-top:4px solid #A98A54}" +
    "#demo-modal h3{margin:0;font:600 20px 'Playfair Display',Georgia,serif}#demo-modal pre{white-space:pre-wrap;background:#F5F3EE;padding:12px;margin:0;font:14px/1.5 'PT Sans',system-ui,sans-serif}" +
    "#demo-modal button{justify-self:start;font:700 14px 'PT Sans',system-ui,sans-serif;background:#06213C;color:#fff;border:0;padding:10px 16px;cursor:pointer}";
  document.head.appendChild(css);
  function bar(){
    if(document.getElementById("demo-bar")) return;
    var pros = []; try { var st = D.raw(); Object.keys(st).forEach(function(p){ if(p.indexOf("profesionales/") === 0 && st[p].activo !== false) pros.push([p.slice(14), st[p].nombre]); }); } catch(e){}
    var b = document.createElement("div"); b.id = "demo-bar";
    if(window.DEMO_RESERVA){
      b.innerHTML = '<div class="in"><span><b>DEMO</b> · Así reserva tu clienta desde su celular. La solicitud llega al panel de la dueña en SurCaja.</span>' +
        '<span style="display:flex;gap:8px"><a href="index.html">Volver a SurCaja</a><a class="cta" id="demo-cta" href="https://wa.me/56990787753?text=' + encodeURIComponent("Hola Jorge, probé la demo de SurCaja y me interesa conversar un piloto para mi negocio.") + '" target="_blank" rel="noopener">Quiero SurCaja</a></span></div>';
      document.body.appendChild(b);
      b.querySelector("#demo-cta").addEventListener("click", function(e){ if(window.__demoTrack) window.__demoTrack("cta-whatsapp"); e.stopPropagation(); realOpen.call(window, this.href, "_blank", "noopener"); e.preventDefault(); });
      return;
    }
    document.addEventListener("click", function(e){ var a = e.target.closest("[data-demo-no]"); if(!a) return; e.preventDefault(); demoModal("No disponible en la demo", "Los contratos y la firma electrónica de las profesionales se muestran en la reunión, con tu propio salón.", ""); }, true);
    b.innerHTML ='<div class="in"><span><b>DEMO</b> · Datos de ejemplo: lo que hagas queda solo en este equipo y no se guarda en ningún negocio real.</span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label style="display:flex;gap:6px;align-items:center">Ver como <select id="demo-rol">' +
      '<option value="admin">Dueña</option><option value="caja">Caja del local</option>' + pros.map(function(p){ return '<option value="pro:' + p[0] + '">Profesional: ' + p[1] + '</option>'; }).join("") +
      '</select></label><button type="button" id="demo-reset">Reiniciar demo</button><a class="cta" id="demo-cta" href="https://wa.me/56990787753?text=' + encodeURIComponent("Hola Jorge, probé la demo de SurCaja y me interesa conversar un piloto para mi negocio.") + '" target="_blank" rel="noopener">Quiero SurCaja</a></span></div>';
    document.body.appendChild(b);
    var s = b.querySelector("#demo-rol"); s.value = R;
    s.onchange = function(){ try { localStorage.setItem(ROLKEY, s.value); } catch(e){} if(window.__demoTrack) window.__demoTrack("rol:" + s.value.split(":")[0]); location.reload(); };
    b.querySelector("#demo-reset").onclick = function(){ D.reset(); try { localStorage.removeItem(ROLKEY); } catch(e){} if(window.__demoTrack) window.__demoTrack("reiniciar"); location.reload(); };
    b.querySelector("#demo-cta").addEventListener("click", function(e){ if(window.__demoTrack) window.__demoTrack("cta-whatsapp"); e.stopPropagation(); realOpen.call(window, this.href, "_blank", "noopener"); e.preventDefault(); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bar); else bar();
  window.__demoModal = demoModal;
  window.__sxAuth = auth; window.__sxFs = db;
})();

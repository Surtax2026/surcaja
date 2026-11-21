/* Surtax · Registro de visitantes de las demos.
   Pide nombre, negocio, comuna y WhatsApp con consentimiento, y anota qué secciones mira (no lo que escribe).
   Se guarda en la colección "leads" de Firebase; solo Surtax puede leerla. */
(function(){
  "use strict";
  var CFG = window.DEMO_LEAD || {};
  var DEMO = CFG.demo || "surcaja";                 // "surcaja" | "surarriendos"
  var PROJECT = "surcaja-4a0ea", API_KEY = "AIzaSyBZIagnxus7XWJTgQjfFcbgXLa71lcRCuA";
  var BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/";
  var LKEY = "surtax-lead-v1";

  function lead(){ try { return JSON.parse(localStorage.getItem(LKEY) || "null"); } catch(e){ return null; } }
  function setLead(o){ try { localStorage.setItem(LKEY, JSON.stringify(o)); } catch(e){} }
  function val(v){
    if(v === null || v === undefined) return { nullValue: null };
    if(typeof v === "boolean") return { booleanValue: v };
    if(typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if(v instanceof Date) return { timestampValue: v.toISOString() };
    if(Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
    if(typeof v === "object"){ var f = {}; Object.keys(v).forEach(function(k){ f[k] = val(v[k]); }); return { mapValue: { fields: f } }; }
    return { stringValue: String(v) };
  }
  function fields(o){ var f = {}; Object.keys(o).forEach(function(k){ f[k] = val(o[k]); }); return { fields: f }; }
  function post(path, body, keep){
    return fetch(BASE + path + (path.indexOf("?") < 0 ? "?" : "&") + "key=" + API_KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: !!keep })
      .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function nid(){ var c = "abcdefghijkmnpqrstuvwxyz23456789", s = ""; for(var i=0;i<16;i++) s += c[Math.floor(Math.random()*c.length)]; return s; }
  function origen(){ var q = new URLSearchParams(location.search); return q.get("o") || q.get("utm_source") || (document.referrer ? (function(){ try { return new URL(document.referrer).hostname; } catch(e){ return ""; } })() : "directo"); }

  /* ---------- Actividad ---------- */
  var act = {}, t0 = Date.now(), activo = 0, ultimo = Date.now(), enviado = 0;
  function track(k){ k = String(k || "").replace(/\s+/g, " ").trim().slice(0, 40); if(!k) return; act[k] = (act[k] || 0) + 1; }
  window.__demoTrack = track;
  document.addEventListener("click", function(e){
    var el = e.target.closest("[data-tab],[data-act],nav button,nav a,.tabs button,button,a"); if(!el) return;
    if(el.closest("#demo-gate")) return;
    var tab = el.getAttribute("data-tab"), a = el.getAttribute("data-act");
    if(tab) track("ver:" + tab); else if(a) track("accion:" + a); else track("clic:" + (el.textContent || el.getAttribute("aria-label") || "").slice(0, 30));
  }, true);
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function(ev){ window.addEventListener(ev, function(){ var n = Date.now(); if(n - ultimo < 60e3) activo += n - ultimo; ultimo = n; }, { passive: true, capture: true }); });
  function flush(keep){
    var L = lead(), D = L && L[DEMO]; if(!D || !D.ok) return;
    if(!Object.keys(act).length && activo - enviado < 15e3) return;
    var body = fields({ t: new Date(), demo: DEMO, pagina: location.pathname.split("/").pop() || "index.html", segundos: Math.round((activo - enviado) / 1000), acciones: act });
    act = {}; enviado = activo;
    post("leads/" + D.id + "/eventos", body, keep).catch(function(){});
  }
  setInterval(function(){ flush(false); }, 45e3);
  window.addEventListener("pagehide", function(){ flush(true); });
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "hidden") flush(true); });

  /* ---------- Formulario de ingreso ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#demo-gate{position:fixed;inset:0;z-index:70;background:rgba(6,33,60,.82);display:grid;place-items:center;padding:16px;overflow:auto}" +
    "#demo-gate .g{background:#fff;color:#132338;width:100%;max-width:440px;padding:24px;display:grid;gap:12px;font:15px/1.5 'PT Sans',system-ui,sans-serif;border-top:4px solid #A98A54}" +
    "#demo-gate .ey{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#956A32;font-weight:700}" +
    "#demo-gate h2{margin:0;font:600 24px/1.2 'Playfair Display',Georgia,serif;color:#06213C}" +
    "#demo-gate label{display:grid;gap:4px;font-size:13px;font-weight:700;color:#3b4656}" +
    "#demo-gate input,#demo-gate select{font:16px 'PT Sans',system-ui,sans-serif;padding:10px 12px;border:1px solid #cfc8b8;border-radius:0;background:#fff;color:#132338}" +
    "#demo-gate .ck{display:flex;gap:10px;align-items:flex-start;font-weight:400;font-size:13.5px}#demo-gate .ck input{margin-top:3px;width:18px;height:18px}" +
    "#demo-gate button{font:700 16px 'PT Sans',system-ui,sans-serif;background:#A98A54;color:#06213C;border:0;padding:12px;cursor:pointer}" +
    "#demo-gate .falta{color:#a3312f;font-size:13.5px;min-height:18px;margin:0}#demo-gate .leg{font-size:12px;color:#6b7480;margin:0}" +
    "#demo-gate .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:420px){#demo-gate .two{grid-template-columns:1fr}}";
  document.head.appendChild(css);

  var listo, resolver; listo = new Promise(function(r){ resolver = r; });
  window.DemoLead = { listo: listo };

  function gate(){
    var esArr = DEMO === "surarriendos";
    var d = document.createElement("div"); d.id = "demo-gate";
    d.innerHTML = '<form class="g" novalidate><span class="ey">Demo · ' + (esArr ? "SurArriendos" : "SurCaja") + '</span>' +
      '<h2>' + (esArr ? "Prueba cómo administramos un arriendo" : "Prueba SurCaja con un salón de ejemplo") + '</h2>' +
      '<p style="margin:0;color:#5b6472">Antes de entrar, cuéntanos quién eres. Usas datos de ejemplo: nada de lo que hagas queda guardado.</p>' +
      '<label for="lg-nom">Tu nombre<input id="lg-nom" autocomplete="name" maxlength="60"></label>' +
      '<div class="two"><label for="lg-neg">' + (esArr ? "¿Cuántas propiedades arriendas?" : "Nombre de tu negocio") + (esArr
        ? '<select id="lg-neg"><option value="">Elige</option><option>1</option><option>2 a 3</option><option>4 a 10</option><option>Más de 10</option><option>Soy corredor o administrador</option></select>'
        : '<input id="lg-neg" autocomplete="organization" maxlength="60">') + '</label>' +
      '<label for="lg-com">Comuna<input id="lg-com" maxlength="40" autocomplete="address-level2"></label></div>' +
      (esArr ? "" : '<label for="lg-rub">Rubro<select id="lg-rub"><option value="">Elige</option><option>Salón de belleza</option><option>Uñas</option><option>Barbería</option><option>Peluquería</option><option>Estética o spa</option><option>Pestañas y cejas</option><option>Kinesiología o salud</option><option>Otro</option></select></label>') +
      '<label for="lg-tel">WhatsApp<input id="lg-tel" inputmode="tel" autocomplete="tel" placeholder="+56 9 1234 5678" maxlength="20"></label>' +
      '<label class="ck" for="lg-ok"><input id="lg-ok" type="checkbox"><span>Acepto que Surtax me contacte por WhatsApp para contarme de ' + (esArr ? "SurArriendos" : "SurCaja") + '.</span></label>' +
      '<p class="falta" id="lg-falta" role="alert"></p><button type="submit">Entrar a la demo</button>' +
      '<p class="leg">Tus datos los usa solo Surtax para contactarte por este servicio. Puedes pedir que los borremos escribiendo al +56 9 9078 7753.</p></form>';
    document.body.appendChild(d);
    var f = d.querySelector("form");
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var g = function(id){ var el = d.querySelector(id); return el ? el.value.trim() : ""; };
      var tel = g("#lg-tel").replace(/[^\d+]/g, ""); if(/^9\d{8}$/.test(tel)) tel = "+56" + tel; if(/^569\d{8}$/.test(tel)) tel = "+" + tel;
      var falta = [];
      if(g("#lg-nom").length < 2) falta.push("tu nombre");
      if(!g("#lg-neg")) falta.push(esArr ? "cuántas propiedades arriendas" : "el nombre de tu negocio");
      if(!g("#lg-com")) falta.push("tu comuna");
      if(!/^\+569\d{8}$/.test(tel)) falta.push("un WhatsApp válido (+56 9 y 8 dígitos)");
      if(!d.querySelector("#lg-ok").checked) falta.push("aceptar que te contactemos");
      if(falta.length){ d.querySelector("#lg-falta").textContent = "Falta: " + falta.join(", ") + "."; return; }
      var prev = lead() || {}, base = prev.base || nid(), lid = base + "-" + DEMO;
      var datos = { nombre: g("#lg-nom"), negocio: esArr ? "" : g("#lg-neg"), propiedades: esArr ? g("#lg-neg") : "", rubro: g("#lg-rub"), comuna: g("#lg-com"), whatsapp: tel,
        consentimiento: true, demo: DEMO, origen: origen(), creado: new Date(), pagina: location.href.split("?")[0] };
      var btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Entrando…";
      var L = prev; L.base = base; L.nombre = datos.nombre; L[DEMO] = { id: lid, ok: false };
      setLead(L);
      post("leads?documentId=" + lid, fields(datos)).then(function(){ L[DEMO].ok = true; setLead(L); })
        .catch(function(){ L[DEMO].pendiente = datos; setLead(L); })
        .then(function(){ d.remove(); t0 = Date.now(); ultimo = Date.now(); track("entrada"); resolver(); });
    });
    setTimeout(function(){ var i = d.querySelector("#lg-nom"); if(i) i.focus(); }, 50);
  }
  function inicio(){
    var L = lead(), D = L && L[DEMO];
    if(D && D.ok){ track("vuelve"); resolver(); return; }
    if(D && D.pendiente){ // reintenta un registro que no alcanzó a llegar
      var pd = D.pendiente; pd.creado = new Date(pd.creado);
      post("leads?documentId=" + D.id, fields(pd)).then(function(){ D.ok = true; delete D.pendiente; setLead(L); }).catch(function(){});
      resolver(); return;
    }
    gate();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicio); else inicio();
})();

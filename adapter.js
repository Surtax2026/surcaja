/* SurCaja web: adaptador Firebase que entrega a la app la misma interfaz que usaba dentro de Claude
   (claude.use("db" | "user" | "downloads")), más inicio de sesión y roles. */
(function(){
  "use strict";
  var cfg = window.SURCAJA_FIREBASE;
  firebase.initializeApp(cfg);
  var auth = firebase.auth(), fs = firebase.firestore();
  var perfil = null, listo, resolver;
  listo = new Promise(function(r){ resolver = r; });

  var css = document.createElement("style");
  css.textContent = "#sx-login{position:fixed;inset:0;z-index:50;background:var(--bg,#f5f3f7);display:flex;align-items:center;justify-content:center;padding:16px}"+
    "#sx-login .box{background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:16px;padding:24px;width:100%;max-width:380px;display:grid;gap:12px;font:16px/1.5 system-ui,sans-serif;color:var(--ink,#222)}"+
    "#sx-login h1{margin:0;font-size:26px}#sx-login p{margin:0;color:var(--muted,#666);font-size:15px}"+
    "#sx-login label{display:grid;gap:4px;font-size:14px;font-weight:600}#sx-login input{font-size:17px;padding:11px 12px;border:1px solid var(--line,#ccc);border-radius:10px;background:var(--bg,#fff);color:var(--ink,#222)}"+
    "#sx-login button{font:700 16px system-ui,sans-serif;border:0;border-radius:10px;padding:12px;cursor:pointer;background:var(--plum,#5b2a6e);color:#fff}"+
    "#sx-login button.sec{background:transparent;color:var(--plum,#5b2a6e);border:1px solid var(--line,#ccc)}#sx-login .msg{min-height:20px;color:#a3312f;font-size:14px}"+
    "#sx-salir{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:40;font:600 13px system-ui,sans-serif;border:1px solid var(--line,#ccc);background:var(--surface,#fff);color:var(--muted,#555);border-radius:999px;padding:6px 12px;cursor:pointer}";
  document.head.appendChild(css);

  function pantalla(html){
    var d = document.getElementById("sx-login");
    if(!d){ d = document.createElement("div"); d.id = "sx-login"; document.body.appendChild(d); }
    d.innerHTML = '<div class="box">'+html+'</div>'; d.hidden = false; return d;
  }
  function ocultar(){ var d = document.getElementById("sx-login"); if(d) d.hidden = true; }
  function msg(t){ var m = document.querySelector("#sx-login .msg"); if(m) m.textContent = t; }
  function errTxt(e){
    var c = e && e.code || "";
    if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "Correo o clave incorrectos.";
    if(/email-already-in-use/.test(c)) return "Ese correo ya tiene cuenta: usa Ingresar.";
    if(/weak-password/.test(c)) return "La clave debe tener al menos 6 caracteres.";
    if(/invalid-email/.test(c)) return "Revisa el correo.";
    if(/network/.test(c)) return "Sin conexión a internet.";
    return "No se pudo completar. Intenta de nuevo.";
  }
  function login(){
    var d = pantalla('<h1>SurCaja</h1><p>Ingresa con tu correo y tu clave.</p>'+
      '<label for="sx-mail">Correo<input id="sx-mail" type="email" autocomplete="username" inputmode="email"></label>'+
      '<label for="sx-pass">Clave<input id="sx-pass" type="password" autocomplete="current-password"></label>'+
      '<div class="msg" role="alert"></div><button type="button" id="sx-in">Ingresar</button>'+
      '<button type="button" class="sec" id="sx-new">Crear mi cuenta</button><button type="button" class="sec" id="sx-olv">Olvidé mi clave</button>');
    var mail = function(){ return d.querySelector("#sx-mail").value.trim(); }, pass = function(){ return d.querySelector("#sx-pass").value; };
    d.querySelector("#sx-in").onclick = function(){ msg(""); auth.signInWithEmailAndPassword(mail(), pass()).catch(function(e){ msg(errTxt(e)); }); };
    d.querySelector("#sx-new").onclick = function(){ msg(""); auth.createUserWithEmailAndPassword(mail(), pass()).catch(function(e){ msg(errTxt(e)); }); };
    d.querySelector("#sx-olv").onclick = function(){ if(!mail()){ msg("Escribe tu correo primero."); return; }
      auth.sendPasswordResetEmail(mail()).then(function(){ msg("Te enviamos un correo para cambiar la clave."); }).catch(function(e){ msg(errTxt(e)); }); };
    d.querySelector("#sx-pass").onkeydown = function(ev){ if(ev.key === "Enter") d.querySelector("#sx-in").click(); };
  }
  function pendiente(email){
    var d = pantalla('<h1>Cuenta creada</h1><p>Tu cuenta <b>'+String(email).replace(/[<>&]/g,"")+'</b> está lista. Pídele a la administradora del salón que te habilite y vuelve a entrar.</p>'+
      '<button type="button" id="sx-re">Ya me habilitaron</button><button type="button" class="sec" id="sx-out">Salir</button>');
    d.querySelector("#sx-re").onclick = function(){ location.reload(); };
    d.querySelector("#sx-out").onclick = function(){ auth.signOut(); };
  }
  auth.onAuthStateChanged(function(u){
    if(!u){ perfil = null; login(); return; }
    var ref = fs.collection("usuarios").doc(u.uid);
    ref.get().then(function(s){
      if(s.exists) return s.data();
      // Las reglas solo aceptan rol admin para los correos autorizados; si lo rechazan, queda pendiente.
      var base = { email: (u.email||"").toLowerCase(), creado: new Date().toISOString() };
      var adm = Object.assign({ rol: "admin" }, base), pen = Object.assign({ rol: "pendiente" }, base);
      return ref.set(adm).then(function(){ return adm; }, function(){ return ref.set(pen).then(function(){ return pen; }); });
    }).then(function(p){
      if(!p || p.rol === "pendiente" || !p.rol){ pendiente(u.email); return; }
      perfil = Object.assign({ uid: u.uid }, p); ocultar();
      if(!document.getElementById("sx-salir")){ var b = document.createElement("button"); b.id = "sx-salir"; b.type = "button";
        b.textContent = "Salir ("+(u.email||"")+")"; b.onclick = function(){ auth.signOut().then(function(){ location.reload(); }); }; document.body.appendChild(b); }
      resolver();
    }).catch(function(e){ console.warn(e); pantalla('<h1>SurCaja</h1><p>No se pudo cargar tu cuenta. Revisa tu conexión y recarga.</p>'); });
  });

  var user = {
    canEdit: function(){ return Promise.resolve(!!perfil && perfil.rol === "admin"); },
    isOwner: function(){ return !!perfil && perfil.rol === "admin"; },
    rol: function(){ return perfil ? perfil.rol : null; },
    profId: function(){ return perfil && perfil.rol === "profesional" ? (perfil.profId || null) : null; },
    id: function(){ return Promise.resolve(perfil ? perfil.uid : null); },
    me: function(){ return Promise.resolve({ id: perfil && perfil.uid, name: perfil && perfil.email }); }
  };
  var downloads = { save: function(o){
    var data = o.data, blob = data instanceof Blob ? data : new Blob([data], { type: typeof data === "string" ? "text/html;charset=utf-8" : "application/octet-stream" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = o.filename || "archivo"; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); return Promise.resolve();
  } };
  window.claude = { use: function(n){ return listo.then(function(){ return ({ db: fs, user: user, downloads: downloads })[n] || null; }); } };
  window.__sxAuth = auth; window.__sxFs = fs;
})();

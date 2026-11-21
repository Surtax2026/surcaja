/* Surtax · Motor de demo: base de datos simulada con la misma interfaz que Firestore (compat).
   Todo vive en el navegador del visitante (localStorage). Nada se envía a la base real. */
(function(){
  "use strict";
  var KEY = (window.DEMO_KEY || "surtax-demo") + "-v1";
  var store = {};           // path -> data
  var listeners = [];       // {kind:"doc"|"query", path|q, cb, err}
  var seq = 0;

  function clone(o){ return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function load(){ try { var s = localStorage.getItem(KEY); if(s){ store = JSON.parse(s).store || {}; return true; } } catch(e){} return false; }
  var saveT = null;
  function save(){ clearTimeout(saveT); saveT = setTimeout(function(){ try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), store: store })); } catch(e){} }, 150); }
  function autoId(){ var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", s = ""; for(var i=0;i<20;i++) s += c[Math.floor(Math.random()*c.length)]; return s; }
  function parent(p){ var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
  function last(p){ return p.slice(p.lastIndexOf("/") + 1); }

  /* Valores especiales */
  var DEL = { __op: "delete" };
  function FV(){}
  FV.delete = function(){ return DEL; };
  FV.serverTimestamp = function(){ return { __op: "ts" }; };
  FV.increment = function(n){ return { __op: "inc", n: n }; };
  FV.arrayUnion = function(){ return { __op: "union", v: [].slice.call(arguments) }; };
  FV.arrayRemove = function(){ return { __op: "remove", v: [].slice.call(arguments) }; };
  function Timestamp(ms){ this._ms = ms; }
  Timestamp.prototype.toDate = function(){ return new Date(this._ms); };
  Timestamp.prototype.toMillis = function(){ return this._ms; };
  Timestamp.now = function(){ return new Timestamp(Date.now()); };
  Timestamp.fromDate = function(d){ return new Timestamp(d.getTime()); };

  function revive(v){
    if(v && typeof v === "object"){
      if(v.__ts != null) return new Timestamp(v.__ts);
      if(Array.isArray(v)) return v.map(revive);
      var o = {}; for(var k in v) o[k] = revive(v[k]); return o;
    }
    return v;
  }
  function freeze(v){
    if(v instanceof Timestamp) return { __ts: v._ms };
    if(v instanceof Date) return { __ts: v.getTime() };
    if(v && typeof v === "object"){
      if(v.__op === "ts") return { __ts: Date.now() };
      if(Array.isArray(v)) return v.map(freeze);
      var o = {}; for(var k in v) o[k] = freeze(v[k]); return o;
    }
    return v;
  }
  function applyOp(cur, v){
    if(v && v.__op === "inc") return (Number(cur) || 0) + v.n;
    if(v && v.__op === "union"){ var a = Array.isArray(cur) ? cur.slice() : []; v.v.forEach(function(x){ if(a.indexOf(x) < 0) a.push(x); }); return a; }
    if(v && v.__op === "remove"){ return (Array.isArray(cur) ? cur : []).filter(function(x){ return v.v.indexOf(x) < 0; }); }
    return freeze(v);
  }
  function setPath(obj, dotted, v){
    var ks = dotted.split("."), o = obj;
    for(var i=0;i<ks.length-1;i++){ if(!o[ks[i]] || typeof o[ks[i]] !== "object") o[ks[i]] = {}; o = o[ks[i]]; }
    var k = ks[ks.length-1];
    if(v === DEL || (v && v.__op === "delete")) delete o[k]; else o[k] = applyOp(o[k], v);
  }
  function getPath(obj, dotted){ var ks = dotted.split("."), o = obj; for(var i=0;i<ks.length;i++){ if(o == null) return undefined; o = o[ks[i]]; } return o; }
  function merge(dst, src){
    for(var k in src){ var v = src[k];
      if(v === DEL || (v && v.__op === "delete")) delete dst[k];
      else if(v && typeof v === "object" && !Array.isArray(v) && !v.__op && !(v instanceof Timestamp) && !(v instanceof Date) && dst[k] && typeof dst[k] === "object" && !Array.isArray(dst[k])) merge(dst[k], v);
      else dst[k] = applyOp(dst[k], v);
    }
  }
  function strip(o){ var r = {}; for(var k in o){ var v = o[k]; if(v === DEL || (v && v.__op === "delete")) continue; r[k] = (v && typeof v === "object" && !Array.isArray(v) && !v.__op && !(v instanceof Timestamp) && !(v instanceof Date)) ? strip(v) : freeze(v); } return r; }

  /* Snapshots */
  function DocSnap(path){ this.id = last(path); this.ref = new DocRef(path); this.exists = Object.prototype.hasOwnProperty.call(store, path); this._d = this.exists ? store[path] : undefined; }
  DocSnap.prototype.data = function(){ return this._d === undefined ? undefined : revive(clone(this._d)); };
  DocSnap.prototype.get = function(f){ var d = this.data(); return d ? getPath(d, f) : undefined; };
  function QuerySnap(paths, prev){
    var self = this;
    this.docs = paths.map(function(p){ return new DocSnap(p); });
    this.size = this.docs.length; this.empty = this.size === 0;
    this._prev = prev;
  }
  QuerySnap.prototype.forEach = function(fn){ this.docs.forEach(fn); };
  QuerySnap.prototype.docChanges = function(){
    var prev = this._prev || {}, out = [], now = {};
    this.docs.forEach(function(d, i){ var js = JSON.stringify(d._d); now[d.ref.path] = js;
      if(!(d.ref.path in prev)) out.push({ type: "added", doc: d, newIndex: i, oldIndex: -1 });
      else if(prev[d.ref.path] !== js) out.push({ type: "modified", doc: d, newIndex: i, oldIndex: i }); });
    Object.keys(prev).forEach(function(p){ if(!(p in now)) out.push({ type: "removed", doc: new DocSnap(p), newIndex: -1, oldIndex: 0 }); });
    return out;
  };

  /* Referencias */
  function DocRef(path){ this.path = path; this.id = last(path); }
  DocRef.prototype.collection = function(n){ return new Query(this.path + "/" + n); };
  Object.defineProperty(DocRef.prototype, "parent", { get: function(){ return new Query(parent(this.path)); } });
  DocRef.prototype.get = function(){ return Promise.resolve(new DocSnap(this.path)); };
  DocRef.prototype._set = function(data, opt){
    if(opt && (opt.merge || opt.mergeFields) && store[this.path]){ var cur = clone(store[this.path]); merge(cur, data); store[this.path] = cur; }
    else store[this.path] = strip(data);
  };
  DocRef.prototype._update = function(a, b){
    if(!store[this.path]){ var e = new Error("No document to update: " + this.path); e.code = "not-found"; throw e; }
    var cur = clone(store[this.path]);
    if(typeof a === "string"){ var args = [].slice.call(arguments); for(var i=0;i<args.length;i+=2) setPath(cur, args[i], args[i+1]); }
    else for(var k in a) setPath(cur, k, a[k]);
    store[this.path] = cur;
  };
  DocRef.prototype.set = function(data, opt){ try { this._set(data, opt); } catch(e){ return Promise.reject(e); } changed(); return Promise.resolve(); };
  DocRef.prototype.update = function(){ try { this._update.apply(this, arguments); } catch(e){ return Promise.reject(e); } changed(); return Promise.resolve(); };
  DocRef.prototype.delete = function(){ delete store[this.path]; changed(); return Promise.resolve(); };
  DocRef.prototype.onSnapshot = function(a, b, c){
    var cb = typeof a === "function" ? a : b, err = typeof a === "function" ? b : c;
    var L = { kind: "doc", path: this.path, cb: cb, err: err, last: null };
    listeners.push(L); fire(L);
    return function(){ var i = listeners.indexOf(L); if(i >= 0) listeners.splice(i, 1); };
  };
  DocRef.prototype.isEqual = function(o){ return o && o.path === this.path; };

  function Query(path, filters, order, lim){ this.path = path; this.id = last(path); this._f = filters || []; this._o = order || []; this._l = lim || 0; }
  Query.prototype.doc = function(id){ return new DocRef(this.path + "/" + (id || autoId())); };
  Query.prototype.add = function(data){ var r = this.doc(); return r.set(data).then(function(){ return r; }); };
  Query.prototype.where = function(f, op, v){ return new Query(this.path, this._f.concat([[f, op, v]]), this._o, this._l); };
  Query.prototype.orderBy = function(f, d){ return new Query(this.path, this._f, this._o.concat([[f, d === "desc" ? -1 : 1]]), this._l); };
  Query.prototype.limit = function(n){ return new Query(this.path, this._f, this._o, n); };
  Query.prototype.limitToLast = Query.prototype.limit;
  Query.prototype.startAfter = function(){ return this; };
  function cmp(a, b){ if(a instanceof Object && a.__ts != null) a = a.__ts; if(b instanceof Timestamp) b = b._ms; if(b instanceof Date) b = b.getTime(); if(a === b) return 0; if(a === undefined || a === null) return -1; if(b === undefined || b === null) return 1; return a < b ? -1 : 1; }
  function test(d, f){
    var v = f[0] === "__name__" ? undefined : getPath(d, f[0]), op = f[1], x = f[2];
    switch(op){
      case "==": return JSON.stringify(v) === JSON.stringify(x);
      case "!=": return v !== undefined && JSON.stringify(v) !== JSON.stringify(x);
      case "<": return v !== undefined && cmp(v, x) < 0;
      case "<=": return v !== undefined && cmp(v, x) <= 0;
      case ">": return v !== undefined && cmp(v, x) > 0;
      case ">=": return v !== undefined && cmp(v, x) >= 0;
      case "in": return (x || []).some(function(y){ return JSON.stringify(y) === JSON.stringify(v); });
      case "not-in": return v !== undefined && !(x || []).some(function(y){ return JSON.stringify(y) === JSON.stringify(v); });
      case "array-contains": return Array.isArray(v) && v.some(function(y){ return JSON.stringify(y) === JSON.stringify(x); });
      case "array-contains-any": return Array.isArray(v) && v.some(function(y){ return (x || []).some(function(z){ return JSON.stringify(z) === JSON.stringify(y); }); });
    }
    return false;
  }
  Query.prototype._paths = function(){
    var self = this, pre = this.path + "/";
    var ps = Object.keys(store).filter(function(p){ return p.indexOf(pre) === 0 && p.slice(pre.length).indexOf("/") < 0; });
    ps = ps.filter(function(p){ var d = store[p]; return self._f.every(function(f){ return test(d, f); }); });
    if(this._o.length) ps.sort(function(a, b){ for(var i=0;i<self._o.length;i++){ var o = self._o[i], c = cmp(getPath(store[a], o[0]), getPath(store[b], o[0])); if(c) return c * o[1]; } return 0; });
    else ps.sort();
    if(this._l) ps = ps.slice(0, this._l);
    return ps;
  };
  Query.prototype.get = function(){ return Promise.resolve(new QuerySnap(this._paths())); };
  Query.prototype.onSnapshot = function(a, b, c){
    var cb = typeof a === "function" ? a : b, err = typeof a === "function" ? b : c;
    var L = { kind: "query", q: this, cb: cb, err: err, last: null, prev: null };
    listeners.push(L); fire(L);
    return function(){ var i = listeners.indexOf(L); if(i >= 0) listeners.splice(i, 1); };
  };

  function fire(L){
    setTimeout(function(){
      if(listeners.indexOf(L) < 0) return;
      try {
        if(L.kind === "doc"){ var js = JSON.stringify(store[L.path]); if(js === L.last && L.last !== null) return; L.last = js === undefined ? "u" : js; L.cb(new DocSnap(L.path)); }
        else { var ps = L.q._paths(), js2 = JSON.stringify(ps.map(function(p){ return [p, store[p]]; })); if(js2 === L.last) return; L.last = js2;
          var snap = new QuerySnap(ps, L.prev); var m = {}; ps.forEach(function(p){ m[p] = JSON.stringify(store[p]); }); L.prev = m; L.cb(snap); }
      } catch(e){ console.warn("demo listener", e); }
    }, 0);
  }
  function changed(){ save(); listeners.slice().forEach(fire); if(window.__demoTrack) window.__demoTrack("guardar"); }

  function Batch(){ this.ops = []; }
  Batch.prototype.set = function(r, d, o){ this.ops.push(function(){ r._set(d, o); }); return this; };
  Batch.prototype.update = function(r){ var a = [].slice.call(arguments, 1); this.ops.push(function(){ r._update.apply(r, a); }); return this; };
  Batch.prototype.delete = function(r){ this.ops.push(function(){ delete store[r.path]; }); return this; };
  Batch.prototype.commit = function(){ var snap = clone(store); try { this.ops.forEach(function(f){ f(); }); } catch(e){ store = snap; return Promise.reject(e); } changed(); return Promise.resolve(); };

  var db = {
    collection: function(n){ return new Query(n); },
    doc: function(p){ return new DocRef(p); },
    batch: function(){ return new Batch(); },
    runTransaction: function(fn){
      var b = new Batch(); var tx = { get: function(r){ return r.get(); }, set: function(r, d, o){ b.set(r, d, o); return tx; }, update: function(r){ b.update.apply(b, arguments); return tx; }, delete: function(r){ b.delete(r); return tx; } };
      return Promise.resolve(fn(tx)).then(function(res){ return b.commit().then(function(){ return res; }); });
    },
    enablePersistence: function(){ return Promise.resolve(); },
    settings: function(){}
  };

  window.DemoDB = {
    db: db, FieldValue: FV, Timestamp: Timestamp,
    seeded: function(){ return Object.keys(store).length > 0; },
    seed: function(docs){ store = {}; Object.keys(docs).forEach(function(p){ store[p] = freeze(clone(docs[p])); }); save(); },
    reset: function(){ try { localStorage.removeItem(KEY); } catch(e){} },
    raw: function(){ return store; }
  };
  load();
})();

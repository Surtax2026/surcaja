/* Surtax · Demo SurCaja: "Salón Brisa", un salón de ejemplo. Nombres, teléfonos y montos son ficticios.
   Las fechas se generan alrededor de hoy para que la demo siempre se vea al día. */
window.DEMO_KEY = "surtax-demo-caja";
window.DemoSeedCaja = function(){
  "use strict";
  var rs = 20261121; function rnd(){ rs = (rs * 1103515245 + 12345) % 2147483648; return rs / 2147483648; }
  function pick(a){ return a[Math.floor(rnd() * a.length)]; }
  function p2(n){ return String(n).padStart(2, "0"); }
  function ymd(d){ return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function addD(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function hm(m){ return p2(Math.floor(m / 60)) + ":" + p2(m % 60); }
  var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  var docs = {}, iso = new Date().toISOString();

  docs["config/general"] = { local: "Salón Brisa", direccion: "Av. Ejemplo 123, Puerto Varas", whatsapp: "+56 9 9078 7753", instagram: "salonbrisa.demo",
    abre: "10:00", cierra: "20:00", cierraSab: "17:00", cerrados: [0], base: "bruto", pointIntegrado: true, pointTerminal: "DEMO-POINT" };
  docs["usuarios/demo-admin"] = { email: "demo@surcaja.cl", rol: "admin", creado: iso };

  var pros = [["pro-camila", "Camila", "Camila Rojas"], ["pro-valentina", "Valentina", "Valentina Soto"], ["pro-javiera", "Javiera", "Javiera Muñoz"], ["pro-fernanda", "Fernanda", "Fernanda Díaz"]];
  var horario = {}; [1, 2, 3, 4, 5].forEach(function(d){ horario[d] = { a: "10:00", b: "19:00" }; }); horario[6] = { a: "10:00", b: "17:00" };
  pros.forEach(function(p, i){
    var h = JSON.parse(JSON.stringify(horario)); if(i === 3) delete h[1];
    docs["profesionales/" + p[0]] = { nombre: p[1], nombreCompleto: p[2], activo: true, modelo: "honorarios", comision: 50, horario: h, creado: iso };
  });

  var servs = [
    ["s-mani-trad", "Manicure", "Manicure tradicional", 12990, 40], ["s-mani-perm", "Manicure", "Esmaltado permanente", 18990, 60],
    ["s-mani-niv", "Manicure", "Manicure con nivelación", 24990, 90], ["s-kapping", "Manicure", "Kapping acrílico o polygel", 33990, 90],
    ["s-acrilicas", "Manicure", "Uñas acrílicas esculpidas", 39990, 120], ["s-pedi-trad", "Pedicure", "Pedicure tradicional", 16990, 50],
    ["s-pedi-perm", "Pedicure", "Pedicure permanente", 24990, 60], ["s-pedi-prof", "Pedicure", "Pedicura profunda + permanente", 28990, 90],
    ["s-lifting", "Pestañas", "Lifting de pestañas", 25990, 60], ["s-ext-clas", "Pestañas", "Extensión de pestañas clásica", 35990, 120],
    ["s-cejas", "Depilación", "Cejas con cera", 7990, 20], ["s-rostro", "Depilación", "Rostro completo", 12990, 30], ["s-axilas", "Depilación", "Axilas", 9990, 20],
    ["s-mani-pedi", "Ofertas", "Mani + pedi permanente", 39990, 120],
    ["s-aceite", "Productos", "Aceite de cutículas", 6990, 0], ["s-exfol", "Productos", "Exfoliante de manos", 9990, 0]
  ];
  servs.forEach(function(s){ docs["servicios/" + s[0]] = { categoria: s[1], nombre: s[2], precio: s[3], duracion: s[4], activo: true, creado: iso }; });
  var atencion = servs.filter(function(s){ return s[1] !== "Productos"; });
  var populares = ["s-mani-perm", "s-mani-perm", "s-mani-perm", "s-pedi-perm", "s-pedi-perm", "s-mani-niv", "s-kapping", "s-mani-trad", "s-pedi-prof", "s-lifting", "s-cejas", "s-mani-pedi", "s-acrilicas", "s-ext-clas", "s-rostro"];
  function srv(id){ for(var i=0;i<servs.length;i++) if(servs[i][0] === id) return servs[i]; }

  var nombres = ["Antonia", "Sofía", "Isidora", "Catalina", "Martina", "Florencia", "Josefa", "Amanda", "Trinidad", "Agustina", "Emilia", "Maite", "Constanza", "Paula", "Daniela", "Francisca", "Ignacia", "Macarena", "Bárbara", "Carolina", "Paz", "Rocío", "Victoria", "Renata", "Javiera"];
  var apellidos = ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez", "Sepúlveda", "Morales", "Rodríguez", "López", "Fuentes", "Hernández", "Torres", "Araya", "Flores", "Espinoza", "Valenzuela"];
  var clientas = [];
  for(var i=0;i<70;i++){
    var id = "cli-" + p2(i + 1), nom = pick(nombres) + " " + pick(apellidos);
    clientas.push([id, nom]);
    docs["clientas/" + id] = { nombre: nom, telefono: "+56 9 0000 " + String(1000 + i * 37).slice(-4), origen: pick(["presencial", "presencial", "reserva", "google", "instagram"]), creado: iso };
  }

  var dd = -21, op = 11200;
  for(dd = -21; dd <= 10; dd++){
    var dia = addD(hoy, dd), f = ymd(dia), dow = dia.getDay();
    if(dow === 0) continue;
    var cierre = dow === 6 ? 17 * 60 : 19 * 60;
    pros.forEach(function(p, pi){
      if(pi === 3 && dow === 1) return;
      var t = 10 * 60 + Math.floor(rnd() * 3) * 30, n = 0, max = dd > 0 ? 2 + Math.floor(rnd() * 3) : 3 + Math.floor(rnd() * 3);
      while(n < max){
        var s = srv(pick(populares)), dur = s[4], extra = null;
        if(rnd() < 0.15 && s[1] === "Manicure") extra = srv("s-cejas");
        var durT = dur + (extra ? extra[4] : 0);
        if(t + durT > cierre) break;
        var c = pick(clientas), cid = "cit-" + f + "-" + pi + "-" + n;
        var items = [{ id: s[0], nombre: s[2], precio: s[3], dur: s[4] }]; if(extra) items.push({ id: extra[0], nombre: extra[2], precio: extra[3], dur: extra[4] });
        var precio = items.reduce(function(a, x){ return a + x.precio; }, 0);
        var pasado = dd < 0 || (dd === 0 && t + durT <= nowMin);
        var estado = pasado ? (rnd() < 0.08 ? "cancelada" : "atendida") : (dd === 0 && t <= nowMin ? "llego" : rnd() < 0.55 ? "confirmada" : "reservada");
        docs["citas/" + cid] = { fecha: f, hora: hm(t), dur: durT, profId: p[0], profNombre: p[1], clientaId: c[0], clientaNombre: c[1], telefono: docs["clientas/" + c[0]].telefono,
          servicios: items, precio: precio, estado: estado, tipo: "cita", origen: pick(["presencial", "presencial", "reserva", "google"]), creado: iso, modificado: iso };
        if(estado === "atendida"){
          var medio = rnd() < 0.62 ? "tarjeta" : rnd() < 0.65 ? "transferencia" : "efectivo";
          var propina = medio === "tarjeta" && rnd() < 0.35 ? pick([1000, 1500, 2000, 3000]) : 0;
          op += 1 + Math.floor(rnd() * 4);
          docs["registros/reg-" + cid] = { fecha: f, hora: hm(t + durT), profId: p[0], profNombre: p[1], clientaId: c[0], clientaNombre: c[1], citaId: cid,
            servicios: items.map(function(x){ return { id: x.id, nombre: x.nombre, categoria: srv(x.id)[1], precioLista: x.precio, cantidad: 1 }; }),
            precioLista: precio, venta: precio, propina: propina, medio: medio, operacion: medio === "tarjeta" ? String(op) : "", estado: "ok",
            base: "bruto", modelo: "honorarios", comisionPct: 50, creado: iso };
        }
        t += durT + (rnd() < 0.4 ? 30 : 0); n++;
      }
    });
    if(dd <= 0 && rnd() < 0.5){
      var pr = srv(pick(["s-aceite", "s-exfol"]));
      docs["registros/prod-" + f] = { fecha: f, hora: "18:10", profId: "", profNombre: "Venta del salón", servicios: [{ id: pr[0], nombre: pr[2], categoria: "Productos", precioLista: pr[3], cantidad: 1 }],
        precioLista: pr[3], venta: pr[3], propina: 0, medio: "tarjeta", operacion: String(++op), estado: "ok", base: "bruto", modelo: "producto", comisionPct: 0, creado: iso };
    }
  }

  var man = ymd(addD(hoy, 1));
  docs["solicitudes/sol-demo-1"] = { nombre: "Daniela Fuentes", telefono: "+56 9 0000 7781", fecha: man, hora: "11:30", servicios: ["s-pedi-prof"], profId: "", estado: "nueva",
    nota: "[origen:google] Primera vez, me recomendó una amiga", creado: { __ts: Date.now() - 3600e3 } };
  docs["solicitudes/sol-demo-2"] = { nombre: "Renata Araya", telefono: "+56 9 0000 7792", fecha: man, hora: "16:00", servicios: ["s-mani-niv"], profId: "pro-camila", estado: "nueva",
    nota: "[origen:instagram]", creado: { __ts: Date.now() - 900e3 } };

  var vence = ymd(addD(hoy, 24));
  docs["giftcards/BRI-7KQ2"] = { valor: 24990, valorVenta: 24990, saldo: 24990, estado: "vigente", modo: "servicio", tipo: "persona", servId: "s-pedi-perm", descripcion: "Pedicure permanente",
    para: "Valentina", de: "Sofía", mensaje: "Feliz cumpleaños, un momento para ti", medioVenta: "transferencia", fechaVenta: ymd(addD(hoy, -6)), horaVenta: "13:20", vence: vence, creado: iso, por: "demo@surcaja.cl", canjes: [] };
  docs["giftcards/BRI-P3MX"] = { valor: 39990, valorVenta: 39990, saldo: 39990, estado: "vigente", modo: "servicio", tipo: "persona", servId: "s-mani-pedi", descripcion: "Mani + pedi permanente",
    para: "Mamá", de: "Catalina", mensaje: "Te quiero mucho", medioVenta: "tarjeta", opVenta: String(++op), fechaVenta: ymd(addD(hoy, -2)), horaVenta: "17:45", vence: ymd(addD(hoy, 28)), creado: iso, por: "demo@surcaja.cl", canjes: [] };

  var gastos = [["Insumos y materiales", "Distribuidora de insumos (ejemplo)", 84990, "factura"], ["Arriendo y gastos comunes", "Arriendo del local (ejemplo)", 650000, "factura"],
    ["Servicios básicos (luz, agua, internet)", "Internet (ejemplo)", 29990, "boleta"], ["Aseo y mantención", "Artículos de aseo (ejemplo)", 18500, "boleta"], ["Insumos y materiales", "Esmaltes y removedor (ejemplo)", 46200, "factura"]];
  gastos.forEach(function(g, i){ var neto = g[3] === "factura" ? Math.round(g[2] / 1.19) : g[2];
    docs["gastos/gas-" + i] = { fecha: ymd(addD(hoy, -3 - i * 4)), categoria: g[0], proveedor: g[1], detalle: g[1], total: g[2], neto: neto, iva: g[2] - neto, doc: g[3], numDoc: String(1000 + i * 17),
      pagadoPor: "empresa", reembolsado: false, por: "demo@surcaja.cl", creado: iso, modificado: iso }; });

  docs["publico/catalogo"] = { local: "Salón Brisa", direccion: "Av. Ejemplo 123, Puerto Varas", whatsapp: "+56 9 9078 7753", instagram: "salonbrisa.demo", abre: "10:00", cierra: "20:00", cierraSab: "17:00", cerrados: [0],
    servicios: atencion.map(function(s){ return { id: s[0], categoria: s[1], nombre: s[2], precio: s[3], duracion: s[4] }; }),
    profesionales: pros.map(function(p){ return { id: p[0], nombre: p[1], horario: docs["profesionales/" + p[0]].horario }; }), actualizado: iso };
  return docs;
};

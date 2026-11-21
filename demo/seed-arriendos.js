/* Surtax · Demo SurArriendos: cartera de ejemplo. Propietarios, arrendatarios, direcciones e indicadores son ficticios. */
window.DEMO_KEY = "surtax-demo-arriendos";
window.DemoSeedArriendos = function(){
  "use strict";
  function p2(n){ return String(n).padStart(2, "0"); }
  function ymd(d){ return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function mesDe(d){ return d.getFullYear() + "-" + p2(d.getMonth() + 1); }
  function addM(d, n){ return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28)); }
  function addD(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function mesNom(d){ return MESES[d.getMonth()] + " " + d.getFullYear(); }
  var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  var m0 = mesDe(hoy), m1 = mesDe(addM(hoy, -1)), m2 = mesDe(addM(hoy, -2));
  var docs = {};

  /* Indicadores de ejemplo (no son los oficiales) */
  var uf = {}, base = 39800, d0 = addD(hoy, -100);
  for(var i = 0; i <= 140; i++){ var d = addD(d0, i); uf[ymd(d)] = Math.round((base + i * 4.1) * 100) / 100; }
  var ipc = {}; [-6, -5, -4, -3, -2, -1].forEach(function(k, j){ ipc[mesDe(addM(hoy, k - 1))] = { mensual: [0.3, 0.2, 0.4, 0.1, 0.3, 0.2][j], doce: [4.1, 4.0, 4.2, 3.9, 3.8, 3.7][j] }; });
  var utm = {}; utm[m0] = 69500; utm[m1] = 69300; var uta = {}; uta[m0] = 834000;
  docs["indicadores/actual"] = { uf: uf, ipc: ipc, utm: utm, uta: uta, actualizado: new Date().toISOString(), fuente: "valores de ejemplo de la demo" };
  docs["config/general"] = { uf: {}, desde: m2 };

  var P = [
    ["P01", "Los Aromos 1450 DP 302", "Providencia", "Carolina Vidal", "Matías Herrera", "UF", 15.5, "mas_iva", -10, 14, "IPC semestral", 0.3],
    ["P02", "Av. Ejemplo 880 DP 1204", "Ñuñoa", "Rodrigo Peña", "Constanza Ríos", "CLP", 520000, "incluido", -20, 4, "IPC semestral", 0.5],
    ["P03", "Pasaje Los Robles 77 casa 4", "La Florida", "Patricia Lagos", "Felipe Castro", "CLP", 640000, "mas_iva", -7, 1, "IPC trimestral", 0.5],
    ["P04", "Gran Avenida 2311 DP 507", "San Miguel", "Andrés Molina", "Daniela Bravo", "CLP", 380000, "mas_iva", -16, 8, "IPC semestral", 0.3],
    ["P05", "Av. Costanera 450 DP 1801", "Puerto Montt", "Ximena Ortiz", "Tomás Fuentes", "UF", 13.8, "incluido", -11, 2, "IPC anual", 0.3],
    ["P06", "Calle Los Ulmos 233 casa 2", "Puerto Varas", "Gonzalo Reyes", "Valentina Paredes", "CLP", 720000, "mas_iva", -3, 10, "IPC semestral", 0.5],
    ["P07", "Av. Santa Rosa 1200 DP 909", "Santiago", "Mónica Carrasco", "Ignacio Vera", "CLP", 410000, "mas_iva", -22, 3, "IPC semestral", 0.3],
    ["P08", "Los Castaños 95 DP 41", "Las Condes", "Eduardo Saavedra", "Josefina Lira", "UF", 22.0, "mas_iva", -9, 13, "IPC anual", 0.3],
    ["P09", "Pje. Volcán 40 casa 7", "Puerto Varas", "Lorena Muñoz", "Nicolás Bustos", "CLP", 580000, "sin", -5, 7, "IPC semestral", 0.5],
    ["P10", "Av. Oficinas 155 of. 1209", "Maipú", "Claudio Pino", "Centro Médico Ejemplo", "UF", 12.5, "incluido", -2, 22, "IPC anual", 0.3],
    ["P11", "Irarrázaval 4000 DP 610", "Ñuñoa", "Sandra Cortés", "Benjamín Toro", "CLP", 460000, "mas_iva", -13, 11, "IPC semestral", 0.5],
    ["P12", "Diego Portales 700 DP 303", "Puerto Montt", "Hugo Navarro", "Camila Sepúlveda", "CLP", 395000, "mas_iva", -18, 6, "IPC semestral", 0.3]
  ];
  P.forEach(function(r, i){
    var inicio = addM(hoy, r[8]), termino = addM(hoy, r[9]); termino.setDate(Math.max(1, inicio.getDate() - 1));
    var aviso = addD(termino, -60);
    var n = /trimestral/.test(r[10]) ? 3 : /semestral/.test(r[10]) ? 6 : 12;
    var prox = new Date(inicio); while(prox <= hoy) prox = addM(prox, n);
    docs["propiedades/" + r[0]] = { corto: r[1].split(" DP")[0].split(" casa")[0].split(" of.")[0] + (r[1].match(/ (DP|casa|of\.) .*/) || [""])[0],
      direccion: r[1], comuna: r[2], propietario: r[3], arrendatario: r[4], telefono: "+56 9 0000 " + String(2000 + i * 53).slice(-4),
      moneda: r[5], canon: r[6], dia_pago: 5, comision_tipo: r[7], comision_pct: 5, cobra: i !== 8, administra: true, estado: "Vigente",
      inicio: ymd(inicio), termino: ymd(termino), aviso: ymd(aviso), dias_aviso: 60, reajuste: r[10] + " · próximo: " + mesNom(prox), multa: r[11],
      facturar_a: r[3], rut_factura: "11.111.111-1 (ejemplo)" };
  });

  function canon(r, mes){ if(r[5] !== "UF") return r[6]; var f = mes + "-05"; var v = uf[f] || base; return Math.round(r[6] * v); }
  var hoyD = hoy.getDate();
  P.forEach(function(r, i){
    if(i === 8) return; // paga directo al propietario
    [m2, m1, m0].forEach(function(mes, k){
      var monto = canon(r, mes), id = r[0] + "_" + mes, dia = 1 + ((i * 3 + k) % 6), fecha = mes + "-" + p2(dia);
      if(mes === m0){
        if(i === 3 || i === 10) return;                 // atrasados este mes
        if(i === 6){ docs["cobros/" + id] = { prop: r[0], mes: mes, monto: Math.round(monto * 0.6), fecha: mes + "-05", medio: "transferencia", op: "", nota: "Pagó una parte; el resto la próxima semana", avisos: [mes + "-07"] }; return; }
        if(hoyD < 5 && i % 3 === 0) return;              // aún no vence
      }
      if(mes === m1 && i === 11){ docs["cobros/" + id] = { prop: r[0], mes: mes, monto: monto, fecha: mes + "-09", medio: "transferencia", op: "", nota: "Pagó 4 días tarde", avisos: [mes + "-06"] }; }
      else docs["cobros/" + id] = { prop: r[0], mes: mes, monto: monto, fecha: fecha, medio: i === 4 ? "deposito" : "transferencia", op: "", nota: "", avisos: [] };
      var neto = 0, iva = 0, total = 0, pct = 0.05;
      if(r[7] === "mas_iva"){ neto = Math.round(monto * pct); iva = Math.round(neto * 0.19); total = neto + iva; }
      else if(r[7] === "incluido"){ total = Math.round(monto * pct); neto = Math.round(total / 1.19); iva = total - neto; }
      if(total && (mes === m2 || (mes === m1 && i % 4 !== 1))) docs["facturas/" + id] = { prop: r[0], mes: mes, folio: String(400 + i * 3 + k), fecha: mes + "-" + p2(dia + 1), neto: neto, iva: iva, total: total };
      if(mes !== m0 || i % 2 === 0) docs["rendiciones/" + id] = { prop: r[0], mes: mes, otros: i === 2 ? 45000 : 0, otros_glosa: i === 2 ? "Gasto común de septiembre (ejemplo)" : "", transferido: monto - total - (i === 2 ? 45000 : 0), fecha: mes + "-" + p2(Math.min(dia + 3, 28)) };
    });
  });
  docs["renovaciones/P03"] = { estado: "consultado", nota: "Propietaria quiere renovar con reajuste", fecha: ymd(addD(hoy, -4)) };
  docs["renovaciones/P05"] = { estado: "avisado", nota: "Aviso de renovación enviado por correo", fecha: ymd(addD(hoy, -10)) };
  return docs;
};

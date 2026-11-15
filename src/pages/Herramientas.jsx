import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Lightbulb, ChevronDown, ChevronUp, Ruler, Weight,
  Circle, RotateCcw, Square, Wrench, Layers, Triangle, ArrowRight,
  Zap, Hammer, Paintbrush, Droplets, Wind
} from "lucide-react";

// ─── CALCULADORA NORMAL ──────────────────────────────────────────────────────
function CalcNormal() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);

  const press = (val) => {
    if (display === "Error") { setDisplay("0"); return; }
    if (reset) { setDisplay(String(val)); setReset(false); return; }
    if (display === "0" && val !== ".") setDisplay(String(val));
    else if (val === "." && display.includes(".")) return;
    else setDisplay(display + val);
  };

  const pressOp = (o) => {
    if (display === "Error") return;
    setPrev(parseFloat(display));
    setOp(o);
    setReset(true);
  };

  const calc = () => {
    if (op === null || prev === null) return;
    const cur = parseFloat(display);
    let res;
    if (op === "+" ) res = prev + cur;
    if (op === "-" ) res = prev - cur;
    if (op === "×" ) res = prev * cur;
    if (op === "÷" ) res = cur === 0 ? "Error" : prev / cur;
    if (op === "%")  res = prev * (cur / 100);
    setDisplay(res === "Error" ? "Error" : String(parseFloat(res.toFixed(10))));
    setPrev(null); setOp(null); setReset(true);
  };

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setReset(false); };
  const toggleSign = () => setDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d);
  const del = () => setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");

  const btn = (label, action, style = "") => (
    <button key={label} onClick={action}
      className={`rounded-2xl h-14 text-lg font-bold transition-all active:scale-95 select-none ${style}`}>
      {label}
    </button>
  );

  return (
    <div className="bg-gray-900 rounded-3xl p-4 select-none max-w-xs mx-auto">
      <div className="text-right px-2 mb-4">
        <p className="text-gray-500 text-sm h-5">{prev !== null ? `${prev} ${op}` : ""}</p>
        <p className="text-white text-4xl font-light truncate">{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {btn("AC", clear, "bg-gray-400 text-gray-900 col-span-1")}
        {btn("+/-", toggleSign, "bg-gray-400 text-gray-900")}
        {btn("%", () => pressOp("%"), "bg-gray-400 text-gray-900")}
        {btn("÷", () => pressOp("÷"), op === "÷" ? "bg-white text-orange-500" : "bg-orange-500 text-white")}
        {["7","8","9"].map(n => btn(n, () => press(n), "bg-gray-700 text-white"))}
        {btn("×", () => pressOp("×"), op === "×" ? "bg-white text-orange-500" : "bg-orange-500 text-white")}
        {["4","5","6"].map(n => btn(n, () => press(n), "bg-gray-700 text-white"))}
        {btn("-", () => pressOp("-"), op === "-" ? "bg-white text-orange-500" : "bg-orange-500 text-white")}
        {["1","2","3"].map(n => btn(n, () => press(n), "bg-gray-700 text-white"))}
        {btn("+", () => pressOp("+"), op === "+" ? "bg-white text-orange-500" : "bg-orange-500 text-white")}
        {btn("⌫", del, "bg-gray-700 text-white")}
        {btn(".", () => press("."), "bg-gray-700 text-white")}
        {btn("=", calc, "bg-orange-500 text-white col-span-2")}
      </div>
    </div>
  );
}

// ─── CALCULADORAS ESPECÍFICAS ────────────────────────────────────────────────

function CalcMateriales() {
  const [l, setL] = useState(""); const [a, setA] = useState(""); const [h, setH] = useState("");
  const [res, setRes] = useState(null);
  const calc = () => {
    const lv = parseFloat(l)||0, av = parseFloat(a)||0, hv = parseFloat(h)||0;
    setRes({ vol: (lv*av*hv).toFixed(3), sup: (2*(lv*av+lv*hv+av*hv)).toFixed(3), per: (2*(lv+av)).toFixed(2) });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Dimensiones de un bloque o espacio en metros.</p>
      <div className="grid grid-cols-3 gap-2">
        {[["Largo",l,setL],["Ancho",a,setA],["Alto",h,setH]].map(([n,v,s])=>(
          <div key={n}><label className="text-xs text-gray-500 font-medium block mb-1">{n} (m)</label>
          <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        ))}
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#630027]/5 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Volumen</p><p className="font-black text-[#630027] text-lg">{res.vol}</p><p className="text-xs text-gray-400">m³</p></div>
        <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Superficie</p><p className="font-black text-blue-700 text-lg">{res.sup}</p><p className="text-xs text-gray-400">m²</p></div>
        <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Perímetro</p><p className="font-black text-green-700 text-lg">{res.per}</p><p className="text-xs text-gray-400">m</p></div>
      </div>}
    </div>
  );
}

function CalcCirculo() {
  const [r, setR] = useState(""); const [res, setRes] = useState(null);
  const calc = () => { const rv=parseFloat(r)||0; setRes({ area:(Math.PI*rv*rv).toFixed(4), perim:(2*Math.PI*rv).toFixed(4), diam:(2*rv).toFixed(3) }); };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Para ruedas, arcos y elementos circulares.</p>
      <div><label className="text-xs text-gray-500 font-medium block mb-1">Radio (m)</label>
      <input type="number" value={r} onChange={e=>setR(e.target.value)} placeholder="0.5" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#630027]/5 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Área</p><p className="font-black text-[#630027]">{res.area}</p><p className="text-xs text-gray-400">m²</p></div>
        <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Perímetro</p><p className="font-black text-purple-700">{res.perim}</p><p className="text-xs text-gray-400">m</p></div>
        <div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Diámetro</p><p className="font-black text-orange-700">{res.diam}</p><p className="text-xs text-gray-400">m</p></div>
      </div>}
    </div>
  );
}

function CalcPeso() {
  const densidades = {
    madera:{label:"Madera (pino)",kg:500}, roble:{label:"Madera (roble)",kg:750},
    acero:{label:"Acero",kg:7850}, aluminio:{label:"Aluminio",kg:2700},
    hormigon:{label:"Hormigón",kg:2400}, carton:{label:"Cartón",kg:100},
    foam:{label:"Foam/EPS",kg:30}, hierro:{label:"Hierro forjado",kg:7200},
    pvc:{label:"PVC",kg:1380}, fibra:{label:"Fibra de vidrio",kg:1800},
    yeso:{label:"Yeso",kg:1100}, cemento:{label:"Cemento seco",kg:1500},
  };
  const [mat, setMat] = useState("madera"); const [vol, setVol] = useState(""); const [res, setRes] = useState(null);
  const calc = () => { const v=parseFloat(vol)||0, d=densidades[mat].kg; setRes({peso:(v*d).toFixed(1),d}); };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Estima el peso de piezas para verificar la carga.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Material</label>
        <select value={mat} onChange={e=>setMat(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          {Object.entries(densidades).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select></div>
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Volumen (m³)</label>
        <input type="number" value={vol} onChange={e=>setVol(e.target.value)} placeholder="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="bg-[#630027]/5 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400 mb-1">Peso estimado</p>
        <p className="text-3xl font-black text-[#630027]">{res.peso} <span className="text-lg">kg</span></p>
        <p className="text-xs text-gray-400 mt-1">Densidad: {res.d} kg/m³</p>
      </div>}
    </div>
  );
}

function CalcPintura() {
  const [sup,setSup]=useState(""); const [capas,setCapas]=useState("2"); const [rend,setRend]=useState("10"); const [res,setRes]=useState(null);
  const calc = () => { const s=parseFloat(sup)||0,c=parseInt(capas)||1,r=parseFloat(rend)||10,lit=(s*c)/r; setRes({lit:lit.toFixed(2),b5:Math.ceil(lit/5),b1:Math.ceil(lit)}); };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Calcula los litros de pintura necesarios.</p>
      <div className="grid grid-cols-3 gap-2">
        {[["Superficie m²",sup,setSup,"25"],["Nº capas",capas,setCapas,"2"],["Rend. m²/L",rend,setRend,"10"]].map(([n,v,s,p])=>(
          <div key={n}><label className="text-xs text-gray-500 font-medium block mb-1">{n}</label>
          <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder={p} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        ))}
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-3 gap-2">
        <div className="bg-yellow-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Litros</p><p className="font-black text-yellow-700 text-xl">{res.lit}</p></div>
        <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Botes 5L</p><p className="font-black text-blue-700 text-xl">{res.b5}</p></div>
        <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Botes 1L</p><p className="font-black text-green-700 text-xl">{res.b1}</p></div>
      </div>}
    </div>
  );
}

function CalcConversiones() {
  const units = {m:1,cm:100,mm:1000,ft:3.28084,inch:39.3701,km:0.001};
  const labels = {m:"metros (m)",cm:"centímetros (cm)",mm:"milímetros (mm)",ft:"pies (ft)",inch:"pulgadas (in)",km:"kilómetros (km)"};
  const [val,setVal]=useState(""); const [de,setDe]=useState("m"); const [a,setA]=useState("cm");
  const conv = () => val ? ((parseFloat(val)/units[de])*units[a]).toFixed(4) : null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Convierte entre unidades de medida.</p>
      <div className="flex items-center gap-2">
        <input type="number" value={val} onChange={e=>setVal(e.target.value)} placeholder="Valor" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/>
        <select value={de} onChange={e=>setDe(e.target.value)} className="px-2 py-2 border border-gray-200 rounded-xl text-sm">{Object.keys(units).map(u=><option key={u} value={u}>{labels[u]}</option>)}</select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 w-14 text-center">→</span>
        <select value={a} onChange={e=>setA(e.target.value)} className="flex-1 px-2 py-2 border border-gray-200 rounded-xl text-sm">{Object.keys(units).map(u=><option key={u} value={u}>{labels[u]}</option>)}</select>
      </div>
      {val && <div className="bg-[#630027]/5 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">{val} {de} =</p>
        <p className="text-3xl font-black text-[#630027]">{conv()} <span className="text-lg">{a}</span></p>
      </div>}
    </div>
  );
}

function CalcTornillos() {
  const [largo,setLargo]=useState(""); const [esp,setEsp]=useState(""); const [res,setRes]=useState(null);
  const calc = () => {
    const l=parseFloat(largo)||0, e=parseFloat(esp)||0;
    const penetracion = l - e;
    const ok = penetracion >= e * 1.5;
    setRes({ penetracion: penetracion.toFixed(1), ok, recom: (e * 2.5).toFixed(0) });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Verifica si un tornillo o clavo tiene la longitud adecuada para fijar dos piezas.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Largo tornillo (mm)</label>
        <input type="number" value={largo} onChange={e=>setLargo(e.target.value)} placeholder="80" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Espesor pieza superior (mm)</label>
        <input type="number" value={esp} onChange={e=>setEsp(e.target.value)} placeholder="20" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className={`rounded-xl p-4 ${res.ok ? "bg-green-50" : "bg-red-50"}`}>
        <p className="text-sm font-bold text-center mb-2" style={{color: res.ok ? "#15803d" : "#dc2626"}}>{res.ok ? "✅ Longitud correcta" : "⚠️ Tornillo demasiado corto"}</p>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div><p className="text-gray-400">Penetración</p><p className="font-black text-gray-700 text-lg">{res.penetracion} mm</p></div>
          <div><p className="text-gray-400">Longitud recomendada</p><p className="font-black text-gray-700 text-lg">≥ {res.recom} mm</p></div>
        </div>
      </div>}
    </div>
  );
}

function CalcVigas() {
  const [l, setL] = useState(""); const [carga, setCarga] = useState(""); const [base, setBase] = useState(""); const [altura, setAltura] = useState(""); const [res, setRes] = useState(null);
  const calc = () => {
    const lv=parseFloat(l)||0, cv=parseFloat(carga)||0, bv=parseFloat(base)||0, hv=parseFloat(altura)||0;
    if (!bv || !hv) return;
    const I = (bv * Math.pow(hv, 3)) / 12; // mm4 → cm4
    const flecha = (5 * cv * Math.pow(lv, 4)) / (384 * 210000 * I); // simplificado para acero
    const momento = (cv * lv * lv) / 8;
    setRes({ flecha: flecha.toFixed(4), momento: momento.toFixed(2), I: I.toFixed(2) });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Estimación básica de vigas de madera/acero bajo carga uniforme (simplemente apoyada).</p>
      <div className="grid grid-cols-2 gap-2">
        {[["Longitud viga (m)",l,setL,"3"],["Carga total (kg/m)",carga,setCarga,"50"],["Base sección (cm)",base,setBase,"5"],["Altura sección (cm)",altura,setAltura,"10"]].map(([n,v,s,p])=>(
          <div key={n}><label className="text-xs text-gray-500 font-medium block mb-1">{n}</label>
          <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder={p} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        ))}
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-orange-50 rounded-xl p-3"><p className="text-gray-400">Inercia (I)</p><p className="font-black text-orange-700 text-base">{res.I}</p><p className="text-gray-400">cm⁴</p></div>
        <div className="bg-blue-50 rounded-xl p-3"><p className="text-gray-400">Momento</p><p className="font-black text-blue-700 text-base">{res.momento}</p><p className="text-gray-400">kg·m</p></div>
        <div className="bg-purple-50 rounded-xl p-3"><p className="text-gray-400">Flecha est.</p><p className="font-black text-purple-700 text-base">{res.flecha}</p><p className="text-gray-400">m</p></div>
      </div>}
      <p className="text-xs text-gray-300 text-center">* Cálculo orientativo. Consulta siempre a un técnico para cargas reales.</p>
    </div>
  );
}

function CalcMezclas() {
  const mezclas = {
    mortero_general: { label: "Mortero general (1:4)", cemento: 1, arena: 4, agua: 0.5 },
    mortero_fino: { label: "Mortero fino (1:3)", cemento: 1, arena: 3, agua: 0.45 },
    hormigon: { label: "Hormigón estándar (1:2:4)", cemento: 1, arena: 2, grava: 4, agua: 0.55 },
    enlucido: { label: "Enlucido (1:2)", cemento: 1, arena: 2, agua: 0.4 },
    yeso: { label: "Yeso (1:1)", yeso: 1, agua: 1 },
  };
  const [tipo, setTipo] = useState("mortero_general"); const [vol, setVol] = useState(""); const [res, setRes] = useState(null);
  const calc = () => {
    const m = mezclas[tipo]; const v = parseFloat(vol) || 0;
    const total = Object.entries(m).filter(([k]) => k !== "label").reduce((s,[,v])=>s+v,0);
    const result = {};
    Object.entries(m).filter(([k])=>k!=="label").forEach(([k,pv])=>{ result[k] = (v * pv / total).toFixed(3); });
    setRes(result);
  };
  const colores = { cemento:"bg-gray-100 text-gray-700", arena:"bg-yellow-50 text-yellow-700", grava:"bg-stone-100 text-stone-700", agua:"bg-blue-50 text-blue-700", yeso:"bg-orange-50 text-orange-700" };
  const icons = { cemento:"🏗️", arena:"🏖️", grava:"🪨", agua:"💧", yeso:"🪣" };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Calcula las proporciones de materiales para mezclas.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Tipo de mezcla</label>
        <select value={tipo} onChange={e=>setTipo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          {Object.entries(mezclas).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select></div>
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Volumen final (m³)</label>
        <input type="number" value={vol} onChange={e=>setVol(e.target.value)} placeholder="0.5" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-2 gap-2">
        {Object.entries(res).map(([k,v])=>(
          <div key={k} className={`rounded-xl p-3 text-center ${colores[k]||"bg-gray-50"}`}>
            <p className="text-xs">{icons[k]||"📦"} {k.charAt(0).toUpperCase()+k.slice(1)}</p>
            <p className="font-black text-xl">{v}</p><p className="text-xs">m³</p>
          </div>
        ))}
      </div>}
    </div>
  );
}

function CalcElectrico() {
  const [V, setV] = useState(""); const [I, setI] = useState(""); const [R, setR] = useState(""); const [P, setP] = useState(""); const [res, setRes] = useState(null);
  const calc = () => {
    const v=parseFloat(V)||null, i=parseFloat(I)||null, r=parseFloat(R)||null;
    let result = {};
    if (v && i) { result = { V:v, I:i, R:(v/i).toFixed(4), P:(v*i).toFixed(2) }; }
    else if (v && r) { result = { V:v, I:(v/r).toFixed(4), R:r, P:(v*v/r).toFixed(2) }; }
    else if (i && r) { result = { V:(i*r).toFixed(4), I:i, R:r, P:(i*i*r).toFixed(2) }; }
    else { setRes({error:true}); return; }
    setRes(result);
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Ley de Ohm: rellena 2 valores y calcula los demás (V=voltios, I=amperios, R=ohmios, P=vatios).</p>
      <div className="grid grid-cols-2 gap-2">
        {[["⚡ Voltaje V",V,setV,"230"],["🔌 Intensidad I (A)",I,setI,"10"],["🔧 Resistencia R (Ω)",R,setR,"23"],["💡 Potencia P (W)",P,setP,"2300"]].slice(0,3).map(([n,v,s,p])=>(
          <div key={n}><label className="text-xs text-gray-500 font-medium block mb-1">{n}</label>
          <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder={p} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        ))}
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular (introduce mínimo 2 valores)</button>
      {res && (res.error ? <p className="text-xs text-red-500 text-center">Introduce al menos 2 valores</p> :
        <div className="grid grid-cols-2 gap-2 text-center">
          {[["⚡ Voltaje",res.V,"V","yellow"],["🔌 Intensidad",res.I,"A","blue"],["🔧 Resistencia",res.R,"Ω","green"],["💡 Potencia",res.P,"W","red"]].map(([n,v,u,c])=>(
            <div key={n} className={`bg-${c}-50 rounded-xl p-3`}><p className="text-xs text-gray-500">{n}</p><p className={`font-black text-${c}-700 text-xl`}>{v}</p><p className="text-xs text-gray-400">{u}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalcAngulos() {
  const [l, setL] = useState(""); const [h, setH] = useState(""); const [res, setRes] = useState(null);
  const calc = () => {
    const lv=parseFloat(l)||0, hv=parseFloat(h)||0;
    if (!lv) return;
    const angRad = Math.atan(hv/lv);
    const angGrad = angRad * 180 / Math.PI;
    const hipo = Math.sqrt(lv*lv + hv*hv);
    setRes({ ang: angGrad.toFixed(2), hipo: hipo.toFixed(3), pendPct: ((hv/lv)*100).toFixed(1) });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Calcula el ángulo de inclinación, hipotenusa y pendiente de una rampa o tejado.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Base horizontal (m)</label>
        <input type="number" value={l} onChange={e=>setL(e.target.value)} placeholder="4" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Altura vertical (m)</label>
        <input type="number" value={h} onChange={e=>setH(e.target.value)} placeholder="1" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-indigo-50 rounded-xl p-3"><p className="text-xs text-gray-400">Ángulo</p><p className="font-black text-indigo-700 text-xl">{res.ang}°</p></div>
        <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-gray-400">Hipotenusa</p><p className="font-black text-green-700 text-xl">{res.hipo} m</p></div>
        <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-400">Pendiente</p><p className="font-black text-amber-700 text-xl">{res.pendPct}%</p></div>
      </div>}
    </div>
  );
}

function CalcPresupuesto() {
  const [filas, setFilas] = useState([{ desc:"", cant:"", precio:"" }]);
  const addFila = () => setFilas(f=>[...f,{desc:"",cant:"",precio:""}]);
  const updateFila = (i,k,v) => setFilas(f=>f.map((r,idx)=>idx===i?{...r,[k]:v}:r));
  const removeFila = (i) => setFilas(f=>f.filter((_,idx)=>idx!==i));
  const total = filas.reduce((s,r)=>s+(parseFloat(r.cant)||0)*(parseFloat(r.precio)||0),0);
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Lista de materiales con cantidad y precio para estimar el coste total.</p>
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 font-semibold px-1">
          <span className="col-span-5">Descripción</span><span className="col-span-3">Cantidad</span><span className="col-span-3">Precio €</span><span className="col-span-1"></span>
        </div>
        {filas.map((f,i)=>(
          <div key={i} className="grid grid-cols-12 gap-1 items-center">
            <input value={f.desc} onChange={e=>updateFila(i,"desc",e.target.value)} placeholder="Material..." className="col-span-5 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"/>
            <input type="number" value={f.cant} onChange={e=>updateFila(i,"cant",e.target.value)} placeholder="0" className="col-span-3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none"/>
            <input type="number" value={f.precio} onChange={e=>updateFila(i,"precio",e.target.value)} placeholder="0" className="col-span-3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none"/>
            <button onClick={()=>removeFila(i)} className="col-span-1 text-red-300 hover:text-red-500 text-lg leading-none text-center">×</button>
          </div>
        ))}
      </div>
      <button onClick={addFila} className="w-full py-2 border border-dashed border-[#630027]/30 text-[#630027] rounded-xl text-sm hover:bg-[#630027]/5 transition-colors">+ Añadir fila</button>
      <div className="bg-[#630027]/5 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">TOTAL ESTIMADO</span>
        <span className="text-2xl font-black text-[#630027]">{total.toFixed(2)} €</span>
      </div>
    </div>
  );
}

function CalcTiempo() {
  const [personas, setPersonas] = useState(""); const [horas, setHoras] = useState(""); const [tarifa, setTarifa] = useState(""); const [res, setRes] = useState(null);
  const calc = () => {
    const p=parseFloat(personas)||0, h=parseFloat(horas)||0, t=parseFloat(tarifa)||0;
    setRes({ totalH: (p*h).toFixed(0), coste: (p*h*t).toFixed(2) });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Calcula las horas-hombre totales de trabajo y el coste estimado.</p>
      <div className="grid grid-cols-3 gap-2">
        {[["Personas",personas,setPersonas,"5"],["Horas/persona",horas,setHoras,"8"],["Tarifa €/h (opcional)",tarifa,setTarifa,"10"]].map(([n,v,s,p])=>(
          <div key={n}><label className="text-xs text-gray-500 font-medium block mb-1">{n}</label>
          <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder={p} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        ))}
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-gray-400">Horas-hombre</p><p className="font-black text-blue-700 text-2xl">{res.totalH}</p><p className="text-xs text-gray-400">h totales</p></div>
        <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-gray-400">Coste laboral</p><p className="font-black text-green-700 text-2xl">{res.coste}</p><p className="text-xs text-gray-400">€</p></div>
      </div>}
    </div>
  );
}

function CalcNiveles() {
  const [dist, setDist] = useState(""); const [dif, setDif] = useState(""); const [res, setRes] = useState(null);
  const calc = () => {
    const d=parseFloat(dist)||0, h=parseFloat(dif)||0;
    const angRad = Math.atan(h/d);
    setRes({ ang: (angRad*180/Math.PI).toFixed(3), pct: ((h/d)*100).toFixed(2), mmPerM: ((h/d)*1000).toFixed(1) });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Comprueba la nivelación de superficies, suelos o plataformas.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Distancia horizontal (m)</label>
        <input type="number" value={dist} onChange={e=>setDist(e.target.value)} placeholder="3" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
        <div><label className="text-xs text-gray-500 font-medium block mb-1">Diferencia de nivel (mm)</label>
        <input type="number" value={dif} onChange={e=>setDif(e.target.value)} placeholder="10" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"/></div>
      </div>
      <button onClick={calc} className="w-full py-2.5 bg-[#630027] text-white rounded-xl text-sm font-semibold hover:bg-[#4a001d] transition-colors">Calcular</button>
      {res && <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-indigo-50 rounded-xl p-3"><p className="text-xs text-gray-400">Ángulo</p><p className="font-black text-indigo-700">{res.ang}°</p></div>
        <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-400">Pendiente</p><p className="font-black text-amber-700">{res.pct}%</p></div>
        <div className="bg-rose-50 rounded-xl p-3"><p className="text-xs text-gray-400">mm por metro</p><p className="font-black text-rose-700">{res.mmPerM}</p></div>
      </div>}
    </div>
  );
}

// ─── TIPS ────────────────────────────────────────────────────────────────────
const TIPS = {
  soldadura: {
    emoji: "🔥", color: "text-orange-600", bg: "bg-orange-50", tips: [
      "Limpia siempre el metal con cepillo de acero o amoladora antes de soldar. La suciedad y óxido crean soldaduras porosas.",
      "Puntea primero en varios puntos antes de hacer el cordón definitivo para evitar deformaciones por calor.",
      "Usa la intensidad justa: demasiada quema el metal, poca no fusiona bien. Haz pruebas en un trozo de desecho.",
      "Deja enfriar las piezas naturalmente. Nunca enfríes con agua una soldadura recién hecha.",
      "Protege con pintura antioxidante o imprimación las zonas soldadas antes de pintar.",
      "La distancia del electrodo a la pieza debe ser igual al diámetro del electrodo.",
      "Suelda en dirección contraria al viento para que los gases no te afecten y el cordón salga limpio.",
      "Amuela los cordones de soldadura antes de pintar para conseguir una superficie lisa.",
    ]
  },
  carpinteria: {
    emoji: "🪵", color: "text-amber-700", bg: "bg-amber-50", tips: [
      "Mide dos veces, corta una. Marca la línea de corte con lápiz fino, nunca con bolígrafo.",
      "Usa guías y topes para cortes repetitivos: ahorrarás tiempo y ganarás precisión.",
      "La sierra debe empujar la madera hacia la mesa, así no saltará astillas por la cara vista.",
      "Para atornillar madera, haz siempre un taladro piloto para evitar grietas, especialmente cerca de los bordes.",
      "Aplica cola blanca y sujeta con sargentos durante mínimo 2 horas. No muevas la pieza antes de que seque.",
      "La lija va siempre en la dirección de la veta. Empieza con grano grueso (80) y termina con fino (180 o 240).",
      "Para juntas invisibles, usa espigas o galletas de madera con cola. Son más resistentes que los tornillos vistos.",
      "Barniza o imprimina la madera por todas sus caras, incluso por dentro, para evitar que absorba humedad y se deforme.",
    ]
  },
  pintura: {
    emoji: "🎨", color: "text-blue-600", bg: "bg-blue-50", tips: [
      "Imprimasiempre antes de pintar: la imprimación sella la superficie y hace que la pintura dure el doble.",
      "Aplica capas finas. Es mejor dar 3 manos finas que 1 gruesa (chorrea y tarda mucho en secar).",
      "Protege con cinta de carrocero todo lo que no quieras pintar. Pega el borde con una espátula para líneas perfectas.",
      "En spray: mantén siempre la misma distancia (25-30 cm) y mueve la mano de forma constante, nunca pares en un punto.",
      "Lija ligeramente entre mano y mano con papel de agua 220 para que la siguiente capa agarre mejor.",
      "Pinta de arriba a abajo para controlar los goteados.",
      "Los rodillos de pelo corto dan acabado liso, los de pelo largo cubren mejor superficies rugosas.",
      "Mezcla bien la pintura: remueve desde el fondo. Si lleva tiempo guardada, cuélala para eliminar grumos.",
      "Pinta con buena iluminación para detectar zonas sin cubrir antes de que seque.",
    ]
  },
  limpieza: {
    emoji: "🧹", color: "text-green-600", bg: "bg-green-50", tips: [
      "Establece zonas de trabajo y no mezcles materiales entre ellas: madera con madera, metal con metal.",
      "Al acabar cada jornada, dedica 15 minutos a recoger. Un taller ordenado es un taller seguro y eficiente.",
      "Guarda las herramientas siempre en el mismo sitio. Lo que tiene un sitio fijo nunca se pierde.",
      "Barre la viruta y serrín antes de mojar cualquier superficie, si no se convierte en barro.",
      "Limpia las herramientas justo después de usarlas: la pintura seca en un rodillo arruina la herramienta.",
      "Usa contenedores etiquetados para tornillos, clavos y piezas pequeñas. Un bote de cristal para cada tipo.",
      "El suelo libre de cables y materiales evita tropiezos. Pasa los cables por arriba o pégatelos a la pared.",
      "Revisa periódicamente los trapos con disolvente o aceite: pueden arder solos (combustión espontánea). Guárdalos en contenedores metálicos cerrados.",
    ]
  },
  albanileria: {
    emoji: "🧱", color: "text-stone-600", bg: "bg-stone-100", tips: [
      "Humedece el soporte antes de aplicar mortero o yeso para evitar que absorba el agua de la mezcla demasiado rápido.",
      "La regla de oro del mortero: si está demasiado seco añade agua, si cae solo del palé está demasiado líquido.",
      "Usa niveles de burbuja continuamente. Comprobar mientras trabajas es más fácil que corregir una vez seco.",
      "Aplica el mortero en forma de zigzag sobre el soporte para mejorar el agarre.",
      "Deja curar el hormigón al menos 28 días para que alcance su resistencia total. Mantenlo húmedo los primeros días.",
      "Para cortes limpios en azulejo, usa cortadora de disco de diamante mojada.",
      "Las juntas uniformes dan aspecto profesional: usa crucetas de plástico para separar azulejos.",
      "Trabaja de dentro hacia fuera para no pisar lo que ya has puesto.",
    ]
  },
  estructura: {
    emoji: "🏗️", color: "text-slate-600", bg: "bg-slate-100", tips: [
      "Planifica la estructura en papel antes de cortar: ahorra material y tiempo.",
      "Los perfiles en L y en U son más resistentes que los rectangulares a igualdad de peso.",
      "Triangula siempre las estructuras: el triángulo es la forma geométrica más rígida.",
      "Usa tornillería de acero galvanizado en estructuras metálicas para evitar corrosión.",
      "Comprueba la verticalidad de los pilares con nivel o plomada antes de soldar definitivamente.",
      "En uniones metálicas, siempre puntea primero en diagonal opuesta para evitar deformaciones.",
      "Las uniones en cajeado son más resistentes que las a tope: cuando puedas, encastra en vez de pegar.",
      "Piensa en el desmontaje: una carroza que se monta fácil también se desmonta fácil si usas tornillos en vez de soldadura permanente.",
    ]
  },
  electrico: {
    emoji: "⚡", color: "text-yellow-600", bg: "bg-yellow-50", tips: [
      "Desconecta siempre la corriente antes de manipular cualquier cable o conexión.",
      "Usa cable del calibre adecuado: sobredimensionar es seguro, infradimensionar puede provocar incendios.",
      "Las conexiones impermeables IP65 o superior son obligatorias en el exterior.",
      "Etiqueta todos los cables con cinta de colores desde el principio: te ahorrarás horas de búsqueda.",
      "Usa regletas de bornes en vez de empalmar cables directamente con cinta.",
      "Instala siempre un diferencial y magnetotérmico para proteger la instalación.",
      "Para LED de bajo consumo, calcula que necesitas aprox. 10-12W por metro de tira LED en instalaciones de carroza.",
      "Prueba todos los circuitos antes de la noche del desfile. Mejor encontrar el fallo en el taller.",
    ]
  },
  foam_decoracion: {
    emoji: "🎭", color: "text-pink-600", bg: "bg-pink-50", tips: [
      "El foam de alta densidad aguanta mejor la pintura y no se deforma. Usa EPS de al menos 20 kg/m³.",
      "Corta el foam con cúter caliente o hilo de nicromo para bordes limpios y sin partículas.",
      "Aplica una capa de cola blanca + agua (50/50) antes de pintar el foam para que la pintura agarre sin disolver.",
      "Nunca uses spray de pintura directamente sobre foam sin sellarlo: el disolvente lo derrite.",
      "Para formas curvas, el foam puede doblarse con calor suave (secador). No uses soplete directo.",
      "El poliestireno expandido se trabaja muy bien con lija de grano grueso para dar textura de piedra o corteza.",
      "Para unir piezas de foam usa pistola de silicona fría o cola de contacto sin disolventes.",
      "Pinta con acrílicos o emulsión plástica. Son los más compatibles con el foam y tienen buena cobertura.",
    ]
  },
};

function TipsSeccion({ catKey, cat }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={()=>setAbierto(v=>!v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
        <span className={`flex-1 font-semibold text-sm capitalize ${cat.color}`}>{catKey.replace("_"," ")}</span>
        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0"/>}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
            <div className={`px-4 pb-4 pt-2 border-t border-gray-50 ${cat.bg}`}>
              <ul className="space-y-2">
                {cat.tips.map((tip,i)=>(
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white`} style={{background:"#630027"}}>{i+1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sección colapsable ───────────────────────────────────────────────────────
function Seccion({ titulo, icon: Icon, iconColor, bgColor, children, defaultOpen=false }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={()=>setAbierto(v=>!v)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`}/>
        </div>
        <span className="flex-1 font-bold text-gray-800 text-sm">{titulo}</span>
        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0"/>}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22}} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-gray-50 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── HERRAMIENTAS ÚTILES (no calculadoras) ────────────────────────────────────

const UTILES = [
  {
    emoji: "📐", titulo: "Regla de los 3-4-5 (ángulo recto)", color: "text-indigo-700", bg: "bg-indigo-50",
    desc: "Comprueba si una esquina está perfectamente a 90° sin escuadra.",
    pasos: [
      "Desde el vértice de la esquina, mide 3 unidades por un lado y marca.",
      "Mide 4 unidades por el otro lado y marca.",
      "La distancia entre las dos marcas debe ser exactamente 5 unidades.",
      "Si mide 5 unidades: la esquina está a 90°. Si no, ajusta hasta conseguirlo.",
      "💡 Puedes usar cualquier múltiplo: 6-8-10, 30-40-50, etc.",
    ],
  },
  {
    emoji: "🧵", titulo: "Línea de referencia con hilo", color: "text-pink-700", bg: "bg-pink-50",
    desc: "Técnica para trazar líneas rectas largas sin regla.",
    pasos: [
      "Clava dos puntillas en los extremos de la línea que quieres trazar.",
      "Tensa un hilo de nailon entre las dos puntillas.",
      "Frota el hilo con tiza o carbón.",
      "Sujeta con una mano el centro, levanta el hilo y suéltalo: dejará una línea recta perfecta.",
      "💡 Funciona en distancias de hasta 10 metros con hilo tenso.",
    ],
  },
  {
    emoji: "🪣", titulo: "Nivel de agua (manguera)", color: "text-blue-700", bg: "bg-blue-50",
    desc: "Nivelar dos puntos alejados sin nivel láser usando solo una manguera.",
    pasos: [
      "Llena una manguera transparente de agua hasta que no tenga burbujas de aire.",
      "Sujeta un extremo en el punto A y el otro en el punto B.",
      "El agua en ambos extremos siempre queda al mismo nivel (principio de vasos comunicantes).",
      "Marca el nivel del agua en cada extremo: esas dos marcas están exactamente a la misma altura.",
      "💡 Útil para nivelar la plataforma de la carroza sobre terreno irregular.",
    ],
  },
  {
    emoji: "🔩", titulo: "Cómo usar taco y tornillo correctamente", color: "text-gray-700", bg: "bg-gray-50",
    desc: "Guía para anclar piezas en paredes de obra, pladur o madera.",
    pasos: [
      "Taladra el agujero del mismo diámetro que el taco (ej: taco 6mm → broca 6mm).",
      "El agujero debe ser 2-3 mm más profundo que el taco.",
      "Introduce el taco a golpe de martillo hasta que quede a ras.",
      "Atornilla con el tornillo recomendado para ese taco: debe quedar fijo y sin girar el taco.",
      "💡 En pladur sin taco de mariposa, el taco normal no agarra. Usa tacos de mariposa o anclajes de expansión.",
      "💡 En metal: rosca directa sin taco, o tuerca+arandela por detrás.",
    ],
  },
  {
    emoji: "🔧", titulo: "Par de apriete manual sin llave dinamométrica", color: "text-orange-700", bg: "bg-orange-50",
    desc: "Estimar el apriete correcto en uniones roscadas.",
    pasos: [
      "Aprieta con los dedos hasta que no gire más (apriete a mano).",
      "Con la llave, da un cuarto de vuelta adicional (90°) para uniones ligeras.",
      "Para uniones estructurales: media vuelta adicional (180°).",
      "Comprueba que la unión no cruje ni se mueve al aplicar carga.",
      "⚠️ No aprietes en exceso: puedes romper la rosca o deformar la pieza.",
      "💡 Para acero galvanizado al aire libre, aplica grasa de litio en la rosca antes de montar.",
    ],
  },
  {
    emoji: "🪝", titulo: "Cómo doblar tubo sin arrugarlo", color: "text-teal-700", bg: "bg-teal-50",
    desc: "Técnica para doblar tubos metálicos sin dobladora mecánica.",
    pasos: [
      "Llena el tubo de arena seca y cierra los extremos con trapos o tapones.",
      "Calienta uniformemente la zona a doblar con soplete hasta que esté al rojo.",
      "Dobla lentamente sobre una forma o mandril redondo del radio deseado.",
      "La arena interior evita que el tubo se aplaste o arrugue.",
      "Deja enfriar al aire. Vacía la arena sacudiendo el tubo.",
      "💡 Sin arena, el tubo se aplasta: solo funciona para radios muy grandes.",
    ],
  },
  {
    emoji: "🎨", titulo: "Mezclar colores de pintura", color: "text-violet-700", bg: "bg-violet-50",
    desc: "Guía rápida para obtener los colores más comunes mezclando primarios.",
    pasos: [
      "🔴+🔵 = Morado/Violeta (más rojo = más cálido, más azul = más frío)",
      "🔴+🟡 = Naranja (más rojo = más intenso, más amarillo = más claro)",
      "🔵+🟡 = Verde (más azul = más frío, más amarillo = más brillante)",
      "⚫+⚪ = Grises (proporciones controlan la intensidad)",
      "Cualquier color+⚪ = versión pastel del color",
      "Cualquier color+⚫ = versión oscura/sombra del color",
      "💡 Para reproducir un color exacto: anota siempre las proporciones (ej: 3 partes rojo + 1 parte blanco).",
      "💡 Haz siempre más mezcla de la que crees necesitar: reproducir el mismo tono es muy difícil.",
    ],
  },
  {
    emoji: "📏", titulo: "Cómo cortar un círculo en tablero", color: "text-emerald-700", bg: "bg-emerald-50",
    desc: "Método para cortar círculos perfectos con sierra de calar.",
    pasos: [
      "Localiza el centro del círculo y clava un clavo pequeño.",
      "Ata una cuerda o varilla al clavo con longitud igual al radio deseado.",
      "Ata un lápiz al otro extremo de la cuerda: ya tienes un compás.",
      "Dibuja el círculo completo.",
      "Taladra un agujero de inicio dentro del círculo para introducir la hoja de la sierra de calar.",
      "Corta siguiendo la línea, moviendo la sierra a velocidad constante.",
      "💡 Para círculos mayores de 30cm, usa un compás de varilla hecho con madera fina.",
    ],
  },
  {
    emoji: "🧊", titulo: "Cómo trabajar el poliestireno (foam/EPS)", color: "text-cyan-700", bg: "bg-cyan-50",
    desc: "Técnicas de corte, pegado y acabado del foam para decoración de carrozas.",
    pasos: [
      "Corte con cúter: marca la línea, apoya una regla metálica y corta con pasadas sucesivas.",
      "Corte curvo: usa hilo de nicromo calentado con resistencia eléctrica o con mechero (en exterior ventilado).",
      "Pegar foam a foam: cola blanca + presión 10 min, o pistola de silicona fría.",
      "⚠️ NUNCA uses pegamento de contacto con disolventes sobre foam: lo derrite.",
      "Para pintar: sella primero con cola blanca diluida (1:1 con agua) y deja secar. Luego pinta con acrílico.",
      "Para texturizar: lija con papel de grano grueso (P60-P80) en movimientos circulares.",
      "Reparar grietas: rellena con espuma de poliuretano, deja secar y lija.",
    ],
  },
  {
    emoji: "🔗", titulo: "Nudos útiles para el taller", color: "text-amber-700", bg: "bg-amber-50",
    desc: "Nudos básicos para sujetar, tensar y asegurar elementos de la carroza.",
    pasos: [
      "Ballestrinque: para amarrar cuerdas a postes o tubos. Rápido de hacer y deshacer.",
      "As de guía: forma un lazo fijo que no se aprieta. Ideal para enganchar cables o elementos a estructuras.",
      "Nudo de tensión (trucamán): para tensar cuerdas largas de amarre o lonas.",
      "Nudo plano: para unir dos cuerdas del mismo grosor.",
      "💡 Para cargas elevadas, usa cinchas de amarre con trinquete (ratchet strap) en lugar de cuerdas.",
      "💡 Los nudos en cuerdas de nailon mojadas se aprietan mucho: usa siempre un segundo nudo de seguridad.",
    ],
  },
  {
    emoji: "🌡️", titulo: "Temperatura de trabajo de materiales", color: "text-red-700", bg: "bg-red-50",
    desc: "Rangos de temperatura para aplicar correctamente pinturas, adhesivos y morteros.",
    pasos: [
      "Pintura acrílica (al agua): entre 10°C y 35°C. Por debajo no seca bien, por encima se reseca rápido.",
      "Pintura epoxi: entre 15°C y 30°C. Temperatura baja ralentiza el curado.",
      "Cola blanca (PVA): mínimo 5°C. El frío la hace grumosa y pierde adherencia.",
      "Mortero de cemento: entre 5°C y 35°C. Por debajo de 5°C puede helarse y no curar bien.",
      "Silicona: entre -5°C y 40°C. La humedad ayuda al curado de silicona neutra.",
      "Espuma de poliuretano: entre 5°C y 30°C. Por encima expande más de lo esperado.",
      "💡 En días muy calurosos: humedece el soporte antes de aplicar mortero para evitar secado rápido.",
    ],
  },
  {
    emoji: "⚖️", titulo: "Centro de gravedad en la carroza", color: "text-purple-700", bg: "bg-purple-50",
    desc: "Cómo distribuir el peso para evitar que la carroza vuelque o se ladee.",
    pasos: [
      "El centro de gravedad debe estar lo más bajo posible: coloca los elementos más pesados cerca del suelo.",
      "Distribuye el peso simétricamente de izquierda a derecha respecto al eje central.",
      "Antes de fijar elementos pesados, prueba a empujar lateralmente la estructura: no debe inclinarse más de 5°.",
      "Las figuras altas y pesadas deben anclarse a la estructura inferior con varillas o tensores.",
      "💡 Regla práctica: el peso total de la decoración no debe superar el 40% del peso de la plataforma.",
      "💡 Comprueba la distribución cargando la carroza y haciéndola pasar por una rampa o bordillo.",
    ],
  },
];

function UtilItem({ item }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={()=>setAbierto(v=>!v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <span className="text-2xl flex-shrink-0">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${item.color}`}>{item.titulo}</p>
          <p className="text-xs text-gray-400 truncate">{item.desc}</p>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0"/>}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
            <div className={`px-4 pb-4 pt-3 border-t border-gray-50 ${item.bg}`}>
              <ol className="space-y-2">
                {item.pasos.map((p,i)=>{
                  const esNota = p.startsWith("💡")||p.startsWith("⚠️");
                  return (
                    <li key={i} className={`flex items-start gap-2 text-sm ${esNota?"text-blue-700 font-medium":"text-gray-700"}`}>
                      {!esNota && <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#630027] flex items-center justify-center text-xs font-bold text-white">{i+1}</span>}
                      <span>{p}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  { id:"calc", label:"Calculadoras", icon:Calculator },
  { id:"utiles", label:"Técnicas", icon:Hammer },
  { id:"tips", label:"Tips", icon:Lightbulb },
];

export default function Herramientas() {
  const [tab, setTab] = useState("calc");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.35}} className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <Wrench className="w-7 h-7 text-[#630027]"/>
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#630027]">Herramientas</h1>
          <p className="text-gray-400 text-sm">Calculadoras y consejos para la construcción</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {TABS.map(t=>{
          const Icon=t.icon;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab===t.id?"bg-white shadow text-[#630027]":"text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-4 h-4"/>{t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "calc" && (
          <motion.div key="calc" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{duration:0.2}} className="space-y-3">
            <Seccion titulo="Calculadora" icon={Calculator} iconColor="text-gray-700" bgColor="bg-gray-100" defaultOpen>
              <CalcNormal/>
            </Seccion>
            <Seccion titulo="Volumen, superficie y perímetro" icon={Square} iconColor="text-[#630027]" bgColor="bg-[#630027]/10">
              <CalcMateriales/>
            </Seccion>
            <Seccion titulo="Círculos y arcos" icon={Circle} iconColor="text-purple-600" bgColor="bg-purple-50">
              <CalcCirculo/>
            </Seccion>
            <Seccion titulo="Ángulos, rampas e inclinaciones" icon={Triangle} iconColor="text-indigo-600" bgColor="bg-indigo-50">
              <CalcAngulos/>
            </Seccion>
            <Seccion titulo="Peso por material" icon={Weight} iconColor="text-blue-600" bgColor="bg-blue-50">
              <CalcPeso/>
            </Seccion>
            <Seccion titulo="Mezclas y morteros" icon={Layers} iconColor="text-stone-600" bgColor="bg-stone-100">
              <CalcMezclas/>
            </Seccion>
            <Seccion titulo="Longitud de tornillo / clavo" icon={Wrench} iconColor="text-gray-600" bgColor="bg-gray-100">
              <CalcTornillos/>
            </Seccion>
            <Seccion titulo="Resistencia de vigas (básico)" icon={ArrowRight} iconColor="text-orange-600" bgColor="bg-orange-50">
              <CalcVigas/>
            </Seccion>
            <Seccion titulo="Pintura necesaria" icon={Paintbrush} iconColor="text-yellow-600" bgColor="bg-yellow-50">
              <CalcPintura/>
            </Seccion>
            <Seccion titulo="Ley de Ohm (eléctrica)" icon={Zap} iconColor="text-yellow-500" bgColor="bg-yellow-50">
              <CalcElectrico/>
            </Seccion>
            <Seccion titulo="Nivelación de superficies" icon={Ruler} iconColor="text-cyan-600" bgColor="bg-cyan-50">
              <CalcNiveles/>
            </Seccion>
            <Seccion titulo="Conversión de unidades" icon={RotateCcw} iconColor="text-green-600" bgColor="bg-green-50">
              <CalcConversiones/>
            </Seccion>
            <Seccion titulo="Presupuesto de materiales" icon={Layers} iconColor="text-emerald-600" bgColor="bg-emerald-50">
              <CalcPresupuesto/>
            </Seccion>
            <Seccion titulo="Horas-hombre y coste de mano de obra" icon={Hammer} iconColor="text-rose-600" bgColor="bg-rose-50">
              <CalcTiempo/>
            </Seccion>
          </motion.div>
        )}

        {tab === "utiles" && (
          <motion.div key="utiles" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{duration:0.2}} className="space-y-3">
            <div className="bg-[#630027]/5 border border-[#630027]/10 rounded-2xl px-4 py-3 text-sm text-[#630027] font-medium">
              🛠️ Técnicas prácticas, trucos y procedimientos para la construcción de la carroza
            </div>
            {UTILES.map((u,i)=><UtilItem key={i} item={u}/>)}
          </motion.div>
        )}

        {tab === "tips" && (
          <motion.div key="tips" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:0.2}} className="space-y-3">
            <div className="bg-[#630027]/5 border border-[#630027]/10 rounded-2xl px-4 py-3 text-sm text-[#630027] font-medium">
              💡 Consejos prácticos de los distintos oficios presentes en la construcción de una carroza
            </div>
            {Object.entries(TIPS).map(([k,v])=><TipsSeccion key={k} catKey={k} cat={v}/>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
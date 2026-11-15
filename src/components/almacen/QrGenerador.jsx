import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, X, QrCode } from "lucide-react";

export default function QrGenerador({ item, onClose }) {
  const canvasWrapRef = useRef(null);

  const qrValue = `pena_item:${item.id}`;

  const handleDescargar = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Crear canvas final con QR + nombre debajo
    const padding = 16;
    const textoAlto = 36;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + padding * 2;
    finalCanvas.height = canvas.height + padding * 2 + textoAlto;
    const ctx = finalCanvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      item.nombre.length > 28 ? item.nombre.slice(0, 26) + "…" : item.nombre,
      finalCanvas.width / 2,
      canvas.height + padding * 2 + 14
    );

    const a = document.createElement("a");
    a.download = `qr_${item.nombre.replace(/\s+/g, "_")}.png`;
    a.href = finalCanvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#630027]" />
            <h3 className="font-black text-[#630027] text-lg">Código QR</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* QR + nombre */}
        <div className="flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div ref={canvasWrapRef}>
            <QRCodeCanvas
              value={qrValue}
              size={200}
              bgColor="#ffffff"
              fgColor="#1a1a1a"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-sm font-bold text-gray-800 text-center leading-tight max-w-[200px] break-words">
            {item.nombre}
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Escanea con el botón QR del inventario para abrir la ficha del producto
        </p>

        <button
          onClick={handleDescargar}
          className="w-full flex items-center justify-center gap-2 bg-[#630027] hover:bg-[#4a001d] text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar para imprimir
        </button>
      </div>
    </div>
  );
}
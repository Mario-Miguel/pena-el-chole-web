import React, { useEffect, useRef, useState } from "react";
import { X, QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScannerDialog({ open, onClose, items, onItemEncontrado }) {
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    if (!open) return;

    let scanner = null;

    const startScanner = async () => {
      setError(null);
      setScanning(true);
      try {
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Formato propio: pena_item:<id>
            let id = decodedText;
            if (decodedText.startsWith("pena_item:")) {
              id = decodedText.replace("pena_item:", "");
            }
            const encontrado = items.find(
              i => i.id === id || i.nombre.toLowerCase() === decodedText.toLowerCase()
            );
            if (encontrado) {
              stopScanner(scanner);
              onItemEncontrado(encontrado);
              onClose();
            } else {
              setError(`No se encontró ningún artículo con este código QR`);
            }
          },
          () => {}
        );
      } catch (e) {
        setError("No se pudo acceder a la cámara. Comprueba los permisos.");
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        stopScanner(scannerRef.current);
      }
    };
  }, [open]);

  const stopScanner = (scanner) => {
    if (scanner?.isScanning) {
      scanner.stop().catch(() => {});
    }
    setScanning(false);
  };

  const handleClose = () => {
    if (scannerRef.current) stopScanner(scannerRef.current);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#630027]" />
            <h3 className="font-black text-[#4B1924] text-lg">Escanear artículo</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-5 pb-2 text-xs text-gray-400 text-center">
          Apunta la cámara al código QR del artículo
        </div>

        <div
          id={containerId}
          className="mx-4 mb-4 rounded-xl overflow-hidden bg-gray-900"
          style={{ minHeight: 280 }}
        />

        {error && (
          <div className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
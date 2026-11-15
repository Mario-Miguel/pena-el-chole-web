import React, { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function exportCSV(items, movimientos) {
  // Inventario
  let csv = "INVENTARIO\nNombre,Categoría,Cantidad,Stock Mínimo,Proveedor,Contacto Proveedor\n";
  items.forEach(i => {
    csv += `"${i.nombre}","${i.categoria}",${i.cantidad ?? 0},${i.stock_minimo ?? 0},"${i.proveedor || ""}","${i.proveedor_telefono || ""}"\n`;
  });

  csv += "\nREGISTRO DE MOVIMIENTOS\nFecha,Artículo,Tipo,Cantidad,Stock Anterior,Stock Nuevo,Usuario\n";
  movimientos.forEach(m => {
    const fecha = m.created_date ? format(new Date(m.created_date), "dd/MM/yyyy HH:mm", { locale: es }) : "";
    csv += `"${fecha}","${m.item_nombre}","${m.tipo}",${m.cantidad},${m.cantidad_anterior ?? ""},${m.cantidad_nueva ?? ""},"${m.integrante_nombre || ""}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `almacen_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(items, movimientos) {
  const fecha = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
  let html = `
    <html><head><meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 20px; }
      h1 { color: #630027; font-size: 20px; margin-bottom: 4px; }
      h2 { color: #630027; font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #630027; padding-bottom: 4px; }
      .meta { color: #888; font-size: 11px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { background: #630027; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
      tr:nth-child(even) td { background: #faf0f3; }
      .badge-entrada { color: #15803d; font-weight: bold; }
      .badge-salida { color: #b91c1c; font-weight: bold; }
      .alert { color: #b45309; font-weight: bold; }
    </style></head><body>
    <h1>📦 Informe Almacén — Peña El Chole</h1>
    <div class="meta">Generado el ${fecha} · ${items.length} artículos · ${movimientos.length} movimientos</div>

    <h2>Inventario Actual</h2>
    <table>
      <tr><th>Artículo</th><th>Categoría</th><th>Cantidad</th><th>Stock Mín.</th><th>Proveedor</th><th>Contacto</th></tr>
      ${items.map(i => `<tr>
        <td>${i.nombre}</td>
        <td>${i.categoria}</td>
        <td${(i.stock_minimo > 0 && (i.cantidad ?? 0) < i.stock_minimo) ? ' class="alert"' : ''}>${i.cantidad ?? 0}</td>
        <td>${i.stock_minimo ?? 0}</td>
        <td>${i.proveedor || "-"}</td>
        <td>${i.proveedor_telefono || "-"}</td>
      </tr>`).join("")}
    </table>

    <h2>Registro de Movimientos (últimos 200)</h2>
    <table>
      <tr><th>Fecha</th><th>Artículo</th><th>Tipo</th><th>Cantidad</th><th>Antes</th><th>Después</th><th>Usuario</th></tr>
      ${movimientos.map(m => {
        const f = m.created_date ? format(new Date(m.created_date), "dd/MM/yy HH:mm", { locale: es }) : "";
        return `<tr>
          <td>${f}</td>
          <td>${m.item_nombre}</td>
          <td class="${m.tipo === "entrada" ? "badge-entrada" : "badge-salida"}">${m.tipo === "entrada" ? "⬆ Entrada" : "⬇ Salida"}</td>
          <td>${m.cantidad}</td>
          <td>${m.cantidad_anterior ?? ""}</td>
          <td>${m.cantidad_nueva ?? ""}</td>
          <td>${m.integrante_nombre || "-"}</td>
        </tr>`;
      }).join("")}
    </table>
    </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function ExportarAlmacen({ items, onExportCSV, onExportPDF }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (tipo) => {
    setLoading(true);
    const movimientos = await base44.entities.MovimientoAlmacen.list("-created_date", 200);
    setLoading(false);
    if (tipo === "csv") exportCSV(items, movimientos);
    else exportPDF(items, movimientos);
  };

  return (
    <>
      <button
        onClick={() => handleExport("csv")}
        disabled={loading}
        title="Exportar CSV"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 transition-colors shadow-sm"
      >
        <Table className="w-4 h-4 text-green-600" />
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading}
        title="Exportar PDF"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4 text-red-500" />
      </button>
    </>
  );
}
/**
 * Recoge el código fuente real de src/ como texto (vía import.meta.glob de Vite)
 * para incluirlo en la descarga del código de la app.
 */
const modules = import.meta.glob("/src/**/*.{js,jsx,ts,tsx,css,json}", {
  query: "?raw",
  import: "default",
});

export async function getSrcFiles() {
  const entries = await Promise.all(
    Object.entries(modules).map(async ([path, load]) => ({
      path: path.replace(/^\//, ""),
      content: await load(),
    }))
  );
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

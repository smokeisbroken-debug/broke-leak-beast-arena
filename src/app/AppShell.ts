export function mountAppShell(): void {
  const root = document.getElementById("app");
  if (!root) return;

  const loader = document.createElement("div");
  loader.className = "broke-loading";
  loader.textContent = "LOADING LEAK BEAST ARENA";
  root.appendChild(loader);

  window.setTimeout(() => loader.remove(), 650);
}

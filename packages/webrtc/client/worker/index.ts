const context = globalThis;

context.addEventListener("install", () => {
  console.log("[Service Worker] installed");
});

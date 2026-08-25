(() => {
  "use strict";

  const VERSION = "4.2.0";
  const $ = (id) => document.getElementById(id);

  function boot() {
    const runtime = $("runtime");
    const out = $("out");
    const createBtn = $("create");
    const rotateBtn = $("rotate");
    const rotateSofiaBtn = $("rotateSofia");
    const testBackendBtn = $("testBackend");

    if (!runtime || !out || !createBtn || !rotateBtn || !rotateSofiaBtn || !testBackendBtn) {
      console.error("CUYRA Catalog Admin: DOM incompleto");
      return;
    }

    runtime.className = "runtime ok";
    runtime.textContent = `JavaScript activo ✓ · Admin UI ${VERSION}`;

    function setOutput(message, type = "") {
      out.className = type;
      out.textContent = typeof message === "string"
        ? message
        : JSON.stringify(message, null, 2);
    }

    function setBusy(busy) {
      createBtn.disabled = busy;
      rotateBtn.disabled = busy;
      rotateSofiaBtn.disabled = busy;
      testBackendBtn.disabled = busy;
    }

    async function requestJson(url, options = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text = await response.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = { ok: false, error: text || `HTTP ${response.status}` };
        }
        if (!response.ok) {
          const msg = payload?.error || `Error HTTP ${response.status}`;
          throw new Error(msg);
        }
        return payload;
      } finally {
        clearTimeout(timer);
      }
    }

    testBackendBtn.addEventListener("click", async () => {
      setBusy(true);
      setOutput("Probando /api/health...");
      try {
        const data = await requestJson("/api/health", { method: "GET" });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "health",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });

    createBtn.addEventListener("click", async () => {
      const secret = $("secret").value.trim();
      const slug = $("slug").value.trim();
      const publicName = $("name").value.trim();
      const phone = $("phone").value.trim();
      const website = $("website").value.trim();

      if (!secret) return setOutput("Falta la clave administrativa.", "error");
      if (!slug) return setOutput("Falta el slug.", "error");
      if (!publicName) return setOutput("Falta el nombre público.", "error");

      setBusy(true);
      setOutput("Creando catálogo...");

      try {
        const data = await requestJson("/api/admin-create-tenant", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-secret": secret
          },
          body: JSON.stringify({ slug, publicName, phone, website })
        });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "create-tenant",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });


    rotateSofiaBtn.addEventListener("click", async () => {
      const secret = $("secret").value.trim();
      const slug = $("slug").value.trim();
      if (!secret) return setOutput("Falta la clave administrativa.", "error");
      if (!slug) return setOutput("Falta el slug.", "error");
      setBusy(true);
      setOutput("Generando token privado de Sofía...");
      try {
        const data = await requestJson("/api/admin-rotate-sofia-token", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-secret": secret
          },
          body: JSON.stringify({ slug })
        });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "rotate-sofia-token",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });
    rotateBtn.addEventListener("click", async () => {
      const secret = $("secret").value.trim();
      const slug = $("slug").value.trim();

      if (!secret) return setOutput("Falta la clave administrativa.", "error");
      if (!slug) return setOutput("Falta el slug.", "error");

      setBusy(true);
      setOutput("Rotando token...");

      try {
        const data = await requestJson("/api/admin-rotate-token", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-secret": secret
          },
          body: JSON.stringify({ slug })
        });
        setOutput(data, "ok");
      } catch (error) {
        setOutput({
          ok: false,
          step: "rotate-token",
          error: error?.name === "AbortError"
            ? "Tiempo de espera agotado (20 s)."
            : (error instanceof Error ? error.message : String(error))
        }, "error");
      } finally {
        setBusy(false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

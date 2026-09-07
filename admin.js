function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(ms) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function setStatus(msg) {
  const el = document.getElementById("adminStatus");
  el.textContent = msg || "";
}

function renderChecked() {
  const list = document.getElementById("checkedList");
  const count = document.getElementById("checkedCount");
  const checked = window.QRData ? window.QRData.getChecked() : {};

  const items = Object.values(checked).sort((a, b) => (b.checkedAt || 0) - (a.checkedAt || 0));
  count.textContent = `${items.length} scanned`;

  if (items.length === 0) {
    list.innerHTML = `<div class="item"><strong>No students scanned yet.</strong><div class="meta"><span>Scan a QR to mark scanned.</span></div></div>`;
    return;
  }

  list.innerHTML = items
    .map(
      (x) => `
        <div class="item">
          <div><strong>${escapeHtml(x.name || "Unknown")}</strong> — ${escapeHtml(x.enrollment || "")}</div>
          <div class="meta">
            <span>Scanned at: ${escapeHtml(formatTime(x.checkedAt))}</span>
            <span>QR created: ${escapeHtml(formatTime(x.timestamp))}</span>
          </div>
          <div class="actions" style="margin-top: 8px">
            <button type="button" class="btn-secondary" data-reset="${escapeHtml(x.enrollment || "")}">
              Reset (scan again)
            </button>
          </div>
        </div>
      `
    )
    .join("");

  // attach reset handlers
  list.querySelectorAll("[data-reset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const enr = btn.getAttribute("data-reset") || "";
      const ok = window.QRData.resetCheckedFor(enr);
      setStatus(ok ? `Reset: ${enr} can be scanned again.` : "Nothing to reset.");
      renderChecked();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Admin lock
  // NOTE: relies entirely on auth.js. If auth.js fails to load, there is no
  // separate hardcoded fallback here anymore (that duplicate password used to
  // silently drift out of sync with auth.js) — we just block access instead.
  if (!window.AppAuth) {
    alert("Auth module (auth.js) failed to load. Cannot verify admin access.");
    window.location.href = "./index.html";
    return;
  }
  if (!window.AppAuth.requireAdminOrRedirect()) return;

  if (!window.QRData) {
    setStatus("Data module not loaded.");
    return;
  }

  const nameInput = document.getElementById("adminName");
  const enrollInput = document.getElementById("adminEnroll");
  const genBtn = document.getElementById("adminGenerate");
  const downloadBtn = document.getElementById("adminDownload");
  const qrWrap = document.getElementById("adminQrWrap");
  const qrDiv = document.getElementById("adminQrcode");
  const openScannerBtn = document.getElementById("adminOpenScanner");
  const clearCheckedAllBtn = document.getElementById("clearCheckedAll");
  const clearGeneratedAllBtn = document.getElementById("clearGeneratedAll");

  let currentQr = null;

  renderChecked();

  genBtn.addEventListener("click", () => {
    const name = window.QRData.normaliseName(nameInput.value);
    const enrollment = window.QRData.normaliseEnrollment(enrollInput.value);
    if (!name || !enrollment) {
      setStatus("Please enter name and enrollment.");
      return;
    }

    const res = window.QRData.getOrCreateGenerated({ name, enrollment });
    setStatus(res.created ? "QR generated (one-time)." : "QR already generated (one-time).");

    // Actually render the QR image (previously this was missing entirely).
    if (typeof QRCode === "undefined") {
      setStatus("QR generated, but the QRCode library failed to load — no image to show.");
      return;
    }

    qrDiv.innerHTML = "";
    currentQr = new QRCode(qrDiv, {
      text: res.entry.qrText,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    qrWrap.style.display = "flex";
    downloadBtn.style.display = "inline-flex";
  });

  downloadBtn.addEventListener("click", () => {
    if (!currentQr) return;
    const canvasOrImg = qrDiv.querySelector("canvas") || qrDiv.querySelector("img");
    if (!canvasOrImg) return;

    const dataUrl =
      canvasOrImg.tagName.toLowerCase() === "canvas"
        ? canvasOrImg.toDataURL("image/png")
        : canvasOrImg.src;

    const safeName = (window.QRData.normaliseName(nameInput.value) || "student").replace(/\s+/g, "_");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${safeName}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  openScannerBtn.addEventListener("click", () => {
    // Ask scanner password as well (separate lock)
    if (window.AppAuth && !window.AppAuth.requireScannerOrRedirect()) return;
    window.location.href = "./scan.html";
  });

  clearCheckedAllBtn.addEventListener("click", () => {
    const ok = confirm("Reset ALL scanned students? They can be scanned again.");
    if (!ok) return;
    window.QRData.clearCheckedAll();
    setStatus("All scanned entries reset.");
    renderChecked();
  });

  clearGeneratedAllBtn.addEventListener("click", () => {
    const ok = confirm("Clear ALL generated QRs? This will allow generating again.");
    if (!ok) return;
    window.QRData.clearGeneratedAll();
    setStatus("All generated QRs cleared.");
  });
});



// Simple in-browser QR generator using name + enrollment number
// No Firebase required.

document.addEventListener("DOMContentLoaded", () => {
  // Side menu (drawer)
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  const openMenuBtn = document.getElementById("openMenuBtn");
  const scannerLinkBtn = document.getElementById("scannerLinkBtn");
  const adminLinkBtn = document.getElementById("adminLinkBtn");

  function openDrawer() {
    drawer?.classList.add("open");
    if (overlay) overlay.style.display = "block";
  }

  function closeDrawer() {
    drawer?.classList.remove("open");
    if (overlay) overlay.style.display = "none";
  }

  openMenuBtn?.addEventListener("click", openDrawer);
  overlay?.addEventListener("click", closeDrawer);

  scannerLinkBtn?.addEventListener("click", () => {
    closeDrawer();
    if (!window.AppAuth) {
      alert("Auth module not loaded.");
      return;
    }
    if (window.AppAuth.requireScannerOrRedirect()) window.location.href = "./scan.html";
  });

  adminLinkBtn?.addEventListener("click", () => {
    closeDrawer();
    if (!window.AppAuth) {
      alert("Auth module not loaded.");
      return;
    }
    if (window.AppAuth.requireAdminOrRedirect()) window.location.href = "./admin.html";
  });

  const form = document.getElementById("qrForm");
  const nameInput = document.getElementById("studentName");
  const enrollInput = document.getElementById("enrollment");
  const status = document.getElementById("status");
  const qrDiv = document.getElementById("qrcode");
  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");
  const qrMeta = document.getElementById("qrMeta");

  let qr;

  function setStatus(message, type = "") {
    status.textContent = message || "";
    status.classList.remove("error", "ok");
    if (type) status.classList.add(type);
  }

  function normaliseText(str) {
    return str.trim().replace(/\s+/g, " ");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const rawName = normaliseText(nameInput.value);
    const rawEnroll = normaliseText(enrollInput.value).toUpperCase();

    if (!rawName || !rawEnroll) {
      setStatus("Please fill both Name and Enrollment number.", "error");
      return;
    }

    if (!window.QRData) {
      setStatus("Data module not loaded.", "error");
      return;
    }

    // QR can be generated only once per enrollment (stored locally)
    let result;
    try {
      result = window.QRData.getOrCreateGenerated({
        name: rawName,
        enrollment: rawEnroll,
      });
    } catch {
      setStatus("Invalid name or enrollment.", "error");
      return;
    }

    const text = result.entry.qrText;

    // Clear old QR
    qrDiv.innerHTML = "";
    qrDiv.classList.remove("empty");

    qr = new QRCode(qrDiv, {
      text,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    qrMeta.innerHTML = `Generated for <strong>${rawName}</strong> (${rawEnroll})`;
    setStatus(
      result.created ? "QR generated successfully." : "QR already generated (one-time only).",
      "ok"
    );
    downloadBtn.style.display = "inline-flex";
  });

  downloadBtn.addEventListener("click", () => {
    if (!qr) return;

    const canvas =
      qrDiv.querySelector("canvas") || qrDiv.querySelector("img");
    if (!canvas) return;

    const name = normaliseText(nameInput.value) || "student";
    let dataUrl;

    if (canvas.tagName.toLowerCase() === "canvas") {
      dataUrl = canvas.toDataURL("image/png");
    } else {
      dataUrl = canvas.src;
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name.replace(/\s+/g, "_")}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  resetBtn.addEventListener("click", () => {
    nameInput.value = "";
    enrollInput.value = "";
    qrDiv.innerHTML = "";
    qrDiv.classList.add("empty");
    qrMeta.textContent = "No data yet.";
    downloadBtn.style.display = "none";
    qr = null;
    setStatus("");
    nameInput.focus();
  });
});
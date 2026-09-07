// Shared localStorage-backed data store for generator/admin/scanner
// No backend: this persists only in this browser.

(() => {
  const KEYS = {
    generated: "qr_generated_entries_v1",
    checked: "qr_checked_entries_v1",
  };

  function safeJsonParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  function loadMap(key) {
    return safeJsonParse(localStorage.getItem(key) || "{}", {});
  }

  function saveMap(key, map) {
    localStorage.setItem(key, JSON.stringify(map));
  }

  function normaliseEnrollment(enrollment) {
    return String(enrollment || "").trim().toUpperCase();
  }

  function normaliseName(name) {
    return String(name || "").trim().replace(/\s+/g, " ");
  }

  function randomToken(len = 8) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function getGenerated() {
    return loadMap(KEYS.generated);
  }

  function saveGenerated(map) {
    saveMap(KEYS.generated, map);
  }

  function getChecked() {
    return loadMap(KEYS.checked);
  }

  function saveChecked(map) {
    saveMap(KEYS.checked, map);
  }

  function getOrCreateGenerated({ name, enrollment }) {
    const enr = normaliseEnrollment(enrollment);
    const nm = normaliseName(name);
    if (!enr || !nm) throw new Error("Missing name/enrollment");

    const gen = getGenerated();
    if (gen[enr]) return { entry: gen[enr], created: false };

    const entry = {
      name: nm,
      enrollment: enr,
      issuedAt: Date.now(),
      token: randomToken(10),
    };
    entry.qrText = JSON.stringify(entry);

    gen[enr] = entry;
    saveGenerated(gen);
    return { entry, created: true };
  }

  function resetCheckedFor(enrollment) {
    const enr = normaliseEnrollment(enrollment);
    const checked = getChecked();
    if (checked[enr]) {
      delete checked[enr];
      saveChecked(checked);
      return true;
    }
    return false;
  }

  function clearCheckedAll() {
    localStorage.removeItem(KEYS.checked);
  }

  function clearGeneratedAll() {
    localStorage.removeItem(KEYS.generated);
  }

  window.QRData = {
    KEYS,
    normaliseEnrollment,
    normaliseName,
    getGenerated,
    getChecked,
    getOrCreateGenerated,
    resetCheckedFor,
    clearCheckedAll,
    clearGeneratedAll,
    saveChecked,
    saveGenerated,
  };
})();



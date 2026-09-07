// Simple session-based lock for scanner access
// NOTE: This is a front-end only lock (not true security).

(() => {
  const ADMIN_PASS = "@8084admin#";
  const SCANNER_PASS = "983577";
  const KEYS = {
    scanner: "scanner_unlocked_v1",
    admin: "admin_unlocked_v1",
  };

  function isUnlocked(key) {
    return sessionStorage.getItem(key) === "1";
  }

  function setUnlocked(key) {
    sessionStorage.setItem(key, "1");
  }

  function promptPassword(promptText, expected) {
    const entered = window.prompt(promptText || "Enter password:");
    if (entered === null) return false;
    if (String(entered).trim() === expected) {
      return true;
    }
    alert("Wrong password!");
    return false;
  }

  // Expose minimal helpers
  window.AppAuth = {
    KEYS,
    isScannerUnlocked() {
      return isUnlocked(KEYS.scanner);
    },
    isAdminUnlocked() {
      return isUnlocked(KEYS.admin);
    },
    requireScannerOrRedirect() {
      if (isUnlocked(KEYS.scanner)) return true;
      const ok = promptPassword("Enter scanner password:", SCANNER_PASS);
      if (ok) {
        setUnlocked(KEYS.scanner);
        return true;
      }
      window.location.href = "./index.html";
      return false;
    },
    requireAdminOrRedirect() {
      if (isUnlocked(KEYS.admin)) return true;
      const ok = promptPassword("Enter admin password:", ADMIN_PASS);
      if (ok) {
        setUnlocked(KEYS.admin);
        return true;
      }
      window.location.href = "./index.html";
      return false;
    },
    lockAll() {
      try {
        sessionStorage.removeItem(KEYS.scanner);
        sessionStorage.removeItem(KEYS.admin);
      } catch {
        // ignore
      }
    },
  };
})();



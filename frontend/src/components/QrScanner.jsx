import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Scans the teacher's rotating QR and returns the decoded code via onScan.
export default function QrScanner({ onScan }) {
  const [active, setActive] = useState(false);
  const [err, setErr] = useState("");
  const scannerRef = useRef(null);
  const divId = "qr-reader";

  const secure =
    window.isSecureContext ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line
  }, []);

  async function start() {
    setErr("");
    if (!secure) {
      setErr(
        "Camera needs HTTPS. This page is not secure, so the QR scanner can't open on a phone. Type the code below instead."
      );
      return;
    }
    setActive(true);
    try {
      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decoded) => {
          onScan(decoded.trim());
          stop();
        },
        () => {}
      );
    } catch (e) {
      let m = e?.message || String(e);
      if (/NotAllowed|Permission/i.test(m))
        m = "Camera permission denied. Allow camera access, or type the code below.";
      else if (/NotFound/i.test(m)) m = "No camera found on this device.";
      setErr(m);
      setActive(false);
    }
  }

  async function stop() {
    const s = scannerRef.current;
    if (s) {
      try {
        await s.stop();
        await s.clear();
      } catch {}
      scannerRef.current = null;
    }
    setActive(false);
  }

  return (
    <div>
      <div id={divId} style={{ width: "100%", maxWidth: 260, margin: "0 auto" }} />
      {!active ? (
        <button className="btn ghost" onClick={start} type="button">
          Scan QR
        </button>
      ) : (
        <button className="btn ghost" onClick={stop} type="button">
          Stop scanning
        </button>
      )}
      {err && <p style={{ color: "#b00", fontSize: 12, marginTop: 6 }}>{err}</p>}
    </div>
  );
}

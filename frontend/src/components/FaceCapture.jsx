import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

// Loads models from /models (public/models). See README for how to add weights.
let modelsLoaded = false;
async function loadModels() {
  if (modelsLoaded) return;
  const url = "/models";
  await faceapi.nets.tinyFaceDetector.loadFromUri(url);
  await faceapi.nets.faceLandmark68Net.loadFromUri(url);
  await faceapi.nets.faceRecognitionNet.loadFromUri(url);
  modelsLoaded = true;
}

// Eye Aspect Ratio for blink-based liveness
function ear(eye) {
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const v = d(eye[1], eye[5]) + d(eye[2], eye[4]);
  const h = 2 * d(eye[0], eye[3]);
  return v / h;
}

// mode: "enroll" -> just capture descriptor
//       "verify" -> capture descriptor AND require a blink (liveness)
export default function FaceCapture({ mode = "verify", onResult }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Loading models...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        await loadModels();
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus(
          mode === "verify"
            ? "Look at the camera and blink when asked"
            : "Look at the camera"
        );
      } catch (e) {
        setStatus("Camera/model error: " + e.message);
      }
    })();
    return () => stream && stream.getTracks().forEach((t) => t.stop());
  }, [mode]);

  async function capture() {
    setBusy(true);
    try {
      const video = videoRef.current;
      const opts = new faceapi.TinyFaceDetectorOptions();

      // liveness: watch EAR over ~3s and require a blink (EAR dips then recovers)
      let blinked = true;
      if (mode === "verify") {
        setStatus("Please blink now...");
        blinked = false;
        let openSeen = false;
        const start = Date.now();
        while (Date.now() - start < 4000 && !blinked) {
          const det = await faceapi
            .detectSingleFace(video, opts)
            .withFaceLandmarks();
          if (det) {
            const lm = det.landmarks;
            const e = (ear(lm.getLeftEye()) + ear(lm.getRightEye())) / 2;
            if (e > 0.25) openSeen = true;
            if (openSeen && e < 0.18) blinked = true;
          }
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      setStatus("Capturing face...");
      const result = await faceapi
        .detectSingleFace(video, opts)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        setStatus("No face detected, try again");
        setBusy(false);
        return;
      }

      const embedding = Array.from(result.descriptor); // 128 floats
      if (mode === "verify" && !blinked) {
        setStatus("Liveness failed (no blink detected). Try again.");
        onResult({ embedding, livenessPassed: false });
        setBusy(false);
        return;
      }

      setStatus("Done");
      onResult({ embedding, livenessPassed: true });
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    setBusy(false);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", maxWidth: 360, borderRadius: 12, background: "#000" }}
      />
      <p style={{ fontSize: 14, color: "#555" }}>{status}</p>
      <button className="btn" disabled={busy} onClick={capture}>
        {mode === "enroll" ? "Capture & enroll face" : "Scan face"}
      </button>
    </div>
  );
}

"use client";
import { useState, useRef, useEffect } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
export default function CameraCheckin({
  done,
  mode = "in",
}: {
  done: () => void;
  mode?: "in" | "out";
}) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function start() {
    setError("");
    setReady(false);
    stream.current?.getTracks().forEach((t) => t.stop());
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "This browser cannot access a camera. Open this page in Chrome over HTTPS or localhost.",
        );
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (video.current) {
        video.current.srcObject = stream.current;
        await video.current.play();
        setReady(true);
      }
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings, then enable the camera again."
          : name === "NotFoundError"
            ? "No webcam was found. Connect a camera or use regular web check-in."
            : name === "NotReadableError"
              ? "The webcam could not be opened. Close other apps using it, then try again."
              : errorMessage(e),
      );
    }
  }
  async function mark() {
    setBusy(true);
    setError("");
    let stage = "capturing your face";
    try {
      if (!video.current || video.current.readyState < 2)
        throw new Error(
          "The camera is not ready. Restart the camera and wait for the live preview.",
        );
      const capture = document.createElement("canvas");
      const scale = Math.min(
        1,
        640 / Math.max(video.current.videoWidth, video.current.videoHeight),
      );
      capture.width = Math.round(video.current.videoWidth * scale);
      capture.height = Math.round(video.current.videoHeight * scale);
      const context = capture.getContext("2d");
      if (!context || !capture.width || !capture.height)
        throw new Error(
          "Could not capture the camera frame. Restart the camera and try again.",
        );
      context.drawImage(video.current, 0, 0, capture.width, capture.height);
      const photo = capture.toDataURL("image/jpeg", 0.88);
      stage = "matching your face with your employee photo";
      await api.post(
        "/attendance/check-" + mode,
        { source: "camera", photo },
        { timeout: 30000 },
      );
      stream.current?.getTracks().forEach((t) => t.stop());
      done();
    } catch (e) {
      const detail = errorMessage(e);
      setError(
        detail === "Something went wrong."
          ? `Camera verification failed while ${stage}. Check camera access, or use regular web check-in.`
          : detail,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="camera-content">
      <p>
        Your camera frame is sent securely to the application server to match
        your enrolled employee photo. The frame is processed and discarded; only
        the verification result is saved. Location access is not requested.
      </p>
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        className="camera-preview"
        style={{ objectFit: "contain" }}
      />
      {error && <div className="error">{error}</div>}
      <div className="button-row">
        <button className="button" onClick={start} disabled={busy}>
          <Camera size={16} />
          {ready ? "Restart camera" : "Enable camera"}
        </button>
        <button
          className="button primary"
          disabled={!ready || busy}
          onClick={mark}
        >
          <ShieldCheck size={16} />
          {busy
            ? "Matching your face…"
            : mode === "out"
              ? "Verify & check out"
              : "Verify & check in"}
        </button>
      </div>
      <small>
        Requires HTTPS (or localhost), camera access, and a reference photo
        enrolled by HR. If matching fails, request an HR attendance correction.
        No GPS access is required.
      </small>
    </div>
  );
}

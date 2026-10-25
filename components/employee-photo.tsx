"use client";
import { useState } from "react";
import { Camera, Upload, ShieldCheck } from "lucide-react";
import { api, Row, errorMessage } from "@/lib/api";
import Image from "next/image";
export default function EmployeePhoto({
  employee,
  editable,
  onChange,
  onSaved,
}: {
  employee: Row;
  editable: boolean;
  onChange: (photo: string) => void;
  onSaved: (date: string) => void;
}) {
  const [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const src =
    draft ||
    employee.referencePhoto ||
    (employee.faceEnrolledAt
      ? `/api/employees/${employee._id}/photo?v=${encodeURIComponent(employee.faceEnrolledAt)}`
      : "");
  async function choose(file?: File) {
    setError("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG or WebP photo smaller than 2 MB.");
      return;
    }
    try {
      const photo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read this photo."));
        reader.readAsDataURL(file);
      });
      setDraft(photo);
      if (!employee._id) onChange(photo);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = await api.post(
        "/employees/" + employee._id + "/photo",
        { photo: draft },
        { timeout: 30000 },
      );
      setDraft("");
      onSaved(r.data.faceEnrolledAt);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="reference-photo">
      <div className="reference-photo-preview">
        {src ? (
          <Image
            unoptimized
            width={115}
            height={115}
            src={src}
            alt="Employee attendance reference photo"
          />
        ) : (
          <Camera size={31} />
        )}
      </div>
      <div className="reference-photo-content">
        <h3>Attendance reference photo{!employee._id ? " *" : ""}</h3>
        <p>
          Upload a clear, front-facing photo with exactly one face. It is stored
          privately and used by the server to match camera check-ins and
          check-outs. Camera frames are processed and discarded.
        </p>
        <small>
          {employee.faceEnrolledAt
            ? "Face verification is enrolled."
            : editable
              ? "A reference photo is required before this employee can mark attendance."
              : "Ask HR to enroll your reference photo before marking attendance."}
        </small>
        {editable && (
          <div className="button-row">
            <label className="button photo-file-button">
              <Upload size={15} />
              {src ? "Choose another photo" : "Upload photo"}
              <input
                aria-label="Attendance reference photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => choose(e.target.files?.[0])}
              />
            </label>
            {employee._id && draft && (
              <button
                type="button"
                className="button primary"
                disabled={busy}
                onClick={save}
              >
                <ShieldCheck size={15} />
                {busy ? "Scanning face…" : "Save reference photo"}
              </button>
            )}
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}

"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import { X, LoaderCircle, Inbox, ArrowRight, Check } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Row, errorMessage } from "@/lib/api";
export const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(args));
export function Empty({
  title = "Nothing here just yet",
  body = "Once your team starts adding records, you’ll find them here.",
  action,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={27} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const name = String(children || "").replaceAll("_", " ");
  return (
    <span
      className={cn(
        "badge",
        /active|approved|present|finalized/.test(name)
          ? "green"
          : /pending|late|probation|draft|missing/.test(name)
            ? "amber"
            : /absent|rejected|exited/.test(name)
              ? "red"
              : "gray",
      )}
    >
      {name}
    </span>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>Bringing everything together…</span>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={close}
            className="icon-button"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  min?: string | number;
  max?: string | number;
  step?: string;
  placeholder?: string;
};
export function FieldsForm({
  fields,
  initial = {},
  submit,
  label = "Save changes",
  onDone,
}: {
  fields: Field[];
  initial?: Row;
  submit: (data: Row) => Promise<unknown>;
  label?: string;
  onDone?: () => void;
}) {
  const [values, setValues] = useState<Row>(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ok, setOk] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submit(values);
      setOk(true);
      onDone?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="fields-form">
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.key} className={f.type === "textarea" ? "full" : ""}>
            <span>
              {f.label}
              {f.required && <b> *</b>}
            </span>
            {f.options ? (
              <select
                required={f.required}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              >
                <option value="">Select {f.label.toLowerCase()}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                required={f.required}
                value={values[f.key] ?? ""}
                maxLength={10000}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            ) : (
              <input
                type={f.type || "text"}
                required={f.required}
                min={f.min}
                max={f.max}
                step={f.step}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => {
                  setOk(false);
                  setValues({
                    ...values,
                    [f.key]:
                      f.type === "number"
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value,
                  });
                }}
              />
            )}
            {f.help && <small>{f.help}</small>}
          </label>
        ))}
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="form-footer">
        {ok && (
          <span className="success">
            <Check size={16} /> Saved successfully
          </span>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? <LoaderCircle size={17} className="spin" /> : null}
          {label}
          {!busy && <ArrowRight size={16} />}
        </button>
      </div>
    </form>
  );
}
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

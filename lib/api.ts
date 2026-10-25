import axios from "axios";
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
});
// API objects include polymorphic populated Mongoose references.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export const errorMessage = (e: unknown) =>
  axios.isAxiosError(e)
    ? e.response?.data?.message ||
      "Could not reach the server. Please try again."
    : e instanceof Error
      ? e.message
      : typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof e.message === "string"
        ? e.message
        : typeof e === "string" && e.trim()
          ? e
          : "Something went wrong.";
export const cash = (v: number = 0) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(v);
export const dateLabel = (v: string) =>
  v
    ? new Date(v.length === 10 ? v + "T12:00:00" : v).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : "—";

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock3,
  CalendarDays,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api, Row, errorMessage, dateLabel } from "@/lib/api";
import { Empty, Loading, Table } from "./ui";

export default function AttendancePerformance({
  personal = false,
  compact = false,
  department = "",
  revision = 0,
}: {
  personal?: boolean;
  compact?: boolean;
  department?: string;
  revision?: number;
}) {
  const [month, setMonth] = useState(() =>
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
        .slice(0, 7),
    ),
    [data, setData] = useState<Row | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    let live = true;
    setBusy(true);
    setError("");
    api
      .get("/analytics/performance", { params: { month, department } })
      .then((r) => {
        if (live) setData(r.data);
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [month, department, revision]);
  const d = data?.daily || {},
    summary = data?.summary || {},
    items = data?.items || [];
  const stats = [
    {
      label: personal ? "Present today" : "Employees present today",
      value: d.present ?? 0,
      icon: Users,
    },
    {
      label: personal ? "Absent today" : "Employees absent today",
      value: d.absent ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Monthly attendance",
      value: `${summary.attendanceRate ?? 0}%`,
      icon: Clock3,
    },
    {
      label: "Monthly tracked hours",
      value: `${summary.hours ?? 0} h`,
      icon: Clock3,
    },
  ];
  return (
    <section className="card performance-panel spaced">
      <div className="panel-heading">
        <div>
          <h2>
            {personal
              ? "My monthly attendance performance"
              : "Monthly attendance performance"}
          </h2>
          <p>
            Attendance and punctuality from recorded activity. This does not
            measure work quality.
          </p>
        </div>
        <input
          className="performance-month"
          aria-label="Performance month"
          type="month"
          required
          value={month}
          onChange={(e) => {
            if (e.target.value) {
              setMonth(e.target.value);
              setPage(1);
            }
          }}
        />
      </div>
      {error ? (
        <div className="error">{error}</div>
      ) : busy ? (
        <Loading />
      ) : (
        <>
          <div className="performance-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <s.icon size={17} />
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
          <p className="performance-note">
            Today: {dateLabel(d.date)}
            {d.workingDay === false ? " · Non-working day" : ""} ·{" "}
            {d.onLeave ?? 0} on leave · {d.late ?? 0} late. Month:{" "}
            {summary.presentDays ?? 0} present days, {summary.absentDays ?? 0}{" "}
            absent days, {summary.leaveDays ?? 0} leave days ·{" "}
            {summary.punctualityRate ?? 0}% punctuality.
          </p>
          {compact ? (
            <Link className="card-bottom-link" href="/">
              Open full attendance performance
              <ArrowUpRight size={15} />
            </Link>
          ) : items.length ? (
            <>
              <Table
                headers={[
                  "Employee",
                  "Present days",
                  "Absent days",
                  "Leave days",
                  "Half days",
                  "Late days",
                  "Hours",
                  "Attendance",
                  "Punctuality",
                ]}
              >
                {items.slice((page - 1) * 10, page * 10).map((r: Row) => (
                  <tr key={r.employee_id}>
                    <td>
                      <strong>{r.name}</strong>
                      <small className="block">{r.code}</small>
                    </td>
                    <td>{r.presentDays}</td>
                    <td>{r.absentDays}</td>
                    <td>{r.leaveDays}</td>
                    <td>{r.halfDays}</td>
                    <td>{r.lateDays}</td>
                    <td>{r.hours}</td>
                    <td>{r.attendanceRate}%</td>
                    <td>{r.punctualityRate}%</td>
                  </tr>
                ))}
              </Table>
              {items.length > 10 && (
                <div className="pagination">
                  <span>
                    Page {page} of {Math.ceil(items.length / 10)}
                  </span>
                  <div>
                    <button
                      className="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft size={15} />
                      Previous
                    </button>
                    <button
                      className="button"
                      disabled={page * 10 >= items.length}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Empty
              title="No employee records for this month"
              body="Performance appears from actual attendance after employees are registered."
            />
          )}
        </>
      )}
    </section>
  );
}

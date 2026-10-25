"use client";
import { Row, dateLabel } from "@/lib/api";
export default function AttendanceCalendar({
  records,
  month,
  weekends = [0, 6],
}: {
  records: Row[];
  month: string;
  weekends?: number[];
}) {
  const [year, mon] = month.slice(0, 7).split("-").map(Number);
  if (!year || !mon) return null;
  const first = new Date(year, mon - 1, 1),
    length = new Date(year, mon, 0).getDate(),
    offset = (first.getDay() + 6) % 7;
  const map = new Map(records.map((r) => [r.date, r]));
  return (
    <section className="card attendance-calendar spaced">
      <div className="panel-heading">
        <div>
          <h2>
            {first.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <p>Your working month, one day at a time.</p>
        </div>
      </div>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <strong className="calendar-day" key={d}>
            {d}
          </strong>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={"pad" + i} className="calendar-cell blank" />
        ))}
        {Array.from({ length }, (_, i) => {
          const date = `${year}-${String(mon).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
            r = map.get(date),
            status = r?.displayStatus || r?.status,
            off = weekends.includes(new Date(year, mon - 1, i + 1).getDay());
          return (
            <div
              key={date}
              className={"calendar-cell " + (status || "")}
              title={
                dateLabel(date) +
                (r?.leaveType
                  ? " · " +
                    (r.leaveFraction === 0.5 ? "Half-day " : "") +
                    r.leaveType +
                    " leave"
                  : "") +
                (status
                  ? " · " + status.replaceAll("_", " ")
                  : off
                    ? " · Non-working day"
                    : "")
              }
            >
              <span>{i + 1}</span>
              <i />
              <small>
                {r?.leaveType
                  ? `${r.leaveFraction === 0.5 ? "Half-day " : ""}${r.leaveType}`
                  : status
                    ? status.replaceAll("_", " ")
                    : off
                      ? "Off"
                      : "—"}
              </small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

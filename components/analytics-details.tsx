"use client";
import { Row, cash } from "@/lib/api";
import { Table, Empty } from "./ui";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
export default function AnalyticsDetails({
  data: d,
  admin,
}: {
  data: Row;
  admin: boolean;
}) {
  return (
    <>
      <div className="dashboard-grid equal">
        <section className="card">
          <div className="panel-heading">
            <div>
              <h2>
                {admin ? "Payroll by department" : "Absenteeism by department"}
              </h2>
              <p>
                {admin
                  ? "Gross payroll in the selected period."
                  : "Absent days as a share of expected working days."}
              </p>
            </div>
          </div>
          {d.departments?.some((r: Row) => (admin ? r.payroll : r.absent)) ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.departments} margin={{ left: 5, right: 20 }}>
                  <CartesianGrid vertical={false} stroke="#eef0ed" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      admin ? cash(value) : `${value}%`
                    }
                  />
                  <Bar
                    dataKey={admin ? "payroll" : "absenteeism"}
                    fill={admin ? "#759880" : "#c6ab78"}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty
              title={
                admin
                  ? "Your payroll picture will grow"
                  : "No absence signals yet"
              }
              body="This chart uses only records from the selected dates and departments."
            />
          )}
        </section>
        <section className="card">
          <div className="panel-heading">
            <div>
              <h2>Salary structure at a glance</h2>
              <p>Average monthly gross by designation.</p>
            </div>
          </div>
          {d.designations?.some((r: Row) => r.headcount) ? (
            <Table headers={["Designation", "People", "Average gross"]}>
              {d.designations
                .filter((r: Row) => r.headcount)
                .map((r: Row) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{r.headcount}</td>
                    <td>{cash(r.averageSalary)}</td>
                  </tr>
                ))}
            </Table>
          ) : (
            <Empty
              title="A fairer view of the bigger picture"
              body="Designation averages appear once employees are registered."
            />
          )}
        </section>
      </div>
      {admin && (
        <div className="dashboard-grid equal">
          <section className="card">
            <div className="panel-heading">
              <div>
                <h2>Team diversity</h2>
                <p>Self-reported gender across the selected team.</p>
              </div>
            </div>
            {d.headcount ? (
              <Table headers={["Gender", "People"]}>
                {d.gender?.map((r: Row) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                title="Every person brings a perspective"
                body="Team data appears after your first registration."
              />
            )}
          </section>
          <section className="card">
            <div className="panel-heading">
              <div>
                <h2>Time together</h2>
                <p>Team tenure at the end of the selected period.</p>
              </div>
            </div>
            {d.tenure?.length ? (
              <Table headers={["Tenure", "People"]}>
                {[
                  { name: "Less than 1 year", min: 0, max: 12 },
                  { name: "1–3 years", min: 12, max: 36 },
                  { name: "3+ years", min: 36, max: Infinity },
                ].map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td>
                      {
                        d.tenure.filter(
                          (r: Row) => r.months >= t.min && r.months < t.max,
                        ).length
                      }
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                title="The beginning of something good"
                body="Tenure insights grow alongside your team."
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}

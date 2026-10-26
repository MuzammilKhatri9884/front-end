"use client";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock3,
  CalendarDays,
  Wallet,
  Building2,
  ShieldCheck,
  ScrollText,
  Megaphone,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Check,
  LockKeyhole,
  RefreshCw,
  Send,
  UserRound,
  Settings2,
  CheckCheck,
  AlertCircle,
  Camera,
  Sun,
  Moon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { api, Row, errorMessage, cash, dateLabel } from "@/lib/api";
import {
  Badge,
  Empty,
  Loading,
  Modal,
  FieldsForm,
  Table,
  Field,
  cn,
} from "./ui";
import CameraCheckin from "./camera";
import EmployeePhoto from "./employee-photo";
import AnalyticsDetails from "./analytics-details";
import AttendanceCalendar from "./attendance-calendar";
import AttendancePerformance from "./attendance-performance";
const routes = [
  {
    key: "dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["Admin", "HR", "Employee"],
  },
  {
    key: "employees",
    label: "People",
    icon: Users,
    roles: ["Admin", "HR", "Employee"],
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: Clock3,
    roles: ["Admin", "HR", "Employee"],
  },
  {
    key: "leave",
    label: "Time off",
    icon: CalendarDays,
    roles: ["Admin", "HR", "Employee"],
  },
  {
    key: "payroll",
    label: "Payroll",
    icon: Wallet,
    roles: ["Admin", "HR", "Employee"],
  },
  {
    key: "announcements",
    label: "Announcements",
    icon: Megaphone,
    roles: ["Admin", "HR", "Employee"],
  },
  {
    key: "organization",
    label: "Organization",
    icon: Building2,
    roles: ["Admin", "HR"],
  },
  {
    key: "users",
    label: "Access & accounts",
    icon: ShieldCheck,
    roles: ["Admin"],
  },
  { key: "audit", label: "Audit trail", icon: ScrollText, roles: ["Admin"] },
  {
    key: "assistant",
    label: "AI assistant",
    icon: Sparkles,
    roles: ["Admin", "HR", "Employee"],
  },
];
const descriptions: Record<string, string> = {
  dashboard: "A little clarity. A lot more possibility.",
  employees: "The people who make it all happen.",
  attendance: "Every day, accounted for.",
  leave: "Make room for life outside work.",
  payroll: "Good work deserves a smooth payday.",
  announcements: "Keep everyone in the loop.",
  organization: "A strong foundation for your people.",
  users: "The right access for every person.",
  audit: "A clear record of every important change.",
  assistant: "Your people questions, thoughtfully answered.",
};
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
const initialFilters = () => ({
  start: today().slice(0, 7) + "-01",
  end: today(),
  department: "",
});
export default function Workspace({ boot }: { boot: Row }) {
  const [user, setUser] = useState<Row | null>(boot.user || null),
    [setup, setSetup] = useState(!!boot.setup),
    [mobile, setMobile] = useState(false),
    [company, setCompany] = useState<Row>(boot.company || {}),
    [notes, setNotes] = useState<Row[]>([]),
    [showNotes, setShowNotes] = useState(false),
    [profile, setProfile] = useState(false),
    [revision, setRevision] = useState(0),
    [toast, setToast] = useState(""),
    [theme, setTheme] = useState<"light" | "dark">("light"),
    [now, setNow] = useState<Date | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const page = pathname.split("/")[1] || "dashboard";
  useEffect(() => {
    const saved = localStorage.getItem("hcm-lite-theme");
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);
  const toggleTheme = () => setTheme((current) => {
    const next = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("hcm-lite-theme", next);
    return next;
  });
  useEffect(() => {
    if (user && ["login", "signup"].includes(page)) router.replace("/");
  }, [user, page, router]);
  useEffect(() => {
    setNow(new Date());
  }, []);
  const refresh = () => setRevision((v) => v + 1);
  const message = useCallback((v: string) => {
    setToast(v);
    setTimeout(() => setToast(""), 6500);
  }, []);
  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    if (!Object.keys(company).length) {
      api
        .get("/policy")
        .then((r) => setCompany(r.data))
        .catch(() => {});
    }
    api
      .get("/notifications")
      .then((r) => setNotes(r.data))
      .catch(() => {});
  // Settings and notifications are session data; page refreshes should not reload them.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const signed = (u: Row, successMessage = "Successfully logged in.") => {
    setSetup(false);
    setUser(u);
    message(successMessage);
    router.replace("/");
  };
  if (boot.offline && !user)
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Brand />
          <span className="eyebrow">LET’S GET CONNECTED</span>
          <h1>Your workspace is almost ready.</h1>
          <p>
            The backend is not reachable. Start the API and connect MongoDB,
            then reload this page.
          </p>
          <code>
            cd backend
            <br />
            npm run dev
          </code>
          <button className="button primary" onClick={() => location.reload()}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  if (!user)
    return (
      <AuthScreen
        setup={setup}
        signed={signed}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  if (["login", "signup"].includes(page)) return <Loading />;
  if (user.mustChangePassword)
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Brand />
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>
            A fresh password.
            <br />A fresh start.
          </h1>
          <p>
            Before you get started, replace your temporary password with one
            only you know.
          </p>
          <FieldsForm
            fields={[
              {
                key: "currentPassword",
                label: "Temporary password",
                type: "password",
                required: true,
              },
              {
                key: "password",
                label: "New password",
                type: "password",
                required: true,
                help: "At least 10 characters.",
              },
            ]}
            label="Set my password"
            submit={async (d) => {
              const r = await api.post("/auth/password", d);
              setUser(r.data.user);
            }}
          />
        </div>
      </div>
    );
  const allowed = routes.filter((r) => r.roles.includes(user.role)),
    active = allowed.find((r) => r.key === page);
  const unread = notes.filter((n) => !n.read).length;
  return (
    <div className="workspace">
      {mobile && (
        <div className="sidebar-shade" onClick={() => setMobile(false)} />
      )}
      <aside className={cn("sidebar", mobile && "open")}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-only icon-button"
            onClick={() => setMobile(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="company-switch">
          <span className="company-avatar">
            {(company.companyName || "Y").slice(0, 1)}
          </span>
          <div>
            <strong>{company.companyName || "Your workspace"}</strong>
            <small>Company workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav>
          {allowed.slice(0, 6).map((r) => (
            <Link
              key={r.key}
              href={r.key === "dashboard" ? "/" : "/" + r.key}
              onClick={() => setMobile(false)}
              className={cn("nav-item", page === r.key && "active")}
            >
              <r.icon size={18} />
              {r.key === "dashboard" ? `${user.role} dashboard` : r.label}
              {r.key === "leave" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <span className="nav-caption">MANAGE & EXPLORE</span>
        <nav>
          {allowed.slice(6).map((r) => (
            <Link
              key={r.key}
              href={"/" + r.key}
              onClick={() => setMobile(false)}
              className={cn("nav-item", page === r.key && "active")}
            >
              <r.icon size={18} />
              {r.label}
              {r.key === "assistant" && <span className="mini-tag">AI</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>
              <Leaf size={18} />
            </span>
            <strong>A little more human.</strong>
            <p>Less admin. More time for the people behind the work.</p>
          </div>
          <button className="user-switch" onClick={() => setProfile(true)}>
            <span className="avatar">{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role} account</small>
              <small title={user.email}>{user.email}</small>
            </div>
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-only icon-button"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>
              {page === "dashboard"
                ? `${user.role} dashboard`
                : active?.label || "Page not found"}
            </strong>
          </div>
          <div className="top-actions">
            <button className="icon-button outlined theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <span className="today-date">
              <Sun size={15} />
              {now?.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) || "Your workspace"}
            </span>
            <button
              aria-label="Notifications"
              className="icon-button bell"
              onClick={() => setShowNotes(!showNotes)}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>
            <button
              className="avatar small"
              aria-label="Open profile"
              onClick={() => setProfile(true)}
            >
              {user.name.slice(0, 1)}
            </button>
          </div>
          {showNotes && (
            <div className="notification-panel">
              <div className="panel-heading">
                <h3>Notifications</h3>
                <button
                  className="text-button"
                  onClick={async () => {
                    await api.patch("/notifications/read");
                    refresh();
                  }}
                >
                  <CheckCheck size={16} />
                  Read all
                </button>
              </div>
              {notes.length ? (
                notes.map((n) => (
                  <div
                    className={cn("notification", !n.read && "unread")}
                    key={n._id}
                  >
                    <p>{n.message}</p>
                    <small>{dateLabel(n.createdAt)}</small>
                  </div>
                ))
              ) : (
                <Empty
                  title="You’re all caught up"
                  body="Updates on leave and payslips will appear here."
                />
              )}
            </div>
          )}
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {company.companyName || "Your organization"} · {user.role} panel
              </span>
              <h1>
                {page === "dashboard"
                  ? `${user.role} Dashboard`
                  : active?.label || "Page not found"}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {descriptions[page] ||
                  "This page is not part of your workspace."}
              </p>
              <div
                className="signed-in-identity"
                aria-label="Signed-in account"
              >
                <span className="badge green">{user.role}</span>
                <span>{user.name}</span>
                <span className="identity-email">{user.email}</span>
                <span className="identity-company">
                  <Building2 size={13} />
                  {company.companyName || "Your organization"}
                </span>
              </div>
            </div>
            {page === "dashboard" && (
              <Link
                className="button primary"
                href={
                  user.role === "HR"
                    ? "/employees"
                    : user.role === "Admin"
                      ? "/organization"
                      : "/attendance"
                }
              >
                {user.role === "HR" ? (
                  <Plus size={17} />
                ) : (
                  <ArrowUpRight size={17} />
                )}{" "}
                {user.role === "HR"
                  ? "Add employee"
                  : user.role === "Admin"
                    ? "Company settings"
                    : "My attendance"}
              </Link>
            )}
          </div>
          {!active ? (
            <Empty
              title="Page unavailable"
              body="Choose a page from your workspace menu."
            />
          ) : page === "dashboard" ? (
            <Dashboard user={user} revision={revision} message={message} />
          ) : page === "employees" ? (
            <People
              user={user}
              revision={revision}
              refresh={refresh}
              message={message}
            />
          ) : page === "attendance" ? (
            <AttendancePage
              user={user}
              revision={revision}
              refresh={refresh}
              message={message}
            />
          ) : page === "leave" ? (
            <LeavePage
              user={user}
              revision={revision}
              refresh={refresh}
              message={message}
            />
          ) : page === "payroll" ? (
            <PayrollPage
              user={user}
              revision={revision}
              refresh={refresh}
              message={message}
            />
          ) : page === "organization" ? (
            <Organization
              user={user}
              revision={revision}
              refresh={refresh}
              message={message}
            />
          ) : page === "users" ? (
            <Accounts revision={revision} refresh={refresh} message={message} />
          ) : page === "announcements" ? (
            <Announcements
              user={user}
              revision={revision}
              refresh={refresh}
              message={message}
            />
          ) : page === "audit" ? (
            <AuditPage revision={revision} />
          ) : (
            <Assistant user={user} />
          )}
          <footer className="page-footer">
            <span>
              HCM Lite <span>·</span> A little more human.
            </span>
            <span className="live-dot">All your people, in one place</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div role="status" className="toast">
          <Check size={18} />
          {toast}
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {profile && (
        <Modal title="Your account" close={() => setProfile(false)}>
          <div className="profile-summary">
            <span className="avatar large">{user.name.slice(0, 1)}</span>
            <div>
              <h3>{user.name}</h3>
              <p>
                {user.email} · {user.role}
              </p>
            </div>
          </div>
          <FieldsForm
            fields={[
              {
                key: "currentPassword",
                label: "Current password",
                type: "password",
                required: true,
              },
              {
                key: "password",
                label: "New password",
                type: "password",
                required: true,
              },
            ]}
            label="Change password"
            submit={async (d) => {
              const r = await api.post("/auth/password", d);
              setUser(r.data.user);
              message("Password changed.");
            }}
          />
          <button
            className="button danger logout"
            onClick={async () => {
              await api.post("/auth/logout");
              setUser(null);
              location.href = "/";
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </Modal>
      )}
    </div>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Leaf size={22} />
      </span>
      <span>
        hcm<span className="brand-lite">lite</span>
        <i />
      </span>
    </div>
  );
}
function Organization({ user, revision, refresh, message }: PageProps) {
  const { data, error, busy } = useData("/organization", revision),
    [modal, setModal] = useState<Row | null>(null);
  const d = data as Row,
    admin = user.role === "Admin";
  const catalogs = [
    {
      key: "departments",
      label: "Departments",
      icon: Building2,
      body: "Give every team a place to belong.",
    },
    {
      key: "designations",
      label: "Designations",
      icon: UserRound,
      body: "The roles that move your company forward.",
    },
    {
      key: "leaveTypes",
      path: "leave-types",
      label: "Leave types",
      icon: CalendarDays,
      body: "Set yearly quotas. Leave room for life.",
    },
    {
      key: "holidays",
      label: "Public holidays",
      icon: Sun,
      body: "The days your whole team takes a break.",
    },
  ];
  const fields = (key: string): Field[] => [
    { key: "name", label: "Name", required: true },
    ...(key === "departments"
      ? [{ key: "description", label: "Description", type: "textarea" }]
      : []),
    ...(key === "holidays"
      ? [{ key: "date", label: "Holiday date", type: "date", required: true }]
      : []),
    ...(key === "leaveTypes"
      ? [
          {
            key: "quota",
            label: "Annual quota (days)",
            type: "number",
            min: 0,
            required: true,
          },
          {
            key: "unpaid",
            label: "Paid or unpaid",
            required: true,
            options: [
              { value: "false", label: "Paid leave" },
              { value: "true", label: "Unpaid (unlimited)" },
            ],
          },
        ]
      : []),
  ];
  return (
    <DataState busy={busy} error={error}>
      {d && (
        <>
          <section className="card settings-card">
            <div className="panel-heading">
              <div>
                <h2>Company & working rules</h2>
                <p>
                  Changes apply to new records. Past records retain their
                  original rules.
                </p>
              </div>
              <Settings2 size={20} />
            </div>
            {admin ? (
              <FieldsForm
                initial={{
                  ...d.company,
                  weekendText: d.company.weekends.join(","),
                }}
                fields={[
                  { key: "companyName", label: "Company name", required: true },
                  {
                    key: "timezone",
                    label: "Company timezone",
                    required: true,
                    help: "IANA timezone, e.g. Asia/Karachi.",
                  },
                  {
                    key: "officeStart",
                    label: "Office start time",
                    type: "time",
                    required: true,
                  },
                  {
                    key: "graceMinutes",
                    label: "Grace period (minutes)",
                    type: "number",
                    min: 0,
                    max: 240,
                    required: true,
                  },
                  {
                    key: "halfDayHours",
                    label: "Half-day threshold (hours)",
                    type: "number",
                    min: 1,
                    max: 12,
                    step: ".5",
                    required: true,
                  },
                  {
                    key: "radius",
                    label: "Office radius (metres)",
                    type: "number",
                    min: 1,
                    max: 10000,
                    required: true,
                  },
                  {
                    key: "latitude",
                    label: "Office latitude",
                    type: "number",
                    min: -90,
                    max: 90,
                    step: "any",
                  },
                  {
                    key: "longitude",
                    label: "Office longitude",
                    type: "number",
                    min: -180,
                    max: 180,
                    step: "any",
                  },
                  {
                    key: "weekendText",
                    label: "Weekend days",
                    placeholder: "0,6",
                    help: "0 = Sunday … 6 = Saturday. Separate with commas.",
                  },
                ]}
                submit={async (v) => {
                  const payload = { ...v };
                  delete payload._id;
                  delete payload.createdAt;
                  delete payload.updatedAt;
                  delete payload.__v;
                  if (v.weekendText !== undefined)
                    payload.weekends = String(v.weekendText)
                      .split(",")
                      .map(Number);
                  delete payload.weekendText;
                  await api.patch("/settings", payload);
                  refresh();
                  message("Company settings updated for new records.");
                }}
              />
            ) : (
              <div className="detail-grid">
                {[
                  "companyName",
                  "officeStart",
                  "graceMinutes",
                  "halfDayHours",
                  "timezone",
                  "radius",
                ].map((k) => (
                  <div key={k}>
                    <small>{k}</small>
                    <strong>{d.company[k]}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="catalog-grid">
            {catalogs.map((c) => (
              <section className="card" key={c.key}>
                <div className="panel-heading">
                  <div>
                    <h2>
                      <c.icon size={18} />
                      {c.label}
                    </h2>
                    <p>{c.body}</p>
                  </div>
                  {admin && (
                    <button
                      aria-label={"Add " + c.label}
                      className="icon-button outlined"
                      onClick={() =>
                        setModal({
                          key: c.key,
                          path: c.path || c.key,
                          label: c.label,
                          quota: c.key === "leaveTypes" ? 14 : undefined,
                          unpaid: "false",
                        })
                      }
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
                {d[c.key]?.length ? (
                  <div className="catalog-list">
                    {d[c.key].map((r: Row) => (
                      <div key={r._id}>
                        <div>
                          <strong>{r.name}</strong>
                          <small>
                            {c.key === "holidays"
                              ? dateLabel(r.date)
                              : c.key === "leaveTypes"
                                ? r.unpaid
                                  ? "Unpaid · unlimited"
                                  : `${r.quota} days per year`
                                : r.description || "ID: " + r._id}
                          </small>
                        </div>
                        {admin && (
                          <button
                            className="text-button"
                            onClick={() =>
                              setModal({
                                ...r,
                                key: c.key,
                                path: c.path || c.key,
                                label: c.label,
                                unpaid: String(r.unpaid || false),
                              })
                            }
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title={"No " + c.label.toLowerCase() + " yet"}
                    body={
                      admin
                        ? "Use the + button to add your first record."
                        : "Admin can create these in company setup."
                    }
                  />
                )}
              </section>
            ))}
          </div>
          <div className="info-strip">
            <Leaf size={20} />
            <p>
              Suggested leave types: Annual (14 days), Sick (8), Casual (10),
              and Unpaid (unlimited). Create the types you need — your workspace
              never adds sample data.
            </p>
          </div>
        </>
      )}
      {modal && (
        <Modal
          title={(modal._id ? "Edit " : "Add ") + modal.label.toLowerCase()}
          close={() => setModal(null)}
        >
          <FieldsForm
            initial={modal}
            fields={fields(modal.key)}
            submit={async (v) => {
              const payload = Object.fromEntries(
                fields(modal.key).map((f) => [f.key, v[f.key]]),
              );
              if (modal.key === "leaveTypes")
                payload.unpaid = v.unpaid === "true";
              if (modal._id)
                await api.patch(
                  "/organization/" + modal.path + "/" + modal._id,
                  payload,
                );
              else await api.post("/organization/" + modal.path, payload);
              setModal(null);
              refresh();
              message("Organization updated.");
            }}
          />
        </Modal>
      )}
    </DataState>
  );
}
function Accounts({ revision, refresh, message }: Omit<PageProps, "user">) {
  const { data, error, busy } = useData("/users", revision),
    [add, setAdd] = useState(false),
    [credential, setCredential] = useState<Row | null>(null);
  const users = (data || []) as Row[];
  async function update(u: Row, reset: boolean) {
    try {
      const r = await api.patch(
        "/users/" + u._id,
        reset ? { reset: true } : { active: !u.active },
      );
      if (reset)
        setCredential({ email: u.email, password: r.data.temporaryPassword });
      refresh();
      message(
        reset ? "Temporary password generated." : "Account access updated.",
      );
    } catch (e) {
      message(errorMessage(e));
    }
  }
  return (
    <>
      <div className="section-toolbar">
        <div>
          <h2>People with access</h2>
          <p className="muted">
            Create HR logins here. HR creates employee logins through the
            directory.
          </p>
        </div>
        <button className="button primary" onClick={() => setAdd(true)}>
          <Plus size={16} />
          Add HR account
        </button>
      </div>
      <section className="card">
        <DataState busy={busy} error={error}>
          {users.length ? (
            <Table
              headers={["Account", "Role", "Status", "Password", "Actions"]}
            >
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small className="block">{u.email}</small>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <Badge>{u.active ? "active" : "inactive"}</Badge>
                  </td>
                  <td>
                    {u.mustChangePassword ? "Change required" : "Set by user"}
                  </td>
                  <td>
                    {u.role !== "Admin" && (
                      <div className="button-row">
                        <button
                          className="text-button"
                          onClick={() => update(u, false)}
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="text-button"
                          onClick={() => update(u, true)}
                        >
                          Reset password
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
        </DataState>
      </section>
      {add && (
        <Modal title="Welcome an HR teammate" close={() => setAdd(false)}>
          <FieldsForm
            fields={[
              { key: "name", label: "Full name", required: true },
              {
                key: "email",
                label: "Work email",
                type: "email",
                required: true,
              },
            ]}
            label="Create HR account"
            submit={async (v) => {
              const r = await api.post("/users", v);
              setCredential({
                email: r.data.user.email,
                password: r.data.temporaryPassword,
              });
              setAdd(false);
              refresh();
            }}
          />
        </Modal>
      )}
      {credential && (
        <Modal
          title="Save their sign-in details"
          close={() => setCredential(null)}
        >
          <p>
            Share securely. They must change this password at first sign-in.
          </p>
          <div className="credential-box">
            <strong>{credential.email}</strong>
            <code>{credential.password}</code>
          </div>
          <button
            className="button primary"
            onClick={() => setCredential(null)}
          >
            Saved
            <Check size={16} />
          </button>
        </Modal>
      )}
    </>
  );
}
function Announcements({ user, revision, refresh, message }: PageProps) {
  const { data, error, busy } = useData("/announcements", revision),
    [add, setAdd] = useState(false);
  const posts = (data || []) as Row[];
  return (
    <>
      <div className="section-toolbar">
        <h2>The company noticeboard</h2>
        {user.role !== "Employee" && (
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={16} />
            Post announcement
          </button>
        )}
      </div>
      <DataState busy={busy} error={error}>
        {posts.length ? (
          <div className="posts-grid">
            {posts.map((p) => (
              <article className="card post-card" key={p._id}>
                <span className="post-category">
                  <Megaphone size={14} />
                  COMPANY UPDATE
                </span>
                <h2>{p.title}</h2>
                <p>{p.body}</p>
                <div className="post-footer">
                  <span className="avatar small">
                    {p.author?.name?.slice(0, 1) || "H"}
                  </span>
                  <div>
                    <strong>{p.author?.name || "Your team"}</strong>
                    <small>{dateLabel(p.createdAt)}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="card">
            <Empty
              title="Good things are worth sharing"
              body="Company updates and announcements will appear here."
            />
          </section>
        )}
      </DataState>
      {add && (
        <Modal
          title="Share something with your team"
          close={() => setAdd(false)}
        >
          <FieldsForm
            fields={[
              { key: "title", label: "Announcement title", required: true },
              {
                key: "body",
                label: "Your message",
                type: "textarea",
                required: true,
              },
            ]}
            label="Publish announcement"
            submit={async (d) => {
              await api.post("/announcements", d);
              setAdd(false);
              refresh();
              message("Your announcement is live.");
            }}
          />
        </Modal>
      )}
    </>
  );
}
function AuditPage({ revision }: { revision: number }) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState<Row | null>(null),
    { data, error, busy } = useData(
      "/audit?page=" + page + "&limit=20",
      revision,
    );
  const d = data as Row;
  return (
    <section className="card">
      <div className="panel-heading">
        <div>
          <h2>A workspace you can trust</h2>
          <p>
            Append-only records of changes, approvals and important actions.
          </p>
        </div>
        <ShieldCheck size={20} />
      </div>
      <DataState busy={busy} error={error}>
        {d?.items?.length ? (
          <>
            <Table headers={["When", "Actor", "Action", "Entity", ""]}>
              {d.items.map((a: Row) => (
                <tr key={a._id}>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>{a.actorName}</td>
                  <td>
                    <Badge>{a.action}</Badge>
                  </td>
                  <td>{a.entity}</td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => setSelected(a)}
                    >
                      Before & after
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            <div className="pagination">
              <span>
                {d.total} records · Page {page}
              </span>
              <div>
                <button
                  className="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="button"
                  disabled={page * 20 >= d.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <Empty />
        )}
      </DataState>
      {selected && (
        <Modal title="Change details" close={() => setSelected(null)}>
          <h3>Before</h3>
          <pre>{JSON.stringify(selected.before || null, null, 2)}</pre>
          <h3>After</h3>
          <pre>{JSON.stringify(selected.after || null, null, 2)}</pre>
        </Modal>
      )}
    </section>
  );
}
function Assistant({ user }: { user: Row }) {
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<Row[]>([]),
    [busy, setBusy] = useState(false);
  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const r = await api.post("/ai/chat", { message: question });
      setMessages((m) => [...m, { role: "assistant", text: r.data.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "error", text: errorMessage(e) }]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AttendancePerformance personal={user.role === "Employee"} compact />
      <section className="assistant-layout">
        <div className="assistant-conversation">
          <div className="assistant-top">
            <span className="ai-orb">
              <Sparkles size={23} />
            </span>
            <div>
              <h2>A little help, a clearer day.</h2>
              <p>Answers grounded in your workspace data.</p>
            </div>
            <span className="badge green">AI assistant</span>
          </div>
          <div className="messages" aria-live="polite">
            {messages.length ? (
              messages.map((m, i) => (
                <article key={i} className={"chat-message " + m.role}>
                  <small>
                    {m.role === "user"
                      ? "You"
                      : m.role === "error"
                        ? "Assistant unavailable"
                        : "HCM Lite · AI-generated"}
                  </small>
                  <p>{m.text}</p>
                </article>
              ))
            ) : (
              <div className="chat-welcome">
                <span className="welcome-spark">
                  <Sparkles size={35} />
                </span>
                <h2>What’s on your mind?</h2>
                <p>
                  Your team, time off, attendance or payroll.
                  <br />
                  Start with a question.
                </p>
                <div className="suggestion-grid">
                  {[
                    "What is our attendance rate this month?",
                    user.role === "Employee"
                      ? "Show my monthly attendance performance."
                      : "How many employees are present and absent today?",
                    "Show monthly attendance performance.",
                    "How many sick leaves do I have left?",
                    "Who is on leave today?",
                    "How is my payroll calculated?",
                  ].map((q) => (
                    <button key={q} onClick={() => ask(q)}>
                      {q}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {busy && (
              <div className="chat-thinking">
                <Sparkles size={16} className="spin" />
                Looking into your workspace…
              </div>
            )}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              aria-label="Message your assistant"
              maxLength={2000}
              placeholder="Ask a question about your workspace…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="button primary"
              aria-label="Send message"
              disabled={busy || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
          <p className="chat-disclaimer">
            AI-generated answers. Always review important details. Your role’s
            access applies to every answer.
          </p>
        </div>
        <aside className="assistant-aside">
          <span className="eyebrow">THOUGHTFULLY CONNECTED</span>
          <h2>
            Real data.
            <br />
            Relevant answers.
          </h2>
          <p>
            Your assistant reads the same scoped services as your dashboard. It
            can explain and suggest; it never saves changes for you.
          </p>
          {[
            {
              icon: ShieldCheck,
              title: "Your access, respected",
              body: "Employees only see their own records.",
            },
            {
              icon: ScrollText,
              title: "Grounded in policy",
              body: "Clear answers from company rules.",
            },
            {
              icon: Leaf,
              title: "You stay in control",
              body: "Review every draft before submitting.",
            },
          ].map((s) => (
            <div key={s.title}>
              <s.icon size={20} />
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </aside>
      </section>
    </>
  );
}
function People({ user, revision, refresh, message }: PageProps) {
  const [search, setSearch] = useState(""),
    [department, setDepartment] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [modal, setModal] = useState<Row | null>(null),
    [credentials, setCredentials] = useState<Row | null>(null),
    [importOpen, setImportOpen] = useState(false),
    [csvFile, setCsvFile] = useState<File | null>(null),
    [report, setReport] = useState<Row | null>(null),
    [importBusy, setImportBusy] = useState(false);
  const org = useData(
      user.role === "Employee" ? "/policy" : "/organization",
      revision,
    ),
    { data, error, busy } = useData(
      "/employees?" +
        new URLSearchParams({ search, department, status, page: String(page) }),
      revision,
    );
  const d = data as Row,
    o = org.data as Row;
  const fields: Field[] = [
    { key: "name", label: "Full name", required: true },
    { key: "code", label: "Employee code", required: true },
    { key: "email", label: "Work email", type: "email", required: true },
    { key: "joinDate", label: "Joining date", type: "date", required: true },
    {
      key: "department",
      label: "Department",
      required: true,
      options:
        o?.departments?.map((r: Row) => ({ value: r._id, label: r.name })) ||
        [],
    },
    {
      key: "designation",
      label: "Designation",
      required: true,
      options:
        o?.designations?.map((r: Row) => ({ value: r._id, label: r.name })) ||
        [],
    },
    {
      key: "basicSalary",
      label: "Monthly basic salary (PKR)",
      type: "number",
      min: 0.01,
      step: ".01",
      required: true,
      help: "Gross = basic + 40% HRA + 10% medical.",
    },
    {
      key: "gender",
      label: "Gender",
      options: ["Female", "Male", "Other", "Prefer not to say"].map((v) => ({
        value: v,
        label: v,
      })),
    },
    { key: "phone", label: "Phone number" },
    { key: "address", label: "Address", type: "textarea" },
    ...(modal?._id
      ? [
          {
            key: "status",
            label: "Employment status",
            required: true,
            options: ["active", "probation", "exited"].map((v) => ({
              value: v,
              label: v,
            })),
          },
          { key: "exitDate", label: "Exit date", type: "date" },
        ]
      : []),
  ];
  async function runImport(commit = false) {
    if (!csvFile) return;
    setImportBusy(true);
    try {
      const form = new FormData();
      form.append("file", csvFile);
      const r = await api.post("/employees/import?dryRun=" + !commit, form, {
        timeout: 600000,
      });
      setReport(r.data);
      if (commit) {
        refresh();
        message(
          `${r.data.count} employees imported. Save the temporary credentials below.`,
        );
      }
    } catch (e) {
      message(errorMessage(e));
    } finally {
      setImportBusy(false);
    }
  }
  return (
    <>
      <div className="section-toolbar">
        <div className="toolbar-title">
          <h2>
            {user.role === "Employee" ? "My profile" : "Employee directory"}
          </h2>
          <span className="count-chip">{d?.total || 0} people</span>
        </div>
        {user.role === "HR" && (
          <div className="button-row">
            <a href="/api/employees/export" className="button">
              <Download size={16} />
              Export
            </a>
            <button className="button" onClick={() => setImportOpen(true)}>
              <Upload size={16} />
              Import CSV
            </button>
            <button
              className="button primary"
              onClick={() =>
                setModal({ gender: "Prefer not to say", joinDate: today() })
              }
            >
              <Plus size={16} />
              Add employee
            </button>
          </div>
        )}
      </div>
      {user.role !== "Employee" && (
        <div className="directory-filters">
          <label className="search-field">
            <Search size={17} />
            <input
              placeholder="Search name, email or code…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {o?.departments?.map((r: Row) => (
              <option value={r._id} key={r._id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Employment status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option>active</option>
            <option>probation</option>
            <option>exited</option>
          </select>
        </div>
      )}
      <section className="card">
        <DataState busy={busy} error={error}>
          {d?.items?.length ? (
            <>
              <Table
                headers={[
                  "Name",
                  "Department",
                  "Designation",
                  "Joined",
                  "Status",
                  "",
                ]}
              >
                {d.items.map((e: Row) => (
                  <tr key={e._id}>
                    <td>
                      <div className="person-cell">
                        <span className="avatar">{e.name.slice(0, 1)}</span>
                        <div>
                          <strong>{e.name}</strong>
                          <small>
                            {e.email} · {e.code}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{e.department?.name}</td>
                    <td>{e.designation?.name}</td>
                    <td>{dateLabel(e.joinDate)}</td>
                    <td>
                      <Badge>{e.status}</Badge>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() =>
                          setModal({
                            ...e,
                            department: e.department?._id,
                            designation: e.designation?._id,
                          })
                        }
                      >
                        View profile
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
              <div className="pagination">
                <span>
                  {d.total} employees · Page {page} of {d.pages || 1}
                </span>
                <div>
                  <button
                    className="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    className="button"
                    disabled={page >= d.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Empty
              title="Great teams start with one person"
              body={
                user.role === "HR"
                  ? "Add your first employee. Their login account will be created automatically."
                  : "Your employee profiles will appear here once HR adds them."
              }
            />
          )}
        </DataState>
      </section>
      {modal && (
        <Modal
          title={modal._id ? "Employee 360" : "Welcome a new team member"}
          close={() => setModal(null)}
        >
          <EmployeePhoto
            employee={modal}
            editable={user.role === "HR" || user.role === "Admin"}
            onChange={(photo) => setModal({ ...modal, referencePhoto: photo })}
            onSaved={(date) => {
              setModal({ ...modal, faceEnrolledAt: date });
              refresh();
              message("Attendance reference photo saved.");
            }}
          />
          {modal._id && (
            <div className="profile-summary">
              <span className="avatar large">{modal.name?.slice(0, 1)}</span>
              <div>
                <h3>{modal.name}</h3>
                <p>
                  {modal.email} · {modal.code}
                </p>
                <strong>{cash(modal.basicSalary * 1.5)} monthly gross</strong>
              </div>
            </div>
          )}
          {user.role === "Admin" ? (
            <div className="detail-grid">
              {Object.entries(modal)
                .filter(([k]) =>
                  [
                    "name",
                    "code",
                    "email",
                    "joinDate",
                    "status",
                    "phone",
                    "address",
                    "basicSalary",
                    "exitDate",
                  ].includes(k),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <small>{k}</small>
                    <strong>{String(v || "—")}</strong>
                  </div>
                ))}
            </div>
          ) : (
            <FieldsForm
              fields={
                user.role === "Employee"
                  ? fields.filter((f) => ["phone", "address"].includes(f.key))
                  : modal._id
                    ? fields.filter((f) => !["email", "code"].includes(f.key))
                    : fields
              }
              initial={modal}
              label={modal._id ? "Save profile" : "Create employee & login"}
              submit={async (values) => {
                if (modal._id) {
                  await api.patch("/employees/" + modal._id, values);
                  message("Employee profile updated.");
                } else {
                  const r = await api.post(
                    "/employees",
                    {
                      ...values,
                      ...(modal.referencePhoto
                        ? { referencePhoto: modal.referencePhoto }
                        : {}),
                    },
                    { timeout: 30000 },
                  );
                  setCredentials({
                    email: r.data.employee.email,
                    password: r.data.temporaryPassword,
                  });
                }
                setModal(null);
                refresh();
              }}
            />
          )}
        </Modal>
      )}
      {credentials && (
        <Modal
          title="Their next chapter is ready"
          close={() => setCredentials(null)}
        >
          <p>
            Share these credentials securely. The password must be changed at
            first sign-in. This temporary password is only shown now.
          </p>
          <div className="credential-box">
            <small>Email</small>
            <strong>{credentials.email}</strong>
            <small>Temporary password</small>
            <code>
              {credentials.password ||
                "Existing HR account linked; their password is unchanged."}
            </code>
          </div>
          <button
            className="button primary"
            onClick={() => setCredentials(null)}
          >
            I’ve saved the credentials
            <Check size={16} />
          </button>
        </Modal>
      )}
      {importOpen && (
        <Modal
          title="Bring your people along"
          close={() => setImportOpen(false)}
        >
          <p>
            CSV headers: code, name, email, department, designation, joinDate,
            basicSalary, phone, address. Use department and designation IDs from
            Organization. Limit: 500 rows / 2 MB.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setCsvFile(e.target.files?.[0] || null);
              setReport(null);
            }}
          />
          <div className="button-row inset">
            <button
              className="button"
              disabled={!csvFile || importBusy}
              onClick={() => runImport()}
            >
              Validate dry run
            </button>
            <button
              className="button primary"
              disabled={!report?.valid || importBusy}
              onClick={() => runImport(true)}
            >
              Import validated rows
            </button>
          </div>
          {report && (
            <>
              <p>
                {report.count} rows · {report.errors?.length || 0} errors
              </p>
              {report.errors?.length > 0 && (
                <Table headers={["Row", "Field", "Reason"]}>
                  {report.errors.map((e: Row, i: number) => (
                    <tr key={i}>
                      <td>{e.row}</td>
                      <td>{e.field}</td>
                      <td>{e.reason}</td>
                    </tr>
                  ))}
                </Table>
              )}
              {report.created && (
                <div className="credential-box">
                  <strong>Save these one-time credentials</strong>
                  {report.created.map((r: Row) => (
                    <code key={r.email}>
                      {r.email}: {r.temporaryPassword}
                    </code>
                  ))}
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
function AttendancePage({ user, revision, refresh, message }: PageProps) {
  const [filters, setFilters] = useState<Row>(initialFilters()),
    [correction, setCorrection] = useState(false),
    [manual, setManual] = useState(false),
    [camera, setCamera] = useState<"in" | "out" | null>(null),
    [review, setReview] = useState<Row | null>(null);
  const { data, error, busy } = useData(
      "/attendance?" + new URLSearchParams(filters as Record<string, string>),
      revision,
    ),
    cor = useData("/corrections", revision),
    leaveHistory = useData("/leave", revision),
    org = useData(
      user.role === "Employee" ? "/policy" : "/organization",
      revision,
    ),
    employeeList = useData(
      user.role === "HR" ? "/employees?limit=100" : "/employees?limit=1",
      revision,
    );
  const records = (data || []) as Row[],
    corrections = (cor.data || []) as Row[];
  const calendarMap = new Map(
    records
      .filter((r) => String(r.employee_id?._id) === String(user.employee_id))
      .map((r) => [r.date, r]),
  );
  for (const leave of (leaveHistory.data || []) as Row[]) {
    if (
      leave.status !== "approved" ||
      String(leave.employee_id?._id) !== String(user.employee_id)
    )
      continue;
    for (const date of leave.days)
      calendarMap.set(date, {
        ...calendarMap.get(date),
        date,
        status: leave.duration === "half_day" ? "half_day" : "on_leave",
        displayStatus: leave.duration === "half_day" ? "half_day" : "on_leave",
        leaveType: leave.typeName || leave.type?.name,
        leaveFraction: leave.duration === "half_day" ? 0.5 : 1,
      });
  }
  const myToday = records.find(
    (a) =>
      a.date === today() &&
      String(a.employee_id?._id) === String(user.employee_id),
  );
  function mark(type: string) {
    setCamera(type === "check-out" ? "out" : "in");
  }
  return (
    <>
      {user.role !== "Admin" && (
        <section className="checkin-banner">
          <div className="checkin-icon">
            <Clock3 size={29} />
          </div>
          <div>
            <span className="eyebrow">TODAY IS A FRESH START</span>
            <h2>
              {myToday?.checkOut
                ? "That’s a wrap. Nicely done."
                : myToday?.checkIn
                  ? "You’re on the clock."
                  : "Ready when you are."}
            </h2>
            <p>
              {myToday?.checkIn
                ? `Checked in at ${new Date(myToday.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${myToday.checkOut ? " · " + myToday.hours + " hours tracked" : ""}`
                : "Check in to start tracking your working day."}
            </p>
          </div>
          <div className="button-row">
            <button
              className="button primary"
              disabled={!!myToday?.checkOut}
              onClick={() => mark(myToday?.checkIn ? "check-out" : "check-in")}
            >
              <Clock3 size={17} />
              {myToday?.checkIn ? "Check out" : "Check in"}
            </button>
            {!myToday?.checkIn && (
              <button className="button" onClick={() => setCamera("in")}>
                <Camera size={17} />
                Camera check-in
              </button>
            )}
          </div>
        </section>
      )}
      <div className="section-toolbar">
        <h2>
          {user.role === "Employee"
            ? "My attendance"
            : "Daily attendance board"}
        </h2>
        {user.role === "Employee" && (
          <button className="button" onClick={() => setCorrection(true)}>
            <Plus size={16} />
            Request correction
          </button>
        )}
        {user.role === "HR" && (
          <button className="button primary" onClick={() => setManual(true)}>
            <Plus size={16} />
            Add clock-in
          </button>
        )}
      </div>
      <Filters
        value={filters}
        setValue={setFilters}
        departments={(org.data as Row)?.departments || []}
      />
      {user.role === "Employee" && !busy && (
        <AttendanceCalendar
          records={[...calendarMap.values()]}
          month={filters.start}
          weekends={(org.data as Row)?.weekends}
        />
      )}
      <section className="card">
        <DataState busy={busy} error={error}>
          {records.length ? (
            <Table
              headers={[
                "Employee",
                "Date",
                "Check in",
                "Check out",
                "Hours",
                "Status",
              ]}
            >
              {records.map((a: Row, i: number) => (
                <tr key={a._id || i}>
                  <td>
                    <strong>{a.employee_id?.name}</strong>
                    <small className="block">{a.employee_id?.code}</small>
                  </td>
                  <td>{dateLabel(a.date)}</td>
                  <td>
                    {a.checkIn
                      ? new Date(a.checkIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>
                    {a.checkOut
                      ? new Date(a.checkOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>{a.hours || "—"}</td>
                  <td>
                    <Badge>{a.displayStatus || a.status}</Badge>
                    {a.leaveType && (
                      <small className="block">
                        {a.leaveFraction === 0.5 ? "Half-day " : ""}
                        {a.leaveType} leave
                      </small>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title="A new day awaits"
              body="Attendance will appear as employees join and check in."
            />
          )}
        </DataState>
      </section>
      <section className="card spaced">
        <div className="panel-heading">
          <div>
            <h2>Attendance corrections</h2>
            <p>A little flexibility, with a clear record.</p>
          </div>
        </div>
        {corrections.length ? (
          <Table headers={["Employee", "Date", "Reason", "Status", ""]}>
            {corrections.map((c) => (
              <tr key={c._id}>
                <td>{c.employee_id?.name}</td>
                <td>{dateLabel(c.date)}</td>
                <td className="wrap-cell">{c.reason}</td>
                <td>
                  <Badge>{c.status}</Badge>
                </td>
                <td>
                  {user.role === "HR" && c.status === "pending" && (
                    <button
                      className="text-button"
                      onClick={() => setReview(c)}
                    >
                      Review
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="Everything looks in order"
            body="Correction requests will appear here."
          />
        )}
      </section>
      {correction && (
        <Modal
          title="Request an attendance correction"
          close={() => setCorrection(false)}
        >
          <p>
            Enter the actual check-in and check-out time in your local timezone.
            HR will review your request.
          </p>
          <FieldsForm
            fields={[
              {
                key: "date",
                label: "Attendance date",
                type: "date",
                required: true,
                max: today(),
              },
              {
                key: "checkIn",
                label: "Check-in",
                type: "datetime-local",
                required: true,
              },
              {
                key: "checkOut",
                label: "Check-out",
                type: "datetime-local",
                required: true,
              },
              {
                key: "reason",
                label: "Reason",
                type: "textarea",
                required: true,
              },
            ]}
            label="Send for review"
            submit={async (d) => {
              await api.post("/corrections", {
                ...d,
                checkIn: new Date(d.checkIn).toISOString(),
                checkOut: new Date(d.checkOut).toISOString(),
              });
              setCorrection(false);
              refresh();
              message("Correction sent to HR.");
            }}
          />
        </Modal>
      )}
      {manual && user.role === "HR" && (
        <Modal
          title="Manually add a clock-in"
          close={() => setManual(false)}
        >
          <p>
            Use this if camera attendance failed. The entry is saved in the
            audit trail and uses the attendance rules for that date.
          </p>
          <FieldsForm
            fields={[
              {
                key: "employee_id",
                label: "Employee",
                required: true,
                options:
                  ((employeeList.data as Row)?.items || [])
                    .filter((e: Row) => e.status !== "exited")
                    .map((e: Row) => ({
                      value: e._id,
                      label: `${e.name} (${e.code})`,
                    })),
              },
              {
                key: "checkIn",
                label: "Clock-in date and time",
                type: "datetime-local",
                required: true,
              },
              {
                key: "reason",
                label: "Reason for manual entry",
                type: "textarea",
                required: true,
                help: "This will be recorded in the audit trail.",
              },
            ]}
            label="Save clock-in"
            submit={async (d) => {
              await api.post("/attendance/manual", {
                ...d,
                checkIn: new Date(d.checkIn).toISOString(),
              });
              setManual(false);
              refresh();
              message("Manual clock-in recorded.");
            }}
          />
        </Modal>
      )}
      {review && (
        <ReviewModal
          title="Review attendance correction"
          details={`${review.employee_id?.name} · ${dateLabel(review.date)} · ${review.reason}`}
          close={() => setReview(null)}
          submit={async (d) => {
            await api.patch("/corrections/" + review._id, d);
            setReview(null);
            refresh();
            message("Correction reviewed.");
          }}
        />
      )}
      {camera && (
        <Modal
          title={camera === "out" ? "Camera check-out" : "Camera check-in"}
          close={() => setCamera(null)}
        >
          <CameraCheckin
            mode={camera}
            done={() => {
              setCamera(null);
              refresh();
              message(
                camera === "out"
                  ? "Face verified. Check-out recorded."
                  : "Face verified. Check-in recorded.",
              );
            }}
          />
        </Modal>
      )}
    </>
  );
}
function ReviewModal({
  title,
  details,
  close,
  submit,
}: {
  title: string;
  details: string;
  close: () => void;
  submit: (v: Row) => Promise<void>;
}) {
  return (
    <Modal title={title} close={close}>
      <p>{details}</p>
      <FieldsForm
        fields={[
          {
            key: "status",
            label: "Decision",
            required: true,
            options: [
              { value: "approved", label: "Approve" },
              { value: "rejected", label: "Reject" },
            ],
          },
          {
            key: "comment",
            label: "Review comment",
            required: true,
            type: "textarea",
          },
        ]}
        submit={submit}
        label="Confirm decision"
      />
    </Modal>
  );
}
function LeavePage({ user, revision, refresh, message }: PageProps) {
  const [apply, setApply] = useState<Row | null>(null),
    [review, setReview] = useState<Row | null>(null),
    [sentence, setSentence] = useState(""),
    [thinking, setThinking] = useState(false);
  const list = useData("/leave", revision),
    bal = useData(
      user.role === "Admin" ? "/policy" : "/leave/balance",
      revision,
    ),
    policy = useData("/policy", revision);
  const rows = (list.data || []) as Row[],
    types = (policy.data as Row)?.leaveTypes || [];
  return (
    <>
      <div className="info-strip">
        <ShieldCheck size={18} />
        <p>
          {user.role === "Admin"
            ? "Review HR leave, sick leave and half-day requests here."
            : user.role === "HR"
              ? "Employee requests come to HR. Your own leave, sick leave and half-day requests go to Admin."
              : "Your leave, sick leave and half-day requests are sent to HR for approval."}
          {user.role === "HR" && !user.employee_id && (
            <>
              {" "}
              To apply for your own leave, first add an employee profile in{" "}
              <Link href="/employees" className="text-button">
                People
              </Link>{" "}
              using your HR login email, then refresh this page.
            </>
          )}
        </p>
      </div>
      {user.role !== "Admin" && (
        <>
          <div className="balance-cards">
            {Array.isArray(bal.data) &&
              bal.data.map((b: Row) => (
                <article className="card balance-card" key={b._id}>
                  <span className="kpi-icon tone-0">
                    <CalendarDays size={18} />
                  </span>
                  <h3>{b.name}</h3>
                  <strong>
                    {b.unpaid ? "∞" : b.remaining}
                    <small>{b.unpaid ? "unlimited" : "days left"}</small>
                  </strong>
                  <p>
                    {b.used} used · {b.reserved} pending
                    {!b.unpaid ? ` · ${b.quota} yearly quota` : ""}
                  </p>
                </article>
              ))}
          </div>
          <section className="smart-leave">
            <div>
              <Sparkles size={20} />
              <h3>Time off, in your own words</h3>
              <span className="mini-tag">AI</span>
            </div>
            <p>Tell us what you need. Review the details before you send.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setThinking(true);
                try {
                  const r = await api.post("/ai/smart-leave", {
                    message: sentence,
                  });
                  setApply(r.data.draft);
                } catch (e) {
                  message(errorMessage(e));
                } finally {
                  setThinking(false);
                }
              }}
            >
              <input
                required
                placeholder="I need next Monday and Tuesday off for a wedding…"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
              />
              <button className="button primary" disabled={thinking}>
                {thinking ? "Thinking…" : "Draft request"}
                <ArrowUpRight size={16} />
              </button>
            </form>
          </section>
        </>
      )}
      <div className="section-toolbar">
        <div>
          <h2>
            {user.role === "Employee"
              ? "My leave requests"
              : "Leave requests & approvals"}
          </h2>
        </div>
        {user.role !== "Admin" && (
          <button className="button primary" onClick={() => setApply({})}>
            <Plus size={16} />
            Request time off
          </button>
        )}
      </div>
      <section className="card">
        <DataState busy={list.busy} error={list.error}>
          {rows.length ? (
            <Table
              headers={[
                "Employee",
                "Leave type",
                "Dates",
                "Days",
                "Approver",
                "Status",
                "",
              ]}
            >
              {rows.map((l) => (
                <tr key={l._id}>
                  <td>
                    <strong>{l.employee_id?.name}</strong>
                    <small className="block">{l.reason}</small>
                  </td>
                  <td>
                    {l.typeName || l.type?.name}
                    {l.duration === "half_day" && (
                      <small className="block">Half day</small>
                    )}
                  </td>
                  <td>
                    {dateLabel(l.start)} – {dateLabel(l.end)}
                  </td>
                  <td>{l.totalDays ?? l.days.length}</td>
                  <td>{l.approverRole}</td>
                  <td>
                    <Badge>{l.status}</Badge>
                    {l.comment && <small className="block">{l.comment}</small>}
                  </td>
                  <td>
                    {l.canReview ? (
                      <button
                        className="text-button"
                        onClick={() => setReview(l)}
                      >
                        Review
                        <ArrowUpRight size={14} />
                      </button>
                    ) : (
                      String(l.employee_id?._id) === String(user.employee_id) &&
                      ["pending", "approved"].includes(l.status) && (
                        <button
                          className="text-button"
                          onClick={async () => {
                            try {
                              await api.patch("/leave/" + l._id, {
                                status: "cancelled",
                              });
                              refresh();
                              message("Leave request cancelled.");
                            } catch (e) {
                              message(errorMessage(e));
                            }
                          }}
                        >
                          Cancel request
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title="A little time for yourself"
              body="Leave requests, balances and decisions, all in one place."
            />
          )}
        </DataState>
      </section>
      {apply && (
        <Modal
          title={
            Object.keys(apply).length
              ? "Review your AI-drafted leave"
              : "Request time off"
          }
          close={() => setApply(null)}
        >
          {Object.keys(apply).length > 0 && (
            <p className="ai-label">
              <Sparkles size={14} />
              AI-generated · Please review before submitting.
            </p>
          )}
          <FieldsForm
            initial={{ duration: "full_day", ...apply }}
            fields={[
              {
                key: "type",
                label: "Leave type",
                required: true,
                options: types.map((t: Row) => ({
                  value: t._id,
                  label: t.name,
                })),
              },
              {
                key: "duration",
                label: "Duration",
                required: true,
                options: [
                  { value: "full_day", label: "Full day(s)" },
                  { value: "half_day", label: "Half day (0.5 day)" },
                ],
              },
              {
                key: "start",
                label: "First day",
                type: "date",
                required: true,
              },
              { key: "end", label: "Last day", type: "date", required: true },
              {
                key: "reason",
                label: "Reason",
                required: true,
                type: "textarea",
              },
            ]}
            label="Submit leave request"
            submit={async (d) => {
              await api.post("/leave", d);
              setApply(null);
              refresh();
              message("Leave request sent for approval.");
            }}
          />
        </Modal>
      )}
      {review && (
        <ReviewModal
          title="Review leave request"
          details={`${review.employee_id?.name} · ${review.typeName} · ${review.totalDays ?? review.days.length} days · ${review.reason}`}
          close={() => setReview(null)}
          submit={async (d) => {
            await api.patch("/leave/" + review._id, d);
            setReview(null);
            refresh();
            message("Leave request reviewed.");
          }}
        />
      )}
    </>
  );
}
function PayrollPage({ user, revision, refresh, message }: PageProps) {
  const { data, error, busy } = useData("/payroll", revision),
    [month, setMonth] = useState(today().slice(0, 7)),
    [running, setRunning] = useState(false),
    [selected, setSelected] = useState<Row | null>(null),
    [finalizing, setFinalizing] = useState<Row | null>(null);
  const runs = (data || []) as Row[];
  return (
    <>
      <section className="payroll-intro">
        <span className="kpi-icon tone-0">
          <Wallet size={24} />
        </span>
        <div>
          <h2>Payday, without the guesswork.</h2>
          <p>
            Attendance-based calculations. Clear deductions. Payslips your team
            can count on.
          </p>
        </div>
        {user.role === "HR" && (
          <div className="button-row">
            <input
              aria-label="Payroll month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button
              className="button primary"
              disabled={running}
              onClick={async () => {
                setRunning(true);
                try {
                  await api.post("/payroll", { month });
                  refresh();
                  message(
                    "Payroll draft prepared. Review before Admin finalizes.",
                  );
                } catch (e) {
                  message(errorMessage(e));
                } finally {
                  setRunning(false);
                }
              }}
            >
              <RefreshCw size={16} />
              {running ? "Preparing…" : "Prepare draft"}
            </button>
          </div>
        )}
      </section>
      <section className="card">
        <div className="panel-heading">
          <div>
            <h2>
              {user.role === "Employee"
                ? "My payslips"
                : "Monthly payroll runs"}
            </h2>
            <p>Finalized months are locked to protect your records.</p>
          </div>
          <LockKeyhole size={18} />
        </div>
        <DataState busy={busy} error={error}>
          {runs.length ? (
            <Table
              headers={[
                "Month",
                "Status",
                "People",
                "Gross pay",
                "Net pay",
                "",
              ]}
            >
              {runs.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>
                      {new Date(p.month + "-02").toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </td>
                  <td>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td>{p.slips.length}</td>
                  <td>{cash(p.totalGross ?? p.slips[0]?.gross)}</td>
                  <td>
                    <strong>{cash(p.totalNet ?? p.slips[0]?.net)}</strong>
                  </td>
                  <td>
                    <div className="button-row">
                      <button
                        className="text-button"
                        onClick={() => setSelected(p)}
                      >
                        View payslips
                        <ArrowUpRight size={14} />
                      </button>
                      {user.role === "Admin" && p.status === "draft" && (
                        <button
                          className="button"
                          onClick={() => setFinalizing(p)}
                        >
                          <LockKeyhole size={14} />
                          Finalize
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title="Your next payday starts here"
              body={
                user.role === "Employee"
                  ? "Your payslips will appear after Admin finalizes payroll."
                  : "HR can prepare a monthly draft once employees are registered."
              }
            />
          )}
        </DataState>
      </section>
      <div className="payroll-rules">
        <ShieldCheck size={18} />
        <p>
          Gross = basic + 40% housing + 10% medical. Absences, unpaid leave and
          half days are deducted. Joiners and leavers are prorated. Tax follows
          the challenge’s illustrative annual slabs.
        </p>
      </div>
      {selected && (
        <Modal
          title={"Payslips · " + selected.month}
          close={() => setSelected(null)}
        >
          <Table
            headers={["Employee", "Gross", "Deduction", "Tax", "Net", "PDF"]}
          >
            {selected.slips.map((s: Row) => (
              <tr key={s.employee_id}>
                <td>
                  <strong>{s.name}</strong>
                  <small className="block">
                    {s.code} · {s.absent} absent · {s.unpaid} unpaid ·{" "}
                    {s.halfDays} half days
                  </small>
                </td>
                <td>{cash(s.gross)}</td>
                <td>{cash(s.deduction)}</td>
                <td>{cash(s.tax)}</td>
                <td>{cash(s.net)}</td>
                <td>
                  <a
                    className="button"
                    href={`/api/payroll/${selected._id}/payslip/${s.employee_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={15} />
                    <span className="sr-only">Download payslip</span>
                  </a>
                </td>
              </tr>
            ))}
          </Table>
        </Modal>
      )}
      {finalizing && (
        <Modal
          title="Ready to make it official?"
          close={() => setFinalizing(null)}
        >
          <p>
            Finalize payroll for <strong>{finalizing.month}</strong> with net
            pay of <strong>{cash(finalizing.totalNet)}</strong>. This
            permanently locks the run and its attendance and leave records.
            Review the payslips first.
          </p>
          <button
            className="button primary"
            disabled={running}
            onClick={async () => {
              setRunning(true);
              try {
                await api.post("/payroll/" + finalizing._id + "/finalize");
                setFinalizing(null);
                refresh();
                message(
                  "Payroll finalized. Payslips are available to employees.",
                );
              } catch (e) {
                message(errorMessage(e));
              } finally {
                setRunning(false);
              }
            }}
          >
            <LockKeyhole size={16} />
            Finalize & lock month
          </button>
        </Modal>
      )}
    </>
  );
}
function AuthScreen({
  setup,
  signed,
  theme,
  toggleTheme,
}: {
  setup: boolean;
  signed: (u: Row, successMessage?: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const pathname = usePathname();
  const signup = pathname === "/signup" || (pathname !== "/login" && setup);
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">BUILT AROUND YOUR PEOPLE</span>
          <h1>
            Good teams.
            <br />
            Great possibilities.
          </h1>
          <p>
            A calmer way to manage the everyday.
            <br />
            Bring your people, time and payroll together.
          </p>
          <div className="story-grid">
            <div>
              <Users />
              <span>People first</span>
            </div>
            <div>
              <Clock3 />
              <span>Time, simplified</span>
            </div>
            <div>
              <ShieldCheck />
              <span>Thoughtfully secure</span>
            </div>
          </div>
        </div>
        <small>HCM Lite · A little more human.</small>
      </div>
      <div className="auth-card">
        <button className="icon-button outlined theme-toggle auth-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <nav className="auth-tabs" aria-label="Account access">
          <Link
            href="/login"
            className={!signup ? "selected" : ""}
            aria-current={!signup ? "page" : undefined}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={signup ? "selected" : ""}
            aria-current={signup ? "page" : undefined}
          >
            Sign up
          </Link>
        </nav>
        <span className="eyebrow">
          {signup ? "CREATE YOUR WORKSPACE" : "WELCOME BACK"}
        </span>
        <h1>{signup ? "Sign up" : "Log in"}</h1>
        <p>
          {signup
            ? "Set up your company and first Admin account. Your workspace starts completely empty."
            : "Sign in to your people workspace."}
        </p>
        {signup && !setup ? (
          <div className="signup-guidance">
            <h3>Your company is already set up.</h3>
            <p>
              Ask your Admin to create an HR account, or ask HR to register your
              Employee account. Use the email and temporary password they
              provide to log in.
            </p>
            <Link href="/login" className="button primary">
              Go to log in
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <FieldsForm
              key={signup ? "signup" : "login"}
              fields={[
                ...(signup
                  ? [
                      {
                        key: "companyName",
                        label: "Company name",
                        required: true,
                      },
                      { key: "name", label: "Your full name", required: true },
                    ]
                  : []),
                {
                  key: "email",
                  label: "Email address",
                  type: "email",
                  required: true,
                },
                {
                  key: "password",
                  label: "Password",
                  type: "password",
                  required: true,
                  help: signup ? "Use at least 10 characters." : undefined,
                },
              ]}
              submit={async (d) => {
                if (!signup && setup)
                  throw new Error(
                    "No company account exists in this database yet. Choose Sign up to create the company and first Admin.",
                  );
                const r = await api.post(signup ? "/setup" : "/auth/login", d);
                signed(
                  r.data.user,
                  signup
                    ? "Workspace created successfully."
                    : "Successfully logged in.",
                );
              }}
              label={signup ? "Sign up & create workspace" : "Log in"}
            />
            <p className="auth-switch-text">
              {signup ? "Already have an account?" : "New to HCM Lite?"}{" "}
              <Link href={signup ? "/login" : "/signup"}>
                {signup ? "Log in" : "Sign up"}
              </Link>
            </p>
          </>
        )}
        <div className="auth-secure">
          <LockKeyhole size={14} />
          Your workspace. Secure by design.
        </div>
      </div>
    </div>
  );
}
function useData(path: string, revision = 0) {
  const [data, setData] = useState<Row | Row[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let live = true;
    setBusy(true);
    setError("");
    api
      .get(path)
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
  }, [path, revision]);
  return { data, error, busy };
}
function DataState({
  busy,
  error,
  children,
}: {
  busy: boolean;
  error: string;
  children: ReactNode;
}) {
  if (busy) return <Loading />;
  if (error)
    return (
      <div className="error">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  return <>{children}</>;
}
type PageProps = {
  user: Row;
  revision: number;
  refresh: () => void;
  message: (s: string) => void;
};
function Filters({
  value,
  setValue,
  departments = [],
}: {
  value: Row;
  setValue: (v: Row) => void;
  departments?: Row[];
}) {
  return (
    <div className="filters">
      <label>
        <CalendarDays size={15} />
        <input
          aria-label="Start date"
          type="date"
          value={value.start}
          onChange={(e) => setValue({ ...value, start: e.target.value })}
        />
        <span>—</span>
        <input
          aria-label="End date"
          type="date"
          value={value.end}
          onChange={(e) => setValue({ ...value, end: e.target.value })}
        />
      </label>
      {departments.length > 0 && (
        <label>
          <Building2 size={15} />
          <select
            aria-label="Filter department"
            value={value.department}
            onChange={(e) => setValue({ ...value, department: e.target.value })}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option value={d._id} key={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
function Dashboard({
  user,
  revision,
  message,
}: {
  user: Row;
  revision: number;
  message: (s: string) => void;
}) {
  const [filters, setFilters] = useState<Row>(initialFilters()),
    [summary, setSummary] = useState(""),
    [summing, setSumming] = useState(false);
  const query = new URLSearchParams(
      filters as Record<string, string>,
    ).toString(),
    { data, error, busy } = useData("/analytics?" + query, revision),
    org = useData(
      user.role === "Employee" ? "/policy" : "/organization",
      revision,
    ),
    ann = useData("/announcements", revision);
  const d = (data || {}) as Row;
  const employee = user.role === "Employee";
  const cards = employee
    ? [
        {
          label: "Hours this week",
          value: `${d.weekHours || 0} / 40 h`,
          sub: "Tracked hours · Monday to today",
          icon: Clock3,
        },
        {
          label: "Late arrivals",
          value: d.lateCount || 0,
          sub: "In the selected period",
          icon: Sun,
        },
        {
          label: "Leave remaining",
          value:
            d.balance
              ?.filter((b: Row) => !b.unpaid)
              .reduce((n: number, b: Row) => n + b.remaining, 0) || 0,
          sub: "Days across paid leave types",
          icon: CalendarDays,
        },
        {
          label: "Last net pay",
          value: cash(d.lastPayslip?.net || 0),
          sub: d.lastPayslip?.month || "No finalized payslip yet",
          icon: Wallet,
        },
      ]
    : user.role === "Admin"
      ? [
          {
            label: "Total headcount",
            value: d.headcount || 0,
            sub: "People in your organization",
            icon: Users,
          },
          {
            label: "Payroll cost",
            value: cash(d.payrollCost || 0),
            sub: "Gross pay in selected period",
            icon: Wallet,
          },
          {
            label: "Average salary",
            value: cash(d.averageSalary || 0),
            sub: "Monthly gross per employee",
            icon: ArrowUpRight,
          },
          {
            label: "Attrition YTD",
            value: `${d.attritionYtd || 0}%`,
            sub: "Exits since the start of the year",
            icon: CalendarDays,
          },
        ]
      : [
          {
            label: "Total employees",
            value: d.headcount || 0,
            sub: "Active & probation team members",
            icon: Users,
          },
          {
            label: "Present today",
            value: d.present || 0,
            sub: "Showing up, making a difference",
            icon: Clock3,
          },
          {
            label: "On leave today",
            value: d.onLeave || 0,
            sub: "Taking a well-deserved break",
            icon: CalendarDays,
          },
          {
            label: "Late today",
            value: d.late || 0,
            sub: "After the grace period",
            icon: Sun,
          },
        ];
  return (
    <>
      <div className="overview-toolbar">
        <div className="section-tag">
          <span className="green-dot" />
          Live workspace overview
        </div>
        <Filters
          value={filters}
          setValue={setFilters}
          departments={(org.data as Row)?.departments || []}
        />
      </div>
      <DataState busy={busy} error={error}>
        <div className="kpi-grid">
          {cards.map((c, i) => (
            <article className="kpi-card" key={c.label}>
              <div className="kpi-top">
                <span>{c.label}</span>
                <span className={"kpi-icon tone-" + i}>
                  <c.icon size={19} />
                </span>
              </div>
              <strong>{c.value}</strong>
              <p>{c.sub}</p>
            </article>
          ))}
        </div>
        <AttendancePerformance
          personal={employee}
          department={filters.department}
          revision={revision}
          prefetched={d.monthlyPerformance}
        />
        <div className="dashboard-grid">
          <section className="card trend-card">
            <div className="panel-heading">
              <div>
                <h2>
                  {employee ? "Your attendance rhythm" : "Attendance overview"}
                </h2>
                <p>A clearer picture of the working day.</p>
              </div>
              <span className="badge green">
                {d.attendanceRate || 0}% attendance
              </span>
            </div>
            {d.trend?.some((r: Row) => r.present || r.absent || r.onLeave) ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.trend}>
                    <defs>
                      <linearGradient
                        id="presentFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#288476"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#288476"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef0ed" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#84928d" }}
                      minTickGap={30}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={30}
                      tick={{ fontSize: 11, fill: "#84928d" }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="#288476"
                      fill="url(#presentFill)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stroke="#dfaa64"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                title="Your story is just getting started"
                body="Attendance trends will grow as your team checks in."
              />
            )}
            <div className="chart-legend">
              <span>
                <i style={{ background: "#288476" }} />
                Present
              </span>
              <span>
                <i style={{ background: "#dfaa64" }} />
                Absent
              </span>
              <span className="legend-note">
                Based on real attendance records
              </span>
            </div>
          </section>
          <section className="ai-card">
            <div className="ai-orb">
              <Sparkles size={25} />
            </div>
            <span className="eyebrow">A FRESH PERSPECTIVE</span>
            <h2>
              Your data.
              <br />A little more insight.
            </h2>
            <p>
              Turn everyday numbers into a clearer understanding of your team.
            </p>
            {summary && (
              <div className="ai-summary">
                <small>AI-generated</small>
                <p>{summary}</p>
              </div>
            )}
            {!employee ? (
              <button
                className="button light"
                disabled={summing}
                onClick={async () => {
                  setSumming(true);
                  try {
                    const r = await api.post("/ai/summary", { filters });
                    setSummary(r.data.answer);
                  } catch (e) {
                    message(errorMessage(e));
                  } finally {
                    setSumming(false);
                  }
                }}
              >
                <Sparkles size={16} />
                {summing ? "Thinking…" : "Summarize my dashboard"}
                <ArrowUpRight size={16} />
              </button>
            ) : (
              <Link className="button light" href="/assistant">
                Ask my assistant
                <ArrowUpRight size={16} />
              </Link>
            )}
            <span className="ai-footnote">
              Grounded in your workspace. Always.
            </span>
          </section>
          <section className="card">
            <div className="panel-heading">
              <div>
                <h2>
                  {employee ? "Your leave balance" : "People by department"}
                </h2>
                <p>
                  {employee
                    ? "A little time for yourself."
                    : "Every team is part of the bigger picture."}
                </p>
              </div>
              <Link
                href={employee ? "/leave" : "/employees"}
                className="text-button"
              >
                View all
                <ArrowUpRight size={15} />
              </Link>
            </div>
            {employee ? (
              d.balance?.length ? (
                <div className="balance-list">
                  {d.balance.map((b: Row) => (
                    <div key={b._id}>
                      <span>{b.name}</span>
                      <strong>
                        {b.unpaid ? "Unlimited" : `${b.remaining} days`}
                      </strong>
                      <small>
                        {b.used} used · {b.reserved} pending
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No leave types configured"
                  body="Admin can add leave types and yearly quotas."
                />
              )
            ) : d.departments?.some((v: Row) => v.headcount) ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={d.departments}
                    layout="vertical"
                    margin={{ left: 12, right: 25 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#eef0ed" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="headcount"
                      fill="#6e9984"
                      radius={[0, 5, 5, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                title="A place for every team"
                body="Add departments and employees to see your organization take shape."
              />
            )}
          </section>
          <section className="card">
            <div className="panel-heading">
              <div>
                <h2>From your workspace</h2>
                <p>The latest news, for everyone.</p>
              </div>
              <Megaphone size={19} />
            </div>
            {(ann.data as Row[])?.length ? (
              <div className="announcement-list">
                {(ann.data as Row[]).slice(0, 3).map((a) => (
                  <article key={a._id}>
                    <span className="announcement-dot" />
                    <div>
                      <small>{dateLabel(a.createdAt)}</small>
                      <h3>{a.title}</h3>
                      <p>{a.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Quiet, in a good way"
                body="Company announcements will show up right here."
              />
            )}
            <Link className="card-bottom-link" href="/announcements">
              All announcements
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
        {!employee && (
          <div className="dashboard-grid equal">
            <section className="card">
              <div className="panel-heading">
                <div>
                  <h2>Attendance insights</h2>
                  <p>Small signals that help you plan ahead.</p>
                </div>
              </div>
              <div className="insight-stats">
                <div>
                  <strong>{d.pending || 0}</strong>
                  <span>Pending leave requests</span>
                </div>
                <div>
                  <strong>{d.absent || 0}</strong>
                  <span>Absent working days</span>
                </div>
                <div>
                  <strong>{d.latePercent || 0}%</strong>
                  <span>Late arrival rate</span>
                </div>
              </div>
              {d.lateComers?.length ? (
                <div className="simple-list">
                  {d.lateComers.map((e: Row) => (
                    <div key={e.name}>
                      <span>{e.name}</span>
                      <Badge>{`${e.count} late`}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted inset">No late arrivals in this period.</p>
              )}
            </section>
            <section className="card">
              <div className="panel-heading">
                <div>
                  <h2>
                    {user.role === "Admin"
                      ? "Recent activity"
                      : "Leave utilization"}
                  </h2>
                  <p>
                    {user.role === "Admin"
                      ? "An accountable workspace."
                      : "Approved days by leave type."}
                  </p>
                </div>
              </div>
              {user.role === "Admin" ? (
                d.audit?.length ? (
                  <div className="activity-list">
                    {d.audit.map((a: Row) => (
                      <div key={a._id}>
                        <span className="activity-dot" />
                        <div>
                          <strong>{a.actorName}</strong>
                          <p>
                            {a.action.replaceAll("_", " ")} · {a.entity}
                          </p>
                        </div>
                        <small>{dateLabel(a.createdAt)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="A clean slate"
                    body="Important actions will appear in the audit trail."
                  />
                )
              ) : d.leaveByType?.length ? (
                <div className="balance-list">
                  {d.leaveByType.map((l: Row) => (
                    <div key={l.name}>
                      <span>{l.name}</span>
                      <strong>{l.days} approved days</strong>
                      <small>{l.quota} days per employee / year</small>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Time off, organized"
                  body="Add leave types to start tracking utilization."
                />
              )}
            </section>
          </div>
        )}
        {!employee && (
          <AnalyticsDetails data={d} admin={user.role === "Admin"} />
        )}
      </DataState>
    </>
  );
}

const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const faceFixture = path.resolve(
  __dirname,
  "../../../backend/test/fixtures/obama.jpg",
);
const referencePhoto =
  "data:image/jpeg;base64," + fs.readFileSync(faceFixture).toString("base64");
const output = path.resolve(__dirname, "../../../tmp/qa");
fs.mkdirSync(output, { recursive: true });
const errors = [],
  checks = [];
async function api(ctx, method, url, data) {
  const r = await ctx.request.fetch("http://localhost:3000/api" + url, {
    method,
    data,
  });
  const json = await r.json();
  assert.ok(r.ok(), `${method} ${url}: ${r.status()} ${JSON.stringify(json)}`);
  return json;
}
async function widths(page, routes, role) {
  for (const width of [375, 1366, 1920]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1080 });
    for (const route of routes) {
      await page.goto("http://localhost:3000" + route);
      await page.locator(".loading").waitFor({ state: "hidden" });
      const over = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        over.scroll <= over.width,
        `${role} ${route} overflow at ${width}: ${over.scroll}`,
      );
      assert.equal(
        await page.locator(".error").count(),
        0,
        `${role} ${route} error`,
      );
      checks.push(`${role} ${route || "/"} ${width}px`);
      if (route === "/" || route === "/employees" || route === "/attendance")
        await page.screenshot({
          path: path.join(
            output,
            `${role.toLowerCase()}-${route.replaceAll("/", "") || "overview"}-${width}.png`,
          ),
          fullPage: true,
        });
    }
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const admin = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      page = await admin.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://localhost:3000");
    assert.ok(await page.getByText("Make space for your team.").count());
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: path.join(output, `setup-${width}.png`),
        fullPage: true,
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await page.getByLabel("Company name").fill("QA Workspace");
    await page.getByLabel("Your full name").fill("Avery Admin");
    await page.getByLabel("Email address").fill("qa-admin@example.test");
    await page.getByLabel("Password").fill("QaAdminPassword!2026");
    await page.getByRole("button", { name: "Create my workspace" }).click();
    await page.locator(".workspace").waitFor();
    const fresh = await api(admin, "GET", "/analytics");
    assert.equal(fresh.headcount, 0);
    assert.equal(fresh.payrollCost, 0);
    await widths(
      page,
      [
        "/",
        "/employees",
        "/attendance",
        "/leave",
        "/payroll",
        "/organization",
        "/users",
        "/audit",
        "/announcements",
        "/assistant",
      ],
      "Admin",
    );
    const dep = await api(admin, "POST", "/organization/departments", {
        name: "Product Engineering",
      }),
      des = await api(admin, "POST", "/organization/designations", {
        name: "Software Engineer",
      });
    await api(admin, "POST", "/organization/leave-types", {
      name: "Casual",
      quota: 10,
    });
    await api(admin, "POST", "/organization/leave-types", {
      name: "Sick",
      quota: 8,
    });
    await api(admin, "POST", "/organization/leave-types", {
      name: "Unpaid",
      quota: 0,
      unpaid: true,
    });
    await api(admin, "PATCH", "/settings", {
      weekends: [],
      officeStart: "09:00",
    });
    const hrLogin = await api(admin, "POST", "/users", {
      name: "Harper HR",
      email: "qa-hr@example.test",
    });
    const hr = await browser.newContext(),
      hp = await hr.newPage();
    hp.on("pageerror", (e) => errors.push(e.message));
    await hp.goto("http://localhost:3000");
    await hp.getByLabel("Email address").fill(hrLogin.user.email);
    await hp.getByLabel("Password").fill(hrLogin.temporaryPassword);
    await hp.getByRole("button", { name: "Sign in", exact: true }).click();
    await hp.getByLabel("Temporary password").fill(hrLogin.temporaryPassword);
    await hp.getByLabel("New password").fill("QaHrPassword!2026");
    await hp.getByRole("button", { name: "Set my password" }).click();
    await hp.locator(".workspace").waitFor();
    await hp.goto("http://localhost:3000/employees");
    await hp.getByRole("button", { name: "Add employee", exact: true }).click();
    await hp.getByLabel("Full name").fill("Ellis Employee");
    await hp.getByLabel("Employee code").fill("QA-001");
    await hp.getByLabel("Work email").fill("qa-employee@example.test");
    await hp
      .getByLabel("Joining date")
      .fill(new Date().toISOString().slice(0, 7) + "-01");
    await hp.getByRole("dialog").getByLabel("Department").selectOption(dep._id);
    await hp
      .getByRole("dialog")
      .getByLabel("Designation")
      .selectOption(des._id);
    await hp.getByLabel("Monthly basic salary").fill("60000");
    await hp
      .getByLabel("Attendance reference photo", { exact: true })
      .setInputFiles(faceFixture);
    await hp.getByRole("button", { name: "Create employee & login" }).click();
    await hp
      .getByRole("dialog", { name: "Their next chapter is ready" })
      .waitFor();
    const temp = await hp.locator(".credential-box code").innerText();
    await hp
      .getByRole("button", { name: "I’ve saved the credentials" })
      .click();
    await widths(
      hp,
      [
        "/",
        "/employees",
        "/attendance",
        "/leave",
        "/payroll",
        "/organization",
        "/announcements",
        "/assistant",
      ],
      "HR",
    );
    const emp = await browser.newContext(),
      ep = await emp.newPage();
    ep.on("pageerror", (e) => errors.push(e.message));
    await api(emp, "POST", "/auth/login", {
      email: "qa-employee@example.test",
      password: temp,
    });
    await api(emp, "POST", "/auth/password", {
      currentPassword: temp,
      password: "QaEmployeePassword!2026",
    });
    await ep.goto("http://localhost:3000/attendance");
    await ep.getByRole("button", { name: "Check in", exact: true }).click();
    await ep.getByRole("dialog", { name: "Camera check-in" }).waitFor();
    await ep.getByRole("button", { name: "Close dialog" }).click();
    await api(emp, "POST", "/attendance/check-in", {
      source: "camera",
      photo: referencePhoto,
    });
    await ep.reload();
    await ep.getByRole("button", { name: "Check out", exact: true }).waitFor();
    await ep.getByRole("button", { name: "Check out", exact: true }).click();
    await ep.getByRole("dialog", { name: "Camera check-out" }).waitFor();
    await ep.getByRole("button", { name: "Close dialog" }).click();
    await api(emp, "POST", "/attendance/check-out", {
      source: "camera",
      photo: referencePhoto,
    });
    await ep.reload();
    await ep.getByText("That’s a wrap. Nicely done.").waitFor();
    await widths(
      ep,
      [
        "/",
        "/employees",
        "/attendance",
        "/leave",
        "/payroll",
        "/announcements",
        "/assistant",
      ],
      "Employee",
    );
    await ep.goto("http://localhost:3000/employees");
    await ep.getByRole("button", { name: "View profile" }).click();
    await ep.getByLabel("Phone number").fill("+92 300 1234567");
    await ep.getByRole("button", { name: "Save profile" }).click();
    await ep.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(errors.length, 0, JSON.stringify(errors));
    fs.writeFileSync(
      path.join(output, "browser-report.json"),
      JSON.stringify({ checks, errors, passed: true }, null, 2),
    );
    console.log(
      JSON.stringify(
        { passed: true, checks: checks.length, errors, screenshots: output },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

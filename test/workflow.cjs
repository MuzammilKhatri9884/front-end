// Run after browser.cjs against its isolated preview database only.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];
  try {
    async function session(email, password) {
      const c = await browser.newContext();
      const r = await c.request.post("http://localhost:3000/api/auth/login", {
        data: { email, password },
      });
      assert.equal(r.status(), 200);
      const p = await c.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      return { c, p };
    }
    const emp = await session(
        "qa-employee@example.test",
        "QaEmployeePassword!2026",
      ),
      hr = await session("qa-hr@example.test", "QaHrPassword!2026"),
      admin = await session("qa-admin@example.test", "QaAdminPassword!2026");
    const policy = await (
      await emp.c.request.get("http://localhost:3000/api/policy")
    ).json();
    const casual = policy.leaveTypes.find((t) => t.name === "Casual");
    const start = new Date();
    start.setDate(start.getDate() + 3);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    await emp.p.goto("http://localhost:3000/leave");
    await emp.p
      .getByRole("button", { name: "Request time off", exact: true })
      .click();
    const form = emp.p.getByRole("dialog");
    await form.getByLabel("Leave type").selectOption(casual._id);
    await form.getByLabel("First day").fill(start.toISOString().slice(0, 10));
    await form.getByLabel("Last day").fill(end.toISOString().slice(0, 10));
    await form
      .getByLabel("Reason")
      .fill("Family wedding — browser workflow verification");
    await form.getByRole("button", { name: "Submit leave request" }).click();
    await form.waitFor({ state: "hidden" });
    await hr.p.goto("http://localhost:3000/leave");
    await hr.p.getByRole("button", { name: "Review", exact: true }).click();
    await hr.p.getByLabel("Decision").selectOption("approved");
    await hr.p
      .getByLabel("Review comment")
      .fill("Enjoy the time with your family.");
    await hr.p.getByRole("button", { name: "Confirm decision" }).click();
    await hr.p.getByRole("dialog").waitFor({ state: "hidden" });
    await hr.p.goto("http://localhost:3000/announcements");
    await hr.p.getByRole("button", { name: "Post announcement" }).click();
    await hr.p.getByLabel("Announcement title").fill("A thoughtful workspace");
    await hr.p
      .getByLabel("Your message")
      .fill("Welcome to your people workspace.");
    await hr.p.getByRole("button", { name: "Publish announcement" }).click();
    await hr.p.getByRole("dialog").waitFor({ state: "hidden" });
    await hr.p.goto("http://localhost:3000/payroll");
    await hr.p.getByRole("button", { name: "Prepare draft" }).click();
    await hr.p.locator("tbody .badge").filter({ hasText: "draft" }).waitFor();
    await hr.p.getByRole("button", { name: "View payslips" }).click();
    await hr.p.getByRole("dialog").waitFor();
    assert.ok(
      await hr.p.getByRole("dialog").getByText("Ellis Employee").count(),
    );
    await hr.p.getByRole("button", { name: "Close dialog" }).click();
    await admin.p.goto("http://localhost:3000/payroll");
    await admin.p
      .getByRole("button", { name: "Finalize", exact: true })
      .click();
    await admin.p
      .getByRole("button", { name: "Finalize & lock month" })
      .click();
    await admin.p.getByRole("dialog").waitFor({ state: "hidden" });
    await admin.p
      .locator("tbody .badge")
      .filter({ hasText: "finalized" })
      .waitFor();
    await emp.p.goto("http://localhost:3000/payroll");
    await emp.p.getByRole("button", { name: "View payslips" }).click();
    const link = emp.p.getByRole("link", { name: "Download payslip" });
    const pdf = await emp.c.request.get(
      "http://localhost:3000" + (await link.getAttribute("href")),
    );
    assert.equal(pdf.status(), 200);
    const buffer = await pdf.body();
    assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
    fs.writeFileSync(
      path.resolve(__dirname, "../../../tmp/qa/payslip.pdf"),
      buffer,
    );
    await emp.p.goto("http://localhost:3000/assistant");
    await emp.p
      .getByRole("button", { name: "How many sick leaves do I have left?" })
      .click();
    await emp.p.getByText(/AI is not configured yet/).waitFor();
    await emp.p.setViewportSize({ width: 375, height: 812 });
    await emp.p.goto("http://localhost:3000/payroll");
    await emp.p.locator(".loading").waitFor({ state: "hidden" });
    await emp.p.screenshot({
      path: path.resolve(__dirname, "../../../tmp/qa/employee-payroll-375.png"),
      fullPage: true,
    });
    assert.equal(errors.length, 0, JSON.stringify(errors));
    console.log(
      JSON.stringify(
        {
          passed: true,
          flows: [
            "Leave application",
            "HR approval",
            "Announcement publishing",
            "Payroll preparation",
            "Admin finalization",
            "Employee PDF download",
            "AI configuration fallback",
          ],
          browserErrors: errors,
        },
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

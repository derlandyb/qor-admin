import { test, expect, type Page } from "@playwright/test";

/**
 * AT23 — full MVP Core smoke test: register a venue -> (as Super Admin, a
 * separate browser context/session) approve the account -> (as the venue,
 * its own session) create + submit an event -> (as Super Admin) approve the
 * event -> confirm it's now visible via qor-api's public event list
 * (GET /api/v1/events).
 *
 * Runs exclusively via `make e2e-admin` (docker compose exec admin npx
 * playwright test) against the full `make up` stack — see playwright.config.ts
 * and root Makefile. Assumes AdminUserSeeder's known Super Admin
 * (superadmin@qor.dev / password, see api/database/seeders/AdminUserSeeder.php)
 * and GenreSeeder's genre id 1 (= "Rock", the first genre inserted on a
 * fresh seed) are present — run `docker compose exec api php artisan
 * migrate:fresh --seed` before this spec if the local DB isn't in that
 * known-fresh state.
 */

const SUPER_ADMIN = { email: "superadmin@qor.dev", password: "password" };
const RUN_ID = Date.now();
const VENUE_NAME = `Casa de Show E2E ${RUN_ID}`;
const VENUE_EMAIL = `venue-e2e-${RUN_ID}@qor.dev`;
const VENUE_PASSWORD = "Password123";
const EVENT_TITLE = `Show de Teste E2E ${RUN_ID}`;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("MVP Core: venue registration -> account approval -> event creation/submission -> event approval -> publicly visible", async ({
  browser,
  request,
}) => {
  // --- Step 1: register a venue (unauthenticated) ---
  const venueContext = await browser.newContext();
  const venuePage = await venueContext.newPage();

  await venuePage.goto("/cadastro/local");
  await venuePage
    .getByLabel(/li e aceito os termos de uso e a política de privacidade/i)
    .check();

  // exact:true throughout this block — "privacidade" (ConsentCapture's own
  // label, always present alongside this form) contains "cidade" as a
  // substring, and Playwright's default name/label match is substring.
  await venuePage.getByLabel("Nome", { exact: true }).fill(VENUE_NAME);
  await venuePage.getByLabel("Descrição", { exact: true }).fill("Local de teste criado pelo smoke test E2E.");
  await venuePage.getByLabel("Endereço", { exact: true }).fill("Rua de Teste, 123");
  await venuePage.getByLabel("Cidade", { exact: true }).selectOption({ label: "Vitória" });
  await venuePage.getByLabel("Telefone de contato", { exact: true }).fill("27999990000");
  await venuePage.getByLabel("E-mail de contato", { exact: true }).fill(VENUE_EMAIL);
  await venuePage.getByLabel("E-mail de cadastro", { exact: true }).fill(VENUE_EMAIL);
  await venuePage.getByLabel("Senha", { exact: true }).fill(VENUE_PASSWORD);
  // exact:true — otherwise this substring-matches ConsentCapture's own
  // "Li e aceito os termos de uso e a política de privacidade..." checkbox
  // too, since both are visible at once here (progressive disclosure, not
  // sequential unmount) and Playwright's default name match is substring.
  await venuePage.getByRole("checkbox", { name: "Aceito os termos de uso", exact: true }).check();
  await venuePage.getByRole("button", { name: "Cadastrar" }).click();

  await expect(venuePage.getByText("Cadastro enviado! Sua conta está em análise.")).toBeVisible();

  // --- Step 2: approve the venue account, as Super Admin (separate session) ---
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginAs(adminPage, SUPER_ADMIN.email, SUPER_ADMIN.password);

  await adminPage.goto("/aprovacoes/contas");
  const venueRow = adminPage.getByRole("row", { name: new RegExp(VENUE_NAME) });
  await expect(venueRow).toBeVisible();
  await venueRow.getByRole("button", { name: "Aprovar" }).click();
  await adminPage.getByRole("button", { name: "Confirmar" }).click();
  await expect(venueRow).not.toBeVisible();

  // --- Step 3: as the (now-approved) venue, create + submit an event ---
  await loginAs(venuePage, VENUE_EMAIL, VENUE_PASSWORD);

  await venuePage.goto("/eventos/novo");
  await venuePage.getByLabel("Título").fill(EVENT_TITLE);
  await venuePage.getByLabel("Descrição").fill("Evento de teste criado pelo smoke test E2E.");
  const startsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days out
  const startsAtLocal = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  await venuePage.getByLabel("Data e hora").fill(startsAtLocal);
  await venuePage.getByLabel("Gênero").fill("1");
  await venuePage.getByLabel("Evento gratuito").check();
  await venuePage.getByRole("button", { name: "Criar Evento" }).click();

  await expect(venuePage).toHaveURL(/\/eventos$/);
  const eventRow = venuePage.getByRole("row", { name: new RegExp(EVENT_TITLE) });
  await expect(eventRow).toBeVisible();
  await eventRow.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(eventRow.getByText("Em Revisão")).toBeVisible();

  // --- Step 4: approve the event, as Super Admin ---
  await adminPage.goto("/aprovacoes/eventos");
  const pendingEventRow = adminPage.getByRole("row", { name: new RegExp(EVENT_TITLE) });
  await expect(pendingEventRow).toBeVisible();
  await pendingEventRow.getByRole("button", { name: "Aprovar" }).click();
  await adminPage.getByRole("button", { name: "Confirmar" }).click();
  await expect(pendingEventRow).not.toBeVisible();

  // --- Step 5: confirm the event is now visible via the public endpoint ---
  const publicEvents = await request.get("http://api:8000/api/v1/events");
  expect(publicEvents.ok()).toBeTruthy();
  const body = (await publicEvents.json()) as { data: { title: string }[] };
  expect(body.data.some((event) => event.title === EVENT_TITLE)).toBe(true);

  await venueContext.close();
  await adminContext.close();
});

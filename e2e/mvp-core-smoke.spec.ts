import { expect, request, test } from "@playwright/test";
import { Client } from "pg";

/**
 * AT23 — MVP Core E2E smoke, run live against `docker compose up`
 * (admin + api + postgres + minio).
 *
 * Flow: register a venue (public, anonymous) -> as Super Admin (separate
 * browser context = separate session) approve the account -> as the venue
 * (separate context) create + submit an event -> as Super Admin approve
 * the event -> confirm it's visible via qor-api's public /api/v1/events.
 *
 * Prerequisites this spec assumes are already in place (documented, not
 * created by the spec itself — creating a Super Admin account has no admin
 * UI, per ADMIN's scope, so it's a one-time local/CI setup step):
 *   - `docker compose up -d` and `docker compose exec api php artisan
 *     migrate --seed` have been run.
 *   - A Super Admin admin_users row exists: email "super@qor.app",
 *     password "Senha1234", is_super_admin=true.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";
const SUPER_ADMIN_EMAIL = "super@qor.app";
const SUPER_ADMIN_PASSWORD = "Senha1234";

/**
 * There's no genres list endpoint (qor-api has none — Genre is a DB-backed
 * lookup, ARCHITECTURE.md §14.1 — EventForm's own comment notes this).
 * Genre ids aren't guaranteed to start at 1 (a long-lived dev DB's
 * sequence keeps climbing across reseeds), so this reads one real id
 * directly from Postgres rather than hardcoding a value the seeder
 * happened to produce once.
 */
async function fetchAnyGenreId(): Promise<number> {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://qor:qor@localhost:5432/qor" });
  await client.connect();
  try {
    const result = await client.query<{ id: number }>("SELECT id FROM genres ORDER BY id LIMIT 1");
    if (result.rows.length === 0) {
      throw new Error("No genres seeded — run `docker compose exec api php artisan db:seed`.");
    }
    return result.rows[0].id;
  } finally {
    await client.end();
  }
}

test("register venue -> approve account -> create+submit event -> approve event -> public visibility", async ({
  browser,
}) => {
  test.setTimeout(120_000); // multi-session flow against a real backend — default 30s is too tight
  const genreId = await fetchAnyGenreId();
  const unique = Date.now();
  const venueName = `Casa E2E ${unique}`;
  const venueLoginEmail = `venue-e2e-${unique}@example.com`;
  const venueContactEmail = `contato-e2e-${unique}@example.com`;
  const eventTitle = `Show E2E ${unique}`;

  // 1. Register a venue — public route, anonymous session.
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto("/cadastro/local");
  await anonPage.getByLabel("Nome").fill(venueName);
  await anonPage.getByLabel("Descrição").fill("Casa de shows para o smoke E2E.");
  await anonPage.getByLabel("Endereço").fill("Rua do Teste, 100");
  await anonPage.getByLabel("Cidade", { exact: true }).selectOption({ label: "Vitória" });
  await anonPage.getByLabel("Telefone de contato").fill("27999990000");
  await anonPage.getByLabel("E-mail de contato").fill(venueContactEmail);
  await anonPage.getByLabel("E-mail de cadastro").fill(venueLoginEmail);
  await anonPage.getByLabel("Senha").fill("Senha1234");
  await anonPage.getByLabel("Aceito os termos de uso").check();
  await anonPage.getByRole("button", { name: "Cadastrar" }).click();
  await expect(anonPage.getByText(/Cadastro enviado/)).toBeVisible();
  await anonContext.close();

  // 2. Super Admin session: approve the new account.
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto("/entrar");
  await adminPage.getByLabel("E-mail").fill(SUPER_ADMIN_EMAIL);
  await adminPage.getByLabel("Senha").fill(SUPER_ADMIN_PASSWORD);
  await adminPage.getByRole("button", { name: "Entrar" }).click();
  await adminPage.waitForURL(/\/dashboard/);

  await adminPage.goto("/aprovacoes/contas");
  const accountRow = adminPage.getByRole("row", { name: new RegExp(venueName) });
  await expect(accountRow).toBeVisible();
  await accountRow.getByRole("button", { name: "Aprovar" }).click();
  await adminPage.getByRole("dialog").getByRole("button", { name: "Aprovar" }).click();
  await expect(accountRow).not.toBeVisible();

  // 3. Venue session (separate context = separate session, per ADMIN-30's
  // guard isolation): create and submit an event.
  const venueContext = await browser.newContext();
  const venuePage = await venueContext.newPage();
  await venuePage.goto("/entrar");
  await venuePage.getByLabel("E-mail").fill(venueLoginEmail);
  await venuePage.getByLabel("Senha").fill("Senha1234");
  await venuePage.getByRole("button", { name: "Entrar" }).click();
  await venuePage.waitForURL(/\/dashboard/);

  await venuePage.goto("/eventos/novo");
  await venuePage.getByLabel("Título").fill(eventTitle);
  await venuePage.getByLabel("Descrição").fill("Evento criado pelo smoke E2E.");
  const startsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  await venuePage.getByLabel("Data de início").fill(startsAt);
  await venuePage.getByLabel("Cidade", { exact: true }).selectOption({ label: "Vitória" });
  await venuePage.getByLabel("Gênero (ID)").fill(String(genreId));
  await venuePage.getByLabel("Evento gratuito").check();
  await venuePage.getByRole("button", { name: "Criar evento" }).click();
  await venuePage.waitForURL(/\/eventos$/);

  const eventRow = venuePage.getByRole("row", { name: new RegExp(eventTitle) });
  await expect(eventRow).toBeVisible();
  await eventRow.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(eventRow.getByText("Em análise")).toBeVisible();
  await venueContext.close();

  // 4. Back to the Super Admin session: approve the event.
  await adminPage.goto("/aprovacoes/eventos");
  const pendingEventRow = adminPage.getByRole("row", { name: new RegExp(eventTitle) });
  await expect(pendingEventRow).toBeVisible();
  await pendingEventRow.getByRole("button", { name: "Aprovar" }).click();
  await adminPage.getByRole("dialog").getByRole("button", { name: "Aprovar" }).click();
  await expect(pendingEventRow).not.toBeVisible();
  await adminContext.close();

  // 5. Confirm the published event is visible via the public read side
  // (event-discovery's ListUpcomingEvents) — same Event row, two adapters.
  const apiContext = await request.newContext();
  const publicEvents = await apiContext.get(`${API_BASE_URL}/api/v1/events`);
  expect(publicEvents.ok()).toBeTruthy();
  const body = (await publicEvents.json()) as { data: { title: string }[] };
  expect(body.data.some((event) => event.title === eventTitle)).toBe(true);
});

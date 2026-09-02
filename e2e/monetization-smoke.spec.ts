import { test, expect, type Page } from "@playwright/test";

/**
 * AT34 — Monetization smoke test, extending AT23's MVP Core flow: approve a
 * new venue (confirms the free-plan Subscription auto-created on approval,
 * per api.md T100/AD-009), submit events up to the free plan's publish quota
 * (config('qor.billing.default_free_quota'), seeded to 5 by PlanSeeder —
 * confirms the usage counter increments), attempt a 6th (confirms the
 * at-limit gate blocks new event creation, AT31), then as Super Admin create
 * and edit a plan (AT30).
 *
 * Same preconditions as mvp-core-smoke.spec.ts: `docker compose exec api php
 * artisan migrate:fresh --seed` for a known-fresh DB (AdminUserSeeder's
 * Super Admin, GenreSeeder's genre id 1, PlanSeeder's default free plan).
 */

const SUPER_ADMIN = { email: "superadmin@qor.dev", password: "password" };
const RUN_ID = Date.now();
const VENUE_NAME = `Casa de Show Monetização E2E ${RUN_ID}`;
const VENUE_EMAIL = `venue-mon-e2e-${RUN_ID}@qor.dev`;
const VENUE_PASSWORD = "Password123";
const FREE_PLAN_QUOTA = 5;
const PLAN_NAME = `Pro E2E ${RUN_ID}`;
const PLAN_NAME_EDITED = `Pro E2E ${RUN_ID} Editado`;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

function eventStartsAtLocal(daysFromNow: number): string {
  const startsAt = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

async function createAndSubmitEvent(page: Page, title: string, daysFromNow: number) {
  await page.goto("/eventos/novo");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Descrição").fill("Evento de teste criado pelo smoke test de monetização.");
  await page.getByLabel("Data e hora").fill(eventStartsAtLocal(daysFromNow));
  await page.getByLabel("Gênero").fill("1");
  await page.getByLabel("Evento gratuito").check();
  await page.getByRole("button", { name: "Criar Evento" }).click();

  await expect(page).toHaveURL(/\/eventos$/);
  const eventRow = page.getByRole("row", { name: new RegExp(title) });
  await expect(eventRow).toBeVisible();
  await eventRow.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(eventRow.getByText("Em Revisão")).toBeVisible();
}

test("Monetization: free-plan auto-subscription -> quota increments on submit -> at-limit block -> Super Admin plan CRUD", async ({
  browser,
}) => {
  // --- Step 1: register a venue (unauthenticated) ---
  const venueContext = await browser.newContext();
  const venuePage = await venueContext.newPage();

  await venuePage.goto("/cadastro/local");
  await venuePage
    .getByLabel(/li e aceito os termos de uso e a política de privacidade/i)
    .check();
  await venuePage.getByLabel("Nome", { exact: true }).fill(VENUE_NAME);
  await venuePage
    .getByLabel("Descrição", { exact: true })
    .fill("Local de teste criado pelo smoke test de monetização.");
  await venuePage.getByLabel("Endereço", { exact: true }).fill("Rua de Teste, 456");
  await venuePage.getByLabel("Cidade", { exact: true }).selectOption({ label: "Vitória" });
  await venuePage.getByLabel("Telefone de contato", { exact: true }).fill("27999990001");
  await venuePage.getByLabel("E-mail de contato", { exact: true }).fill(VENUE_EMAIL);
  await venuePage.getByLabel("E-mail de cadastro", { exact: true }).fill(VENUE_EMAIL);
  await venuePage.getByLabel("Senha", { exact: true }).fill(VENUE_PASSWORD);
  await venuePage.getByRole("checkbox", { name: "Aceito os termos de uso", exact: true }).check();
  await venuePage.getByRole("button", { name: "Cadastrar" }).click();
  await expect(venuePage.getByText("Cadastro enviado! Sua conta está em análise.")).toBeVisible();

  // --- Step 2: approve the venue, as Super Admin — this auto-creates a
  // free-plan Subscription (api.md T100) ---
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginAs(adminPage, SUPER_ADMIN.email, SUPER_ADMIN.password);

  await adminPage.goto("/aprovacoes/contas");
  const venueRow = adminPage.getByRole("row", { name: new RegExp(VENUE_NAME) });
  await expect(venueRow).toBeVisible();
  await venueRow.getByRole("button", { name: "Aprovar" }).click();
  await adminPage.getByRole("button", { name: "Confirmar" }).click();
  await expect(venueRow).not.toBeVisible();

  // --- Step 3: as the venue, confirm the free plan and its full quota show
  // up on /assinatura before anything has been published ---
  await loginAs(venuePage, VENUE_EMAIL, VENUE_PASSWORD);
  await venuePage.goto("/assinatura");
  await expect(venuePage.getByText("Gratuito")).toBeVisible();
  await expect(venuePage.getByText(`0 de ${FREE_PLAN_QUOTA} publicações usadas este mês`)).toBeVisible();

  // --- Step 4: create + submit events up to the free plan's quota ---
  for (let i = 1; i <= FREE_PLAN_QUOTA; i++) {
    await createAndSubmitEvent(venuePage, `Show Monetização E2E ${RUN_ID} #${i}`, 30 + i);
  }

  await venuePage.goto("/assinatura");
  await expect(
    venuePage.getByText(`${FREE_PLAN_QUOTA} de ${FREE_PLAN_QUOTA} publicações usadas este mês`),
  ).toBeVisible();
  await expect(
    venuePage.getByText("Você atingiu o limite de publicações do seu plano"),
  ).toBeVisible();

  // --- Step 5: a 6th event is blocked up front by the at-limit gate ---
  await venuePage.goto("/eventos/novo");
  await expect(
    venuePage.getByText("Você atingiu o limite de publicações do seu plano"),
  ).toBeVisible();
  await expect(venuePage.getByLabel("Título")).not.toBeVisible();

  // --- Step 6: Super Admin creates and edits a plan ---
  await adminPage.goto("/planos");
  await adminPage.getByRole("button", { name: "Novo Plano" }).click();
  await expect(adminPage).toHaveURL(/\/planos\/novo$/);
  await adminPage.getByLabel("Nome").fill(PLAN_NAME);
  await adminPage.getByLabel("Preço mensal").fill("29.9");
  await adminPage.getByLabel("Cota de publicações mensais").fill("20");
  await adminPage.getByRole("button", { name: "Criar Plano" }).click();

  await expect(adminPage).toHaveURL(/\/planos$/);
  const planRow = adminPage.getByRole("row", { name: new RegExp(PLAN_NAME) });
  await expect(planRow).toBeVisible();

  await planRow.getByRole("button", { name: "Editar" }).click();
  await expect(adminPage).toHaveURL(/\/planos\/\d+\/editar$/);
  const nameInput = adminPage.getByLabel("Nome");
  await expect(nameInput).toHaveValue(PLAN_NAME);
  await nameInput.fill(PLAN_NAME_EDITED);
  await adminPage.getByRole("button", { name: "Salvar Alterações" }).click();

  await expect(adminPage).toHaveURL(/\/planos$/);
  await expect(adminPage.getByRole("row", { name: new RegExp(PLAN_NAME_EDITED) })).toBeVisible();

  await venueContext.close();
  await adminContext.close();
});

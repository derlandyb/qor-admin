import { expect, test } from "@playwright/test";
import { Client } from "pg";

/**
 * AT34 — Monetization P1 E2E smoke, run live against `docker compose up`.
 * Extends AT23's flow: approve a new venue (confirms the free-plan
 * Subscription auto-created per MON-04/qor-api T100), submit 5 events
 * (confirms the quota counter), submit a 6th (confirms the block +
 * error surfaced, MON-07/08), and as Super Admin create/edit a plan.
 *
 * Same prerequisite as mvp-core-smoke.spec.ts: a seeded Super Admin
 * account (super@qor.app / Senha1234, is_super_admin=true) — not created
 * by this spec.
 */

const SUPER_ADMIN_EMAIL = "super@qor.app";
const SUPER_ADMIN_PASSWORD = "Senha1234";

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

test("free-plan quota: approved venue can submit up to its quota, then is blocked", async ({ browser }) => {
  // 5 create+submit cycles against a real backend, each hitting a Next.js
  // dev-server route that may still need on-demand compilation.
  test.setTimeout(300_000);
  const genreId = await fetchAnyGenreId();
  const unique = Date.now();
  const venueName = `Casa Quota E2E ${unique}`;
  const venueLoginEmail = `venue-quota-e2e-${unique}@example.com`;

  // Register + Super Admin approval (same as mvp-core-smoke.spec.ts).
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto("/cadastro/local");
  await anonPage.getByLabel("Nome").fill(venueName);
  await anonPage.getByLabel("Descrição").fill("Casa de shows para o smoke de quota.");
  await anonPage.getByLabel("Endereço").fill("Rua da Quota, 1");
  await anonPage.getByLabel("Cidade", { exact: true }).selectOption({ label: "Vitória" });
  await anonPage.getByLabel("Telefone de contato").fill("27999990001");
  await anonPage.getByLabel("E-mail de contato").fill(`contato-quota-${unique}@example.com`);
  await anonPage.getByLabel("E-mail de cadastro").fill(venueLoginEmail);
  await anonPage.getByLabel("Senha").fill("Senha1234");
  await anonPage.getByLabel("Aceito os termos de uso").check();
  await anonPage.getByRole("button", { name: "Cadastrar" }).click();
  await expect(anonPage.getByText(/Cadastro enviado/)).toBeVisible();
  await anonContext.close();

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

  // Venue session: confirm the free plan's Subscription was auto-created
  // (MON-04/05) via /assinatura, then create + submit 5 events (the
  // seeded free plan's quota) and confirm the usage widget tracks it.
  const venueContext = await browser.newContext();
  const venuePage = await venueContext.newPage();
  await venuePage.goto("/entrar");
  await venuePage.getByLabel("E-mail").fill(venueLoginEmail);
  await venuePage.getByLabel("Senha").fill("Senha1234");
  await venuePage.getByRole("button", { name: "Entrar" }).click();
  await venuePage.waitForURL(/\/dashboard/);

  await venuePage.goto("/assinatura");
  await expect(venuePage.getByText("Gratuito")).toBeVisible();
  await expect(venuePage.getByText("0 de 5 publicações usadas este mês")).toBeVisible();

  async function createAndSubmitEvent(title: string) {
    await venuePage.goto("/eventos/novo");
    await venuePage.getByLabel("Título").fill(title);
    await venuePage.getByLabel("Descrição").fill("Evento do smoke de quota.");
    const startsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await venuePage.getByLabel("Data de início").fill(startsAt);
    await venuePage.getByLabel("Cidade", { exact: true }).selectOption({ label: "Vitória" });
    await venuePage.getByLabel("Gênero (ID)").fill(String(genreId));
    await venuePage.getByLabel("Evento gratuito").check();
    await venuePage.getByRole("button", { name: "Criar evento" }).click();
    await venuePage.waitForURL(/\/eventos$/);

    const row = venuePage.getByRole("row", { name: new RegExp(title) });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Enviar para revisão" }).click();
  }

  for (let i = 1; i <= 5; i += 1) {
    await createAndSubmitEvent(`Show Quota E2E ${unique} #${i}`);
    await expect(
      venuePage.getByRole("row", { name: new RegExp(`Show Quota E2E ${unique} #${i}`) }).getByText("Em análise"),
    ).toBeVisible();
  }

  await venuePage.goto("/assinatura");
  await expect(venuePage.getByText("5 de 5 publicações usadas este mês")).toBeVisible();
  await expect(venuePage.getByText("Limite de publicações atingido.")).toBeVisible();

  // 6th submission is blocked by CheckAndIncrementQuota (MON-07/08).
  await createAndSubmitEvent(`Show Quota E2E ${unique} #6`);
  await expect(venuePage.getByText(/atingiu o limite/i)).toBeVisible();
  await venueContext.close();

  // Super Admin session: create + edit a plan (MON-13-16).
  const planName = `Plano E2E ${unique}`;
  await adminPage.goto("/planos");
  await adminPage.getByRole("link", { name: "+ Novo Plano" }).click();
  await adminPage.getByLabel("Nome do plano").fill(planName);
  await adminPage.getByLabel("Preço mensal").fill("29.90");
  await adminPage.getByLabel("Cota de publicações").fill("15");
  await adminPage.getByRole("button", { name: "Criar plano" }).click();
  await adminPage.waitForURL(/\/planos$/);
  await expect(adminPage.getByRole("row", { name: new RegExp(planName) })).toBeVisible();

  await adminPage.getByRole("row", { name: new RegExp(planName) }).getByRole("link", { name: "Editar" }).click();
  await adminPage.getByLabel("Cota de publicações").fill("20");
  await adminPage.getByRole("button", { name: "Salvar alterações" }).click();
  await adminPage.waitForURL(/\/planos$/);
  await expect(adminPage.getByRole("row", { name: new RegExp(planName) }).getByText("20")).toBeVisible();
  await adminContext.close();
});

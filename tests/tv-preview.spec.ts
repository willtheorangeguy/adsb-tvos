import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('adsb.settings.v2')) localStorage.setItem('adsb.settings.v2', JSON.stringify({demo:true,mode:'direct',baseUrl:'http://piaware.local',pollMs:2000}));
  });
});

test("radar, remote navigation, watch alerts, saved sightings and QR sharing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("12 aircraft  ·  2s refresh")).toBeVisible();
  await page.getByRole("textbox", { name: "Search aircraft" }).fill("UAL1234");
  await expect(page.getByText("1 in range")).toBeVisible();
  await page.getByRole("textbox", { name: "Search aircraft" }).fill("");
  await page
    .getByRole("button", { name: "◎  Track aircraft", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "✓  Tracking aircraft" })
  ).toBeVisible();
  await page.getByRole("button", { name: "＋  Log sighting" }).click();
  await page.getByRole("button", { name: "◷  Sightings", exact: true }).click();
  await expect(page.getByText(/1 sightings · 1 unique aircraft/)).toBeVisible();
  await page
    .getByRole("button", { name: "Share UAL1234", exact: true })
    .click();
  await expect(page.getByText("Take this sighting with you.")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓  Save sighting" }).click();
  expect((await download).suggestedFilename()).toBe("sighting-A1B2C3.txt");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "☆  Tracked", exact: true }).click();
  await expect(page.getByText("☆  N12345", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.getByRole("textbox", { name: "Watch rule" }).fill("B738");
  await page.getByRole("button", { name: "＋  Add watch" }).click();
  await expect(page.getByText("☆  B738", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove B738", exact: true }).click();
  await expect(page.getByText("☆  B738", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "↗  Overhead", exact: true }).click();
  await expect(
    page.getByText("Overhead & approaching", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "◉  Coverage", exact: true }).click();
  await expect(
    page.getByText("Farthest currently received", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "◎  Radar", exact: true }).click();
  await page.getByRole("button", { name: "◎  Radar", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "↗  Overhead", exact: true })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Overhead & approaching", { exact: true })
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Your sky, right now.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "✓  Tracking aircraft" })
  ).toBeVisible();
  await page.getByRole("button", { name: "◷  Sightings", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete UAL1234 sighting", exact: true })
    .click();
  await expect(page.getByText("The next one is a keeper.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("local readsb feed discovery, missing metadata, persisted settings and disconnect", async ({
  page,
}) => {
  let failed = false;
  await page.route("http://receiver.test/**", async (route) => {
    const url = route.request().url();
    if (failed) {
      await route.fulfill({ status: 503, body: "offline" });
      return;
    }
    if (url.endsWith("/data/aircraft.json") && !url.includes("/skyaware/"))
      await route.fulfill({
        json: {
          now: Date.now() / 1000,
          aircraft: [
            {
              hex: "c01234",
              r: "C-GABC",
              t: "C172",
              lat: 53.5,
              lon: -113.5,
              gs: 110,
              track: 180,
              category: "A1",
              alt_baro: 4500,
              seen: 0,
            },
          ],
        },
      });
    else await route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "⚙  Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Local receiver", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Receiver address" })
    .fill("bad address");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(
    page.getByText("Enter a complete http:// or https:// receiver address.")
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Receiver address" })
    .fill("http://receiver.test");
  await page.getByRole("textbox", { name: "Receiver latitude" }).fill("53.55");
  await page
    .getByRole("textbox", { name: "Receiver longitude" })
    .fill("-113.5");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(
    page.getByText("●  RECEIVER CONNECTED", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("C-GABC", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Route not broadcast", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Operator not provided", { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("●  RECEIVER CONNECTED", { exact: true })
  ).toBeVisible();
  failed = true;
  await expect(page.getByText("○  DISCONNECTED", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText("○ STALE", { exact: true })).toBeVisible();
  failed = false;
  await expect(
    page.getByText("●  RECEIVER CONNECTED", { exact: true })
  ).toBeVisible({ timeout: 10000 });
});

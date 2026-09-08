import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('adsb.settings.v2')) localStorage.setItem('adsb.settings.v2', JSON.stringify({demo:true,onlineDetails:false,mode:'direct',baseUrl:'http://piaware.local',pollMs:2000}));
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

test('online aircraft identity, credited photo link, failure isolation and local-only setting', async ({page}) => {
  let photoFailure = false;
  const requests: string[] = [];
  await page.addInitScript(() => localStorage.setItem('adsb.settings.v2', JSON.stringify({demo:false,onlineDetails:true,mode:'direct',baseUrl:'http://receiver.test',pollMs:1000,latitude:51.09,longitude:-114.15})));
  await page.route('http://receiver.test/**', route => route.fulfill({json: route.request().url().endsWith('aircraft.json') ? {now: Date.now()/1000, aircraft: [{hex:'c07f47',flight:'WEN123',lat:51.1,lon:-114.1,alt_baro:8000,gs:200,seen:0,seen_pos:0}]} : {}}));
  await page.route('https://api.adsbdb.com/**', route => {
    requests.push(route.request().url());
    return route.fulfill({json:{response:{aircraft:{mode_s:'C07F47',registration:'C-GWFE',registered_owner:'WestJet Encore',manufacturer:'Bombardier',type:'DHC-8 402',icao_type:'DH8D',lat:0,altitudeFt:99999}}}});
  });
  await page.route('https://api.planespotters.net/**', route => {
    requests.push(route.request().url());
    return route.fulfill(photoFailure ? {status:503,body:'offline'} : {json:{photos:[{thumbnail_large:{src:'https://t.plnspttrs.net/test.jpg'},photographer:'Test Photographer',link:'https://www.planespotters.net/photo/123?utm_source=api'}]}});
  });
  await page.route('https://t.plnspttrs.net/**', route => route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280"><rect width="420" height="280" fill="#375349"/></svg>'}));
  await page.goto('/');
  await expect(page.getByText('WestJet Encore', {exact:true})).toBeVisible();
  await expect(page.getByText('Registered owner / operator · adsbdb', {exact:true})).toBeVisible();
  const link = page.getByRole('link', {name:'Open photo on Planespotters.net · © Test Photographer'});
  await expect(link).toHaveAttribute('href','https://www.planespotters.net/photo/123?utm_source=api');
  await expect(link.locator('img')).toBeVisible();
  await expect(page.getByText('8,000 ft', {exact:true}).last()).toBeVisible();
  await page.getByRole('button',{name:'＋  Log sighting'}).click();
  const saved = await page.evaluate(() => localStorage.getItem('adsb.sightings.v1'));
  expect(saved).not.toContain('plnspttrs');
  expect(saved).not.toContain('Test Photographer');
  await page.getByRole('button',{name:'⚙  Settings',exact:true}).click();
  await page.getByRole('button',{name:'Local only',exact:true}).click();
  await page.getByRole('button',{name:'Save settings'}).click();
  await expect(link).toHaveCount(0);
  const count = requests.length;
  await page.reload();
  await expect(page.getByText('Operator not provided', {exact:true})).toBeVisible();
  expect(requests).toHaveLength(count);
  photoFailure = true;
  await page.getByRole('button',{name:'⚙  Settings',exact:true}).click();
  await page.getByRole('button',{name:'Online details',exact:true}).click();
  await page.getByRole('button',{name:'Save settings'}).click();
  await expect(page.getByText('WestJet Encore', {exact:true})).toBeVisible();
  await expect(page.getByText('Some online details unavailable · Live receiver tracking continues')).toBeAttached();
  await expect(page.getByText('●  RECEIVER CONNECTED',{exact:true})).toBeVisible();
});

test('a delayed previous selection cannot overwrite the current aircraft details', async ({page}) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => {release = resolve;});
  await page.addInitScript(() => localStorage.setItem('adsb.settings.v2', JSON.stringify({demo:false,onlineDetails:true,mode:'direct',baseUrl:'http://receiver.test',pollMs:1000,latitude:51.09,longitude:-114.15})));
  await page.route('http://receiver.test/**', route => route.fulfill({json:route.request().url().endsWith('aircraft.json') ? {now:Date.now()/1000,aircraft:[{hex:'c07f47',flight:'FIRST1',lat:51.1,lon:-114.1,seen:0},{hex:'c080a3',flight:'SECOND2',lat:51.15,lon:-114.15,seen:0}]} : {}}));
  await page.route('https://api.planespotters.net/**', route => route.fulfill({json:{photos:[]}}));
  await page.route('https://api.adsbdb.com/**', async route => {
    const first=route.request().url().endsWith('C07F47');
    if(first) await held;
    await route.fulfill({json:{response:{aircraft:{mode_s:first?'C07F47':'C080A3',registered_owner:first?'Old owner':'Current owner'}}}});
  });
  const started = page.waitForRequest('https://api.adsbdb.com/v0/aircraft/C07F47');
  await page.goto('/');
  await started;
  await page.getByRole('button', {name:'View SECOND2',exact:true}).click();
  await expect(page.getByText('Current owner', {exact:true})).toBeVisible();
  const completed = page.waitForResponse('https://api.adsbdb.com/v0/aircraft/C07F47');
  release();
  await completed;
  await expect(page.getByText('Current owner', {exact:true})).toBeVisible();
  await expect(page.getByText('Old owner', {exact:true})).toHaveCount(0);
});

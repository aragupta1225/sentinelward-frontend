import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { navigateInApp, signIn } from './helpers'

const publicRoutes = [
  ['/', 'SentinelWard'],
  ['/login', 'Select a role'],
] as const

const protectedRoutes = [
  ['/ward', 'Live ward'],
  ['/bed/B08', 'Bed 8'],
  ['/census', 'Doctor / tele-ICU census'],
  ['/security', 'Security operations'],
  ['/incident/B08', 'Incident'],
  ['/incident/B08/report', 'CERT-In report draft'],
  ['/tickets', 'Biomedical tickets'],
  ['/briefing', 'Briefing and workload'],
  ['/log', 'Action log'],
  ['/demo', 'Demo control'],
  ['/telegram', 'Telegram message templates'],
] as const

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    })),
  ).toEqual([])
}

for (const [path, heading] of publicRoutes) {
  test(`${path} has no automated axe violations, including color contrast`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expectAccessible(page)
  })
}

for (const [path, heading] of protectedRoutes) {
  test(`${path} has no automated axe violations, including color contrast`, async ({ page }) => {
    await signIn(page, 'operator')
    await navigateInApp(page, path)
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(heading) })).toBeVisible()
    await expectAccessible(page)
  })
}

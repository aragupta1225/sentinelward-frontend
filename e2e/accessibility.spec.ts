import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { navigateInApp, signIn } from './helpers'

const publicRoutes = [
  ['/', 'SentinelWard'],
  ['/login', 'Select a role'],
] as const

const protectedRoutes = [
  ['/ward', 'Live ward', 'operator'],
  ['/bed/B08', 'Bed 8', 'nurse'],
  ['/alerts', 'Alerts and escalation', 'nurse'],
  ['/census', 'Doctor / tele-ICU census', 'operator'],
  ['/security', 'Security operations', 'operator'],
  ['/incident/B08', 'Incident', 'operator'],
  ['/incident/B08/report', 'CERT-In report draft', 'operator'],
  ['/tickets', 'Biomedical tickets', 'operator'],
  ['/briefing', 'Briefing and workload', 'operator'],
  ['/log', 'Action log', 'operator'],
  ['/demo', 'Demo control', 'operator'],
  ['/telegram', 'Telegram message templates', 'operator'],
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

for (const [path, heading, role] of protectedRoutes) {
  test(`${path} has no automated axe violations, including color contrast`, async ({ page }) => {
    await signIn(page, role)
    await navigateInApp(page, path)
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(heading) })).toBeVisible()
    await expectAccessible(page)
  })
}

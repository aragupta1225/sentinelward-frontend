import { expect, type Page } from '@playwright/test'

export type TestRole = 'nurse' | 'doctor' | 'it' | 'biomedical' | 'operator'

export async function signIn(page: Page, role: TestRole = 'operator') {
  await page.goto('/login')
  const labels: Record<TestRole, string> = { nurse: 'Central nurse', doctor: 'Doctor / tele-ICU', biomedical: 'Biomed', it: 'IT security', operator: 'System operator' }
  await page.getByRole('button', { name: new RegExp(`^${labels[role]}`) }).click()
  const homes: Record<TestRole, { path: string; heading: string }> = {
    nurse: { path: '/ward', heading: 'Live ward' }, doctor: { path: '/census', heading: 'Doctor / tele-ICU census' },
    it: { path: '/security', heading: 'Security operations' }, biomedical: { path: '/tickets', heading: 'Biomedical tickets' },
    operator: { path: '/demo', heading: 'Demo control' },
  }
  await expect(page).toHaveURL(new RegExp(`${homes[role].path}$`))
  await expect(page.getByRole('heading', { level: 1, name: homes[role].heading })).toBeVisible()
}

export async function navigateInApp(page: Page, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

import { expect, type Page } from '@playwright/test'

export type TestRole = 'nurse' | 'doctor' | 'it' | 'biomedical' | 'operator'

export async function signIn(page: Page, role: TestRole = 'operator') {
  await page.goto('/login')
  await page.getByLabel('Role').selectOption(role)
  await page.getByRole('button', { name: 'Continue to ward' }).click()
  await expect(page).toHaveURL(/\/ward$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Live ward' })).toBeVisible()
}

export async function navigateInApp(page: Page, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

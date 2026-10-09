import { expect, test } from '@playwright/test'
import { navigateInApp, signIn } from './helpers'

test('login applies role routing and protected-route rules', async ({ page }) => {
  await page.goto('/census')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Role').selectOption('doctor')
  await page.getByRole('button', { name: 'Continue to ward' }).click()
  await expect(page.getByRole('link', { name: 'Census' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Security' })).toHaveCount(0)

  await navigateInApp(page, '/security')
  await expect(page).toHaveURL(/\/ward$/)
})

test('Ward-to-Bed navigation restores keyboard focus to the originating tile', async ({ page }) => {
  await signIn(page, 'nurse')
  const bedTile = page.getByRole('link', { name: /Bed 3:/ })
  await bedTile.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/bed\/B03$/)

  await page.getByRole('button', { name: /Back to ward/ }).click()
  await expect(page).toHaveURL(/\/ward$/)
  await expect(bedTile).toBeFocused()
})

test('response acknowledgement remains separate from bedside confirmation', async ({ page }) => {
  await signIn(page, 'nurse')
  await navigateInApp(page, '/bed/B03')

  await page.getByRole('button', { name: 'On my way' }).click()
  await expect(page.getByRole('button', { name: /Recorded/ })).toBeDisabled()
  await expect(page.getByText('Awaiting bedside confirmation')).toBeVisible()

  await page.getByRole('button', { name: 'Patient NOT OK' }).click()
  await expect(page.getByText(/Patient NOT OK.*high alert active/)).toBeVisible()
  await expect(page.getByTestId('bed-tile').getByText('Clinical emergency', { exact: true })).toBeVisible()
})

test('device isolation can be undone without removing the original action', async ({ page }) => {
  await signIn(page, 'operator')
  await navigateInApp(page, '/bed/B07')

  await page.getByRole('button', { name: 'Request device isolation' }).click()
  await expect(page.getByText('Device isolated from the ward network.')).toBeVisible()
  await page.getByRole('button', { name: 'Undo isolation action' }).click()
  await expect(page.getByText('Device is not isolated.')).toBeVisible()

  await page.getByRole('button', { name: 'actions' }).click()
  await expect(page.getByText(/Device isolation requested/)).toBeVisible()
  await expect(page.getByText(/Isolation action .* undone/)).toBeVisible()
})

test('security incident moves through evidence, containment, and resolution', async ({ page }) => {
  await signIn(page, 'operator')
  await navigateInApp(page, '/incident/B07')
  await expect(page.getByText('OPEN', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Capture evidence snapshot' }).click()
  await expect(page.getByText(/EV-11/)).toBeVisible()
  await page.getByRole('button', { name: 'Contain and isolate device' }).click()
  await expect(page.getByText('CONTAINED', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mark incident resolved' }).click()
  await expect(page.getByText('RESOLVED', { exact: true })).toBeVisible()
  await expect(page.getByText(/Resolving an incident does not automatically restore device trust/)).toBeVisible()
})

test('keyboard, alert discoverability, live regions, and reduced motion hold at each target viewport @responsive', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await signIn(page, 'operator')

  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(horizontalOverflow).toBeLessThanOrEqual(1)

  const firstTile = page.getByRole('link', { name: /Bed 1:/ })
  await firstTile.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('link', { name: /Bed 2:/ })).toBeFocused()

  const assertiveRegion = page.locator('[aria-live="assertive"]')
  await expect(assertiveRegion).toHaveText('')
  await page.waitForTimeout(1_100)
  await expect(assertiveRegion).toHaveText('')
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)

  if ((viewport?.width ?? 0) <= 900) {
    const mobileAlerts = page.getByRole('button', { name: /Alerts .* high priority/ })
    await expect(mobileAlerts).toBeVisible()
    await mobileAlerts.click()
    await expect(page.getByRole('button', { name: /Active alerts .* high/ })).toBeVisible()
  } else {
    const alerts = page.getByRole('button', { name: /Active alerts .* high/ })
    await alerts.click()
    await expect(alerts).toBeVisible()
    await expect(alerts).toContainText('high')
  }
})

import { expect, test } from '@playwright/test'
import { navigateInApp, signIn } from './helpers'

test('login applies role routing and protected-route rules', async ({ page }) => {
  await page.goto('/census')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Role').selectOption('doctor')
  await page.getByRole('button', { name: 'Continue as Doctor / tele-ICU' }).click()
  await expect(page).toHaveURL(/\/census$/)
  await expect(page.getByRole('link', { name: 'Census' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Security' })).toHaveCount(0)

  await navigateInApp(page, '/security')
  await expect(page).toHaveURL(/\/census$/)
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

test('Ward privacy, stopped-alarm summary, and global high-alert strip follow S2', async ({ page }) => {
  await signIn(page, 'nurse')
  await expect(page.getByText(/high-priority alarms/)).toBeVisible()
  await expect(page.getByText('Alarms stopped today')).toBeVisible()
  await expect(page.getByText('37', { exact: true })).toBeVisible()

  const bed = page.getByRole('link', { name: /Bed 3:/ })
  await expect(bed).toContainText('NS, age 72')
  await expect(bed).not.toContainText('N. Singh')
  await page.getByLabel('Hide names').uncheck()
  await expect(bed).toContainText('N. Singh, age 72')
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

test('alerts escalate through the nurse ladder and acknowledgement edits the same message', async ({ page }) => {
  await signIn(page, 'nurse')
  await navigateInApp(page, '/alerts')
  await expect(page.getByRole('heading', { level: 1, name: 'Alerts and escalation' })).toBeVisible()

  const row = page.getByRole('row').filter({ hasText: 'Bed 3' })
  await expect(row).toContainText('Nurse Ravi')
  await row.getByRole('button', { name: 'View details' }).click()
  await expect(page.getByRole('heading', { name: 'Three-step response ladder' })).toBeVisible()
  await expect(page.getByText('All nurses + doctor')).toBeVisible()
  await page.getByRole('button', { name: 'Acknowledge alert' }).click()
  await expect(page.getByText(/Acknowledged by Nurse at/)).toBeVisible()
  await expect(page.getByText(/✅ Acknowledged by Nurse/)).toBeVisible()

  await page.getByRole('button', { name: /Acknowledged/ }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Bed 3' })).toBeVisible()
})

test('Bed Detail explains the verdict and records an untrusted hand check', async ({ page }) => {
  await signIn(page, 'nurse')
  await navigateInApp(page, '/bed/B07')

  await expect(page.getByRole('heading', { name: 'Monitor cannot be trusted' })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(6)
  await expect(page.getByRole('heading', { name: 'Two witnesses' })).toBeVisible()
  await expect(page.getByText('incoming (not trusted)')).toBeVisible()

  await page.getByLabel('Heart rate').fill('82')
  await page.getByLabel('SpO₂ by portable device').fill('97')
  await page.getByLabel('Notes').fill('Pulse regular')
  await page.getByRole('button', { name: 'Record hand check' }).click()
  await expect(page.getByText(/Latest: HR 82, SpO₂ 97/)).toBeVisible()
  await expect(page.getByText('incoming (not trusted)')).toBeVisible()
})

test('device isolation can be undone without removing the original action', async ({ page }) => {
  await signIn(page, 'it')
  await navigateInApp(page, '/bed/B08')

  await expect(page.getByText('Device isolated from the ward network.')).toBeVisible()
  await page.getByRole('button', { name: 'Undo isolation action' }).click()
  await expect(page.getByText('Device is not isolated.')).toBeVisible()

  await page.getByRole('button', { name: 'actions' }).click()
  await expect(page.getByText(/Compromised device isolated automatically/)).toBeVisible()
  await expect(page.getByText(/Isolation action .* undone/)).toBeVisible()
})

test('security incident moves through evidence, containment, and resolution', async ({ page }) => {
  await signIn(page, 'it')
  await navigateInApp(page, '/incident/B07')
  await expect(page.getByText('OPEN', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Capture evidence snapshot' }).click()
  await expect(page.getByText('EV-11 captured and fingerprinted')).toBeVisible()
  await page.getByRole('button', { name: 'Contain and isolate device' }).click()
  await expect(page.getByText('CONTAINED', { exact: true })).toBeVisible()
  await page.getByLabel('Reason for closing incident').fill('Evidence reviewed and device contained')
  await page.getByRole('button', { name: 'Close incident' }).click()
  await expect(page.getByText('RESOLVED', { exact: true })).toBeVisible()
  await expect(page.getByText(/Closing an incident does not restore device trust/)).toBeVisible()
})

test('IT inventory, evidence, and human-controlled report workflow follow S6-S8', async ({ page }) => {
  await signIn(page, 'it')
  await expect(page.getByRole('heading', { name: 'Device inventory' })).toBeVisible()
  await page.getByRole('button', { name: /Fleet hunt/ }).click()
  await expect(page.getByText(/Fleet hunt: watching/)).toBeVisible()
  await page.getByRole('button', { name: 'MON-07' }).click()
  await expect(page.getByRole('heading', { name: /Network witness · MON-07/ })).toBeVisible()

  await navigateInApp(page, '/incident/B07')
  await expect(page.getByRole('heading', { name: 'Incident timeline' })).toBeVisible()
  await expect(page.getByText(/SHA-256/).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Download' }).first()).toHaveAttribute('download')
  await page.getByRole('link', { name: 'Draft CERT-In report' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'CERT-In report draft' })).toBeVisible()

  const markSent = page.getByRole('button', { name: 'Mark as sent by me' })
  await expect(markSent).toBeDisabled()
  await page.getByLabel('Facts checked').check()
  await page.getByLabel('Evidence attached').check()
  await page.getByLabel('Approver').fill('Antara Gupta')
  await expect(markSent).toBeEnabled()
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText(/Saved/)).toBeVisible()
  await markSent.click()
  await expect(page.getByText(/Sent recorded by Antara Gupta/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('download', /\.pdf$/)
})

test('keyboard, alert discoverability, live regions, and reduced motion hold at each target viewport @responsive', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await signIn(page, 'nurse')

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

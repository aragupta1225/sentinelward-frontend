import { expect, test } from '@playwright/test'
import { navigateInApp, signIn } from './helpers'

test('login applies role routing and protected-route rules', async ({ page }) => {
  await page.goto('/census')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole('button', { name: /^Doctor \/ tele-ICU/ }).click()
  await expect(page).toHaveURL(/\/census$/)
  await expect(page.getByRole('link', { name: 'Census' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Security' })).toHaveCount(0)

  await navigateInApp(page, '/security')
  await expect(page).toHaveURL(/\/census$/)
})

test('public landing and development session follow S0-S1', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Patient, Sensor, or Hacker?' })).toBeVisible()
  await expect(page.locator('.landing-bed')).toHaveCount(4)
  await expect(page.locator('.landing-bed--high')).toHaveCount(1)
  for (const label of ['Real emergency', 'Loose / drifting sensor', 'Hacker']) await expect(page.getByText(label, { exact: true })).toBeVisible()
  await expect(page.getByText(/Team TessNova · IBM Z Datathon 2026/)).toBeVisible()
  await page.getByRole('link', { name: 'Open the live ward' }).click()
  await expect(page).toHaveURL(/\/login\?role=nurse$/)
  const nurse = page.getByRole('button', { name: /^Central nurse/ })
  await expect(nurse).toContainText('Pre-selected')
  await nurse.click()
  await expect(page).toHaveURL(/\/ward$/)
  await page.reload()
  await expect(page).toHaveURL(/\/ward$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Live ward' })).toBeVisible()
  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
})

test('doctor census follows S5 trust, bedside-check, escalation, and call-nurse rules', async ({ page }) => {
  await signIn(page, 'doctor')
  await expect(page.getByRole('heading', { level: 1, name: 'Doctor / tele-ICU census' })).toBeVisible()
  for (const heading of ['Bed', 'Patient', 'Verdict', 'Trust', 'HR', 'SpO₂', 'BP', 'Last bedside check', 'Escalated to me']) {
    await expect(page.getByRole('columnheader', { name: heading, exact: true })).toBeVisible()
  }
  const trustWarning = page.locator('.census-trust-warning')
  await expect(trustWarning).toContainText("beds' data can't be trusted")
  await expect(trustWarning).toContainText("Don't act on its numbers without a bedside check.")

  const rows = page.locator('.data-table tbody tr')
  await expect(rows.nth(0)).toContainText('Bed 8')
  await expect(rows.nth(1)).toContainText('Bed 3')
  const untrustedRow = page.getByRole('row').filter({ hasText: 'Bed 7' })
  await expect(untrustedRow).toContainText('UNTRUSTED')
  await expect(untrustedRow).toContainText('Last trusted')
  await untrustedRow.getByRole('button', { name: 'Call bedside nurse' }).click()
  await expect(untrustedRow.getByRole('button', { name: /Nurse called/ })).toBeDisabled()
  await untrustedRow.getByRole('button', { name: 'Open read-only' }).click()
  await expect(page).toHaveURL(/\/bed\/B07$/)
  await expect(page.getByRole('button', { name: 'Patient OK' })).toHaveCount(0)
})

test('biomedical ticket board follows S9 status, repair, and repeat-device rules', async ({ page }) => {
  await signIn(page, 'biomedical')
  for (const heading of ['New', 'In progress', 'Done', 'Devices with repeat problems']) await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  const ticket = page.locator('.ticket-card').filter({ hasText: 'BIO-104' })
  await expect(ticket).toContainText('MON-04 · B04')
  await expect(ticket).toContainText('Suggested fix')
  await expect(ticket).toContainText('times this device had issues (30 days)')
  await ticket.getByLabel('Work note').fill('Leads reseated; cable inspection started')
  await ticket.getByRole('button', { name: 'Start work' }).click()
  await expect(page.locator('.ticket-column').filter({ hasText: /^In progress/ })).toContainText('BIO-104')
  await expect(page.locator('.repeat-devices')).toContainText('MON-05')
})

test('shift briefing and workload follow the S10 handover rules', async ({ page }) => {
  await signIn(page, 'nurse')
  await navigateInApp(page, '/briefing')
  await expect(page.getByRole('heading', { level: 1, name: 'Shift briefing and workload' })).toBeVisible()
  await expect(page.getByText('AI-written handover · IBM Granite')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Since 08:00' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Blind Time per bed' })).toBeVisible()
  await expect(page.getByText('B07', { exact: true })).toBeVisible()
  await expect(page.getByText('6 minutes without trusted data')).toBeVisible()

  await page.getByRole('tab', { name: 'Workload' }).click()
  await expect(page.getByRole('heading', { name: 'Alarms received in the last 2 h' })).toBeVisible()
  await expect(page.getByText('Warning threshold: 40')).toBeVisible()
  const priya = page.locator('.workload-row').filter({ hasText: 'Nurse Priya' })
  await expect(priya).toContainText('46')
  await expect(priya).toContainText('Workload warning · 40+ alarms')
  await expect(page.locator('.workload-warning')).toHaveCount(2)
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

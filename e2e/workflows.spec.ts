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
  await expect(page.locator('.landing-bed__signal path')).toHaveCount(8)
  const landingNavigation = page.getByRole('navigation', { name: 'Landing sections' })
  await expect(landingNavigation.getByRole('link')).toHaveCount(3)
  await expect(page.locator('.topbar')).toHaveCSS('position', 'sticky')
  await landingNavigation.getByRole('link', { name: 'Safety' }).click()
  await expect(page).toHaveURL(/#safety$/)
  await expect(page.locator('#safety')).toHaveClass(/is-visible/)
  for (const label of ['Real emergency', 'Loose or drifting sensor', 'Compromised device']) await expect(page.getByText(label, { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Doubtful data never makes the ward go dark.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'One event. Five role views.' })).toBeVisible()
  await expect(page.getByLabel('One bed high alarm shared across five SentinelWard roles')).toContainText('Bed · High alarm')
  await expect(page.getByText('Clinical clarity across every monitored bed.')).toBeVisible()
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
  await page.getByRole('link', { name: 'Back to SentinelWard home' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Patient, Sensor, or Hacker?' })).toBeVisible()
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

test('action log search, filters, and IT-only undo follow S11', async ({ page }) => {
  await signIn(page, 'it')
  await navigateInApp(page, '/log')
  for (const heading of ['Time', 'Agent or person', 'Action', 'Bed / device', 'Approved by', 'Undo']) await expect(page.getByRole('columnheader', { name: heading, exact: true })).toBeVisible()

  await page.getByLabel('Search actions').fill('evidence')
  await expect(page.getByRole('row').filter({ hasText: 'Incident evidence snapshot' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'High clinical alert' })).toHaveCount(0)

  await page.getByLabel('Search actions').fill('')
  await page.getByLabel('Filter').selectOption('undoable')
  const isolation = page.getByRole('row').filter({ hasText: 'Compromised device isolated automatically' })
  await expect(isolation).toContainText('B08 / MON-08')
  await isolation.getByRole('button', { name: 'Undo' }).click()
  await expect(isolation).toContainText('Undone · log-undo-')
  await expect(isolation.getByRole('button', { name: 'Undo' })).toHaveCount(0)
})

test('operator demo controls follow the complete S12 scenario and playback rules', async ({ page }) => {
  await signIn(page, 'operator')
  for (const scenario of ['Full ward script (12 min)', 'Real emergency only', 'Loose sensor', 'Drift', 'Replay attack', 'Fake flatline', 'Flood']) await expect(page.locator('.scenario-grid').getByText(scenario, { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Full ward script (12 min)' })).toBeVisible()
  await expect(page.getByText('Live timeline · what will happen when')).toBeVisible()

  await page.getByRole('radio', { name: /^Real emergency only/ }).check()
  await page.getByRole('button', { name: '5×' }).click()
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText(/running · 0:0\d · 5×/)).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByText(/paused · 0:0\d · 5×/)).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByText(/running · 0:0\d · 5×/)).toBeVisible()
  await page.getByRole('button', { name: 'Reset ward' }).click()
  await expect(page.getByText('idle · 0:00 · 5×')).toBeVisible()
})

test('Telegram templates keep exact limits, waveform, same-message edits, and repeat merging', async ({ page }) => {
  await signIn(page, 'nurse')
  await navigateInApp(page, '/telegram')
  await expect(page.getByTestId('telegram-message')).toHaveCount(8)
  await expect(page.getByText(/At most 1 message per second per chat/)).toBeVisible()
  const emergency = page.getByTestId('telegram-message').filter({ hasText: 'Real emergency' })
  await expect(emergency.getByRole('img', { name: '12-second ECG and PPG waveform snapshot' })).toBeVisible()
  await expect(emergency).toContainText('caption 112/1024 characters')

  await emergency.getByRole('button', { name: 'On my way' }).click()
  await expect(page.getByTestId('telegram-message')).toHaveCount(8)
  await expect(emergency).toContainText('Acknowledged by Antara Gupta')

  const untrusted = page.getByTestId('telegram-message').filter({ hasText: 'Untrusted (tampering)' })
  await untrusted.getByRole('button', { name: 'Patient NOT OK' }).click()
  await expect(untrusted).toContainText('high clinical alert remains active')
  await navigateInApp(page, '/bed/B07')
  await expect(page.getByText(/Patient NOT OK.*high alert active/)).toBeVisible()
  await navigateInApp(page, '/telegram')

  await emergency.getByRole('button', { name: 'Simulate repeat' }).click()
  await emergency.getByRole('button', { name: 'Simulate repeat' }).click()
  await expect(emergency).toContainText('2 repeats queued as one edit')
  await expect(emergency).toContainText('2 repeats merged into this message', { timeout: 2_500 })
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
  expect(await page.locator('.topbar').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(7, 30, 125)')
  expect(await page.locator('.global-high-alert').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(16, 25, 54)')
  expect(await page.locator('.global-high-alert strong').evaluate((element) => getComputedStyle(element).color)).toBe('rgb(255, 194, 196)')
  const wardIntro = page.locator('.ward-page--concept .ui-page-header')
  expect(await wardIntro.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe('none')
  expect(await page.locator('.ward-console').evaluate((consoleElement) => {
    const intro = document.querySelector('.ward-page--concept .ui-page-header')
    return intro ? Math.round(consoleElement.getBoundingClientRect().top - intro.getBoundingClientRect().bottom) : Number.POSITIVE_INFINITY
  })).toBeLessThanOrEqual(20)
  await expect(page.getByText(/high-priority alarms/)).toBeVisible()
  await expect(page.getByText('Alarms stopped today')).toBeVisible()
  await expect(page.getByText('37', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return ['--alarm-high', '--alarm-med', '--alarm-low', '--accent'].map((token) => style.getPropertyValue(token).trim())
  })).toEqual(['#ff4d4f', '#ffd166', '#22d3ee', '#4a90e2'])
  expect(await page.locator('.bed-tile--high').first().evaluate((element) => getComputedStyle(element).animationDuration)).toBe('0.5s')
  expect(await page.locator('.bed-tile--medium').first().evaluate((element) => getComputedStyle(element).animationDuration)).toBe('1.5s')
  expect(await page.locator('.bed-tile--low').first().evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  const tileHeights = await page.locator('.bed-tile--compact').evaluateAll((tiles) => tiles.map((tile) => Math.round(tile.getBoundingClientRect().height)))
  expect(tileHeights).toHaveLength(12)
  expect(new Set(tileHeights).size).toBe(1)
  expect(await page.locator('.bed-tile--compact').first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(248, 251, 255)')
  expect(await page.locator('.bed-tile--compact .waveform').first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(7, 23, 37)')
  const activeNav = page.locator('.primary-nav a.active')
  expect(await activeNav.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  expect(await activeNav.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('0px')
  expect(await activeNav.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('0')
  await activeNav.hover()
  expect(await activeNav.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none')
  await expect.poll(() => activeNav.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('1')
  await page.getByRole('heading', { level: 1, name: 'Live ward' }).hover()
  await expect.poll(() => activeNav.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  await expect.poll(() => activeNav.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('0')

  const bed = page.getByRole('link', { name: /Bed 3:/ })
  await expect(bed).toContainText('NS, age 72')
  await expect(bed).not.toContainText('N. Singh')
  await page.getByLabel('Hide names').uncheck()
  await expect(bed).toContainText('N. Singh, age 72')
  await navigateInApp(page, '/alerts')
  await expect(page.getByRole('heading', { level: 1, name: 'Alerts and escalation' })).toBeVisible()
  expect(await page.locator('.topbar').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(7, 30, 125)')
  expect(await page.locator('.operational-page .ui-page-header').evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe('none')
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
  const firstVitals = page.locator('[data-testid="bed-tile"]').first().locator('.vitals > div')
  for (const index of [0, 1]) {
    const vital = firstVitals.nth(index)
    expect(Number.parseFloat(await vital.locator('strong').evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(40)
    expect(await vital.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  }

  const firstTile = page.getByRole('link', { name: /Bed 1:/ })
  await firstTile.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('link', { name: /Bed 2:/ })).toBeFocused()

  const assertiveRegion = page.locator('[aria-live="assertive"]')
  await expect(assertiveRegion).toHaveText('')
  await page.waitForTimeout(1_100)
  await expect(assertiveRegion).toHaveText('')
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  for (const priority of ['high', 'medium']) {
    const tile = page.locator(`.bed-tile--${priority}`).first()
    await expect(tile).toBeVisible()
    expect(await tile.evaluate((element) => ({ animationName: getComputedStyle(element).animationName, borderTopWidth: getComputedStyle(element).borderTopWidth }))).toEqual({ animationName: 'none', borderTopWidth: '8px' })
  }

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

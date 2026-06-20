import { expect, test, type Page } from '@playwright/test'
import { Buffer } from 'node:buffer'

type PageWithRuntimeErrors = Page & {
  runtimeErrors?: string[]
}

const today = new Date().toISOString().slice(0, 10)
const compactToday = today.replace(/-/g, '')
const syncedCalendarIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//xoperator//E2E//EN
BEGIN:VEVENT
UID:external-sync
DTSTART;VALUE=DATE:${compactToday}
DTEND;VALUE=DATE:${compactToday}
SUMMARY:External Demo Sync
URL:https://calendar.example/event
END:VEVENT
END:VCALENDAR`
const importedCalendarIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//xoperator//E2E//EN
BEGIN:VEVENT
UID:external-import
DTSTART:${compactToday}T180000Z
DTEND:${compactToday}T190000Z
SUMMARY:Imported Demo Review
LOCATION:Zoom
END:VEVENT
END:VCALENDAR`

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.indexedDB.deleteDatabase('owo-os-media')
  })

  const runtimeErrors: string[] = []
  const pageWithErrors = page as PageWithRuntimeErrors
  pageWithErrors.runtimeErrors = runtimeErrors

  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().includes('Failed to load resource: the server responded with a status of 500')) return
    runtimeErrors.push(message.text())
  })
})

test.afterEach(async ({ page }) => {
  const pageWithErrors = page as PageWithRuntimeErrors
  expect(pageWithErrors.runtimeErrors ?? []).toEqual([])
})

test('all primary pages render from the shell', async ({ page }) => {
  const routes = [
    { path: '/#/', heading: /things need you today/i },
    { path: '/#/projects', heading: 'Projects' },
    { path: '/#/pipeline', heading: 'Pipeline' },
    { path: '/#/network', heading: 'Network' },
    { path: '/#/docs', heading: 'Docs' },
    { path: '/#/calendar', heading: /^Calendar$/ },
    { path: '/#/capital', heading: 'Capital' },
    { path: '/#/customize', heading: 'Customize' },
    { path: '/#/how-it-works', heading: 'How it works' },
  ]

  for (const route of routes) {
    await page.goto(route.path)
    await expect(page.getByText('xoperator')).toBeVisible()
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
  }
})

test('core CTAs create, validate, update, and navigate across modules', async ({ page }) => {
  await page.goto('/#/projects')
  await page.getByRole('button', { name: 'Add project' }).click()
  await expect(page.getByText('Name the project before adding it.')).toBeVisible()
  await page.getByPlaceholder('New project name').fill('QA Build')
  await page.getByRole('button', { name: 'Add project' }).click()
  await page.getByRole('link', { name: /QA Build/ }).click()
  await expect(page.getByRole('heading', { name: 'QA Build' })).toBeVisible()

  await page.getByRole('button', { name: 'Build log' }).click()
  await expect(page.getByRole('button', { name: 'Save build entry' })).toBeDisabled()
  await page.getByPlaceholder('Drop the update here...').fill('Bench test passed.')
  await page.getByRole('button', { name: 'Save build entry' }).click()
  await expect(page.getByText('Bench test passed.')).toBeVisible()

  await page.getByRole('button', { name: 'Artifacts' }).click()
  await page.getByRole('button', { name: 'Add artifact' }).click()
  await expect(page.getByText('Add a name, link, or file before saving an artifact.')).toBeVisible()
  await page.getByPlaceholder('Artifact name').fill('QA schematic')
  await page.getByRole('button', { name: 'Add artifact' }).click()
  await expect(page.getByText('QA schematic')).toBeVisible()

  await page.getByRole('button', { name: 'Actions' }).click()
  await page.getByRole('button', { name: 'Add task' }).click()
  await expect(page.getByText('Name the task before adding it.')).toBeVisible()
  await page.getByPlaceholder('Task name').fill('QA launch checklist')
  await page.locator('input[type="date"]').last().fill(today)
  await page.getByRole('button', { name: 'Add task' }).click()
  await expect(page.getByText('QA launch checklist')).toBeVisible()
  await page.getByRole('checkbox', { name: 'QA launch checklist' }).check()
  await expect(page.getByRole('checkbox', { name: 'QA launch checklist' })).toBeChecked()

  await page.goto('/#/pipeline')
  await page.getByRole('button', { name: 'Add opportunity' }).click()
  await expect(page.getByText('Name the opportunity before adding it.')).toBeVisible()
  await page.getByPlaceholder('Opportunity name').fill('QA Grant')
  await page.getByRole('button', { name: 'Add opportunity' }).click()
  await expect(page.getByText('QA Grant')).toBeVisible()
  await page.getByRole('button', { name: 'List' }).click()
  await expect(page.getByRole('link', { name: /QA Grant/ })).toBeVisible()
  await page.getByRole('button', { name: 'Timeline' }).click()
  await expect(page.getByRole('link', { name: /QA Grant/ })).toBeVisible()
  await page.getByRole('button', { name: 'Board' }).click()
  await page.getByText('QA Grant').click()
  await expect(page.getByRole('heading', { name: 'QA Grant' })).toBeVisible()
  await page.getByRole('button', { name: 'Submitted' }).click()
  await page.getByLabel('Deadline').fill(today)
  await page.getByPlaceholder('Drop the update here...').fill('Submitted the application.')
  await page.getByRole('button', { name: 'Save pipeline update' }).click()
  await expect(page.getByText('Submitted the application.')).toBeVisible()

  await page.goto('/#/network')
  await page.getByRole('button', { name: 'Add person' }).click()
  await expect(page.getByText('Name the person before adding them.')).toBeVisible()
  await page.getByPlaceholder('Person name').fill('Jordan Mentor')
  await page.getByRole('button', { name: 'Add person' }).click()
  await page.getByRole('link', { name: /Jordan Mentor/ }).click()
  await expect(page.getByRole('heading', { name: 'Jordan Mentor' })).toBeVisible()
  await page.getByRole('button', { name: 'Add link' }).click()
  await expect(page.getByText('Paste a URL before adding a link.')).toBeVisible()
  await page.getByPlaceholder('https://...').fill('not-a-url')
  await page.getByRole('button', { name: 'Add link' }).click()
  await expect(page.getByText('Use a full URL that starts with http:// or https://.')).toBeVisible()
  await page.getByPlaceholder('Label, like LinkedIn').fill('Website')
  await page.getByPlaceholder('https://...').fill('https://example.com')
  await page.getByRole('button', { name: 'Add link' }).click()
  await expect(page.getByRole('link', { name: 'Website' })).toBeVisible()

  await page.goto('/#/docs')
  await page.getByRole('button', { name: 'Add doc' }).click()
  await expect(page.getByText('Name the doc before adding it.')).toBeVisible()
  await page.getByPlaceholder('Doc name').fill('QA Pitch')
  await page.getByRole('button', { name: 'Add doc' }).click()
  await page.getByRole('link', { name: /QA Pitch/ }).click()
  await expect(page.getByRole('heading', { name: 'QA Pitch' })).toBeVisible()
  await page.getByRole('button', { name: 'Add section' }).click()
  await expect(page.getByText('Name the section before adding it.')).toBeVisible()
  await page.getByPlaceholder('New section title').fill('QA appendix')
  await page.getByRole('button', { name: 'Add section' }).click()
  await expect(page.getByText('QA appendix')).toBeVisible()
  await page.route('http://localhost:11434/api/chat', (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'Ollama test failure' }),
  )
  await page.getByRole('button', { name: 'Problem', exact: true }).click()
  await page.getByRole('button', { name: 'Draft' }).click()
  await expect(page.getByText('Ollama test failure')).toBeVisible()

  await page.goto('/#/capital')
  await page.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByText('Add a description before logging capital.')).toBeVisible()
  await page.getByPlaceholder('Description').fill('QA Cloud spend')
  await page.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByText('Enter an amount greater than 0.')).toBeVisible()
  await page.getByPlaceholder('Amount').fill('150')
  await page.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByText('QA Cloud spend')).toBeVisible()

  await page.goto('/#/calendar')
  await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Previous month' }).click()
  await page.getByRole('button', { name: 'Next month' }).click()
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByText('This month')).toBeVisible()
})

test('quick add shows local AI loading and handles a successful suggestion', async ({ page }) => {
  await page.route('http://localhost:11434/api/chat', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: {
          content: JSON.stringify({
            type: 'expense',
            title: 'Cloud API bill',
            summary: 'Cloud spend for QA.',
            docType: 'custom',
            opportunityType: 'contract',
            capitalDirection: 'spent',
            capitalBucket: 'api/cloud',
            projectTags: [],
            deadline: '',
            value: '$500',
          }),
        },
      }),
    })
  })

  await page.goto('/#/')
  await page.getByRole('button', { name: 'Quick add' }).click()
  await page.getByRole('button', { name: 'Drop it in' }).click()
  await expect(page.getByText('Add a name or attachment before dropping it in.')).toBeVisible()
  await page.getByPlaceholder('What is it?').fill('Paid $500 cloud API bill')
  await page.getByRole('button', { name: 'AI sort' }).click()
  await expect(page.getByRole('button', { name: 'Sorting...' })).toBeVisible()
  await expect(page.getByText('Sorted as expense.')).toBeVisible()
  await page.getByRole('button', { name: 'Drop it in' }).click()
  await expect(page).toHaveURL(/#\/capital/)
  await expect(page.getByText('Cloud API bill')).toBeVisible()
  await expect(page.getByRole('article').filter({ hasText: 'Cloud API bill' }).getByText('-$500')).toBeVisible()
})

test('external calendars can subscribe, sync, import, and remove events', async ({ page }) => {
  await page.route('https://calendar.example/founder.ics', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        'content-type': 'text/calendar',
      },
      body: syncedCalendarIcs,
    })
  })

  await page.goto('/#/calendar')
  await page.getByRole('button', { name: 'Subscribe & sync' }).click()
  await expect(page.getByText('Add a calendar name before subscribing.')).toBeVisible()
  await page.getByPlaceholder('Calendar name').fill('Founder Calendar')
  await page.getByRole('button', { name: 'Subscribe & sync' }).click()
  await expect(page.getByText('Paste an .ics calendar URL before subscribing.')).toBeVisible()
  await page.getByPlaceholder('https:// or webcal:// .ics URL').fill('webcal://calendar.example/founder.ics')
  await page.getByRole('button', { name: 'Subscribe & sync' }).click()
  await expect(page.getByRole('button', { name: 'Syncing...' }).first()).toBeVisible()
  await expect(page.getByText('Founder Calendar synced.')).toBeVisible()
  await expect(page.getByText('External Demo Sync').first()).toBeVisible()
  await expect(page.getByText('Founder Calendar').first()).toBeVisible()

  await page.getByRole('button', { name: 'Sync', exact: true }).click()
  await expect(page.getByText('Founder Calendar synced.')).toBeVisible()

  await page.getByLabel('Import .ics file').setInputFiles({
    name: 'launch.ics',
    mimeType: 'text/calendar',
    buffer: Buffer.from(importedCalendarIcs),
  })
  await expect(page.getByText('launch imported.')).toBeVisible()
  await expect(page.getByText('Imported Demo Review').first()).toBeVisible()

  await page.getByRole('button', { name: 'Remove Founder Calendar' }).click()
  await expect(page.getByText('External Demo Sync')).toHaveCount(0)
  await expect(page.getByText('Imported Demo Review').first()).toBeVisible()
})

test('personalization layer changes dashboard, stages, templates, and saved views', async ({ page }) => {
  await page.goto('/#/customize')
  await page.getByLabel('Startup name').fill('Acme Launch Lab')
  await page.getByLabel('Founder name').fill('Avery')
  await page.getByLabel('Role').fill('CEO')
  await page.getByLabel('Focus areas').fill('Launch, Ship')
  await page.getByLabel('Focus areas').blur()
  await page.getByLabel('Default focus').selectOption('Launch')
  await page.getByLabel('Saved views').check()

  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Name the reminder before adding it.')).toBeVisible()
  await page.getByPlaceholder('Reminder').fill('Call mentor')
  await page.locator('section').filter({ hasText: 'Reminders' }).locator('input[type="date"]').fill(today)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Call mentor')).toBeVisible()

  const stagesSection = page.locator('section').filter({ hasText: 'Pipeline stages' })
  await stagesSection.getByRole('combobox').selectOption('partnership')
  await stagesSection.locator('textarea').fill('Lead list\nIntro sent\nDemo scheduled\nPilot agreed')
  await stagesSection.getByRole('button', { name: 'Save stages' }).click()
  await expect(page.getByText('partnership stages saved.')).toBeVisible()

  const templatesSection = page.locator('section').filter({ hasText: 'Doc templates' })
  await templatesSection.getByPlaceholder('Template name').fill('Launch Memo')
  await templatesSection.locator('textarea').fill('Thesis\nRisks\nNext steps')
  await templatesSection.getByRole('button', { name: 'Save template' }).click()
  await expect(page.getByText('Template saved.')).toBeVisible()
  await expect(page.getByText('Launch Memo')).toBeVisible()

  const viewsSection = page.locator('section').filter({ hasText: 'Saved views' })
  await viewsSection.getByPlaceholder('View name').fill('Launch board')
  await viewsSection.getByRole('button', { name: 'Save' }).click()
  await expect(viewsSection.getByText('Launch board')).toBeVisible()

  await page.goto('/#/')
  await expect(page.getByRole('heading', { name: '1 thing needs Avery today.' })).toBeVisible()
  await expect(page.getByText('Acme Launch Lab / Launch')).toBeVisible()
  await expect(page.getByText('Call mentor')).toBeVisible()
  await expect(page.getByRole('main').getByText('Launch board')).toBeVisible()

  await page.goto('/#/pipeline')
  await page.getByPlaceholder('Opportunity name').fill('Retail Pilot')
  await page.locator('form').filter({ hasText: 'Add opportunity' }).getByRole('combobox').selectOption('partnership')
  await page.getByRole('button', { name: 'Add opportunity' }).click()
  await expect(page.getByRole('heading', { name: 'Lead list' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Intro sent' })).toBeVisible()
  await page.getByText('Retail Pilot').click()
  await expect(page.getByRole('button', { name: 'Demo scheduled' })).toBeVisible()

  await page.goto('/#/docs')
  await page.getByPlaceholder('Doc name').fill('Founder memo v1')
  await page.locator('form').filter({ hasText: 'Add doc' }).getByRole('combobox').selectOption({ label: 'Launch Memo' })
  await page.getByRole('button', { name: 'Add doc' }).click()
  await page.getByRole('link', { name: /Founder memo v1/ }).click()
  await expect(page.getByRole('button', { name: 'Thesis', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Risks', exact: true })).toBeVisible()
})

test('how it works guide links into core workflows', async ({ page }) => {
  await page.goto('/#/how-it-works')
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Where work lands' })).toBeVisible()
  await page.getByRole('link', { name: /Review pipeline/ }).click()
  await expect(page).toHaveURL(/#\/pipeline/)
  await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible()
})

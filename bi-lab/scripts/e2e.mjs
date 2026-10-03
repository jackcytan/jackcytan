/**
 * End-to-end smoke test with Playwright (Chromium). Usage:
 *   npm run build && npx vite preview --port 4173 &   then   npm run e2e
 * Env: BASE_URL (default http://localhost:4173), SHOTS (screenshot dir), CHROME (executable path)
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from '@e965/xlsx'

const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const SHOTS = process.env.SHOTS || 'e2e-screens'
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
const errors = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

// ---- test files
const tmp = path.join(SHOTS, 'fixtures')
fs.mkdirSync(tmp, { recursive: true })
const csv = ['Ngày;Chi nhánh;Sản phẩm;Số lượng;Doanh thu;Chi phí']
for (let i = 0; i < 400; i++) {
  const d = new Date(Date.UTC(2026, 0, 1) + (i % 240) * 86400000)
  const dd = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
  const q = 1 + (i % 7)
  const rev = q * (150000 + (i % 5) * 25000)
  csv.push(`${dd};CN ${['Hà Nội', 'HCM', 'Đà Nẵng'][i % 3]};SP ${String.fromCharCode(65 + (i % 6))};${q};${rev.toLocaleString('de-DE')} ₫;${Math.round(rev * 0.7).toLocaleString('de-DE')}`)
}
csv.push('Tổng cộng;;;;999.999.999;')
fs.writeFileSync(path.join(tmp, 'sales-vn.csv'), '﻿' + csv.join('\n'))
const aoa = [['Báo cáo doanh số Q1'], [], ['Order Date', 'Region', 'Customer', 'Revenue', 'Cost', 'Status']]
for (let i = 0; i < 300; i++) aoa.push([new Date(Date.UTC(2025, i % 12, 1 + (i % 27))), ['North', 'South', 'Central'][i % 3], `Client ${i % 25}`, 1000 + (i % 13) * 250, 600 + (i % 11) * 120, i % 17 === 0 ? 'Cancelled' : 'Completed'])
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Data')
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Notes'], ['internal']]), 'Notes')
fs.writeFileSync(path.join(tmp, 'sales-en.xlsx'), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
fs.writeFileSync(path.join(tmp, 'broken.xlsx'), 'this is not a spreadsheet')

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
const external = []
page.on('request', (r) => { if (!r.url().startsWith(BASE.replace(/\/$/, '')) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()) })
const shot = (n) => page.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: false })
const go = async (route) => { await page.evaluate((r) => { location.hash = '#/' + r }, route); await page.waitForTimeout(500) }

try {
  let t = Date.now()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  check('landing loads', await page.getByText('BUSINESS INTELLIGENCE LAB').first().isVisible(), `${Date.now() - t} ms`)
  await page.getByRole('button', { name: /Bỏ qua|Skip/ }).click()
  await shot('01-landing-dark')
  await page.getByRole('button', { name: 'TRY DEMO DATA' }).click()
  await page.waitForTimeout(400)
  await shot('02-demo-center')
  t = Date.now()
  await page.getByRole('button', { name: /Sales Demo/ }).first().click()
  await page.getByText('Command Center').waitFor({ timeout: 20000 })
  check('sales demo → command center', true, `${Date.now() - t} ms`)
  await page.waitForTimeout(1200)
  await shot('03-command-center')
  check('focus box present', await page.getByText('WHAT SHOULD I LOOK AT?').isVisible())

  await go('dashboard')
  await page.waitForTimeout(1500)
  const canvases = await page.locator('canvas').count()
  check('dashboard renders charts', canvases >= 4, `${canvases} canvases`)
  await shot('04-dashboard')
  await page.locator('button:has-text("WHY?")').first().click()
  await page.waitForTimeout(400)
  check('WHY drawer opens', await page.getByText(/Bằng chứng số liệu|Numeric evidence/).isVisible())
  await shot('05-why-drawer')
  await page.keyboard.press('Escape')

  await go('ask')
  const input = page.getByPlaceholder(/Top 5/)
  await input.fill('Top 5 sản phẩm doanh thu cao nhất')
  await input.press('Enter')
  await page.waitForTimeout(1200)
  const ans = await page.locator('p:has-text("Top 5 sản phẩm theo doanh thu")').count()
  check('ask: top 5 products answered', ans > 0)
  await input.fill('xin chào bạn')
  await input.press('Enter')
  await page.waitForTimeout(300)
  check('ask: unknown question refused', await page.getByText('Tôi chưa xác định chính xác yêu cầu.').first().isVisible())
  await input.fill('so sánh Miền Bắc với Miền Nam')
  await input.press('Enter')
  await page.waitForTimeout(900)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('06-ask')

  await go('scenario')
  const before = await page.locator('text=IMPACT').locator('xpath=..').innerText()
  const slider = page.locator('input[type=range]').first()
  await slider.focus()
  for (let i = 0; i < 10; i++) await slider.press('ArrowRight')
  await page.waitForTimeout(300)
  const after = await page.locator('text=IMPACT').locator('xpath=..').innerText()
  check('scenario: revenue +10% changes impact', before !== after && /\+10%/.test(await page.locator('body').innerText()))
  await shot('07-scenario')

  await go('roi')
  check('roi: payback shown', await page.getByText(/tháng|months/).first().isVisible())
  await shot('08-roi')
  await go('health'); await page.waitForTimeout(600); await shot('09-health')
  await go('anomalies'); await page.waitForTimeout(900); await shot('10-anomalies')
  await go('explorer'); await page.waitForTimeout(800)
  const rowsRendered = await page.locator('tbody tr').count()
  check('explorer virtualizes rows', rowsRendered > 10 && rowsRendered < 120, `${rowsRendered} DOM rows`)
  await shot('11-explorer')
  await go('report'); await page.waitForTimeout(1500); await shot('12-report')
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: path.join(SHOTS, 'report.pdf'), format: 'A4', printBackground: true })
  check('report prints to PDF', fs.statSync(path.join(SHOTS, 'report.pdf')).size > 20000)
  await page.emulateMedia({ media: 'screen' })
  await go('privacy'); await shot('13-privacy')

  // light theme
  await page.evaluate(() => document.querySelector('[aria-label="Giao diện sáng"],[aria-label="Light theme"]')?.click())
  await page.waitForTimeout(300)
  check('light theme applies', (await page.locator('html').getAttribute('data-theme')) === 'light')
  await go('dashboard'); await page.waitForTimeout(1200); await shot('14-dashboard-light')
  await go('overview'); await page.waitForTimeout(800); await shot('15-command-center-light')

  // other demos
  for (const d of ['Manufacturing Demo', 'Finance Demo', 'HR Demo', 'Marketing Demo', 'Retail Demo', 'Operations Demo', 'Executive Demo']) {
    await go('demo')
    t = Date.now()
    await page.getByRole('button', { name: new RegExp(d) }).first().click()
    await page.getByText('Command Center').waitFor({ timeout: 20000 })
    check(`demo ${d}`, true, `${Date.now() - t} ms`)
  }
  await page.waitForTimeout(800)
  await shot('16-executive-light')

  // uploads
  await page.evaluate(() => document.querySelector('[aria-label="Giao diện tối"],[aria-label="Dark theme"]')?.click())
  await go('import')
  await page.locator('input[type=file]').setInputFiles(path.join(tmp, 'sales-vn.csv'))
  await page.getByRole('button', { name: /Phân tích dữ liệu|Analyze data/ }).waitFor({ timeout: 15000 })
  await shot('17-import-preview-csv')
  await page.getByRole('button', { name: /Phân tích dữ liệu|Analyze data/ }).click()
  await page.getByText(/Semantic Mapping/).waitFor({ timeout: 20000 })
  const mapText = await page.locator('main').innerText()
  check('csv upload → mapping', /Doanh thu|Revenue/.test(mapText))
  await shot('18-mapping-csv')
  await page.getByRole('button', { name: /Command Center/ }).click()
  await page.getByText('Command Center').first().waitFor({ timeout: 20000 })
  await page.waitForTimeout(800)
  await shot('19-command-center-csv')
  const body = await page.locator('main').innerText()
  check('csv: total row excluded & VN numbers parsed', /400 dòng/.test(body), body.match(/[\d.]+ dòng/)?.[0])

  await go('import')
  await page.locator('input[type=file]').setInputFiles(path.join(tmp, 'sales-en.xlsx'))
  await page.getByRole('button', { name: /Phân tích dữ liệu|Analyze data/ }).waitFor({ timeout: 15000 })
  const hdrSel = page.locator('select').nth(1)
  const hdr = await hdrSel.evaluate((el) => el.options[el.selectedIndex].text)
  check('xlsx: header row auto-detected below title row', /Order Date/.test(hdr), hdr)
  await shot('20-import-preview-xlsx')
  await page.getByRole('button', { name: /Phân tích dữ liệu|Analyze data/ }).click()
  await page.getByText(/Semantic Mapping/).waitFor({ timeout: 20000 })
  check('xlsx upload → mapping', true)

  await go('import')
  await page.getByRole('button', { name: /Xác nhận|Confirm|Áp dụng|Apply/ }).click().catch(() => {})
  await go('import')
  await page.locator('input[type=file]').setInputFiles(path.join(tmp, 'broken.xlsx'))
  await page.getByText(/hỏng|corrupt/i).first().waitFor({ timeout: 15000 })
  check('corrupt file → friendly error', true)
  await shot('21-error')

  // responsive
  await page.setViewportSize({ width: 820, height: 1100 })
  await go('dashboard'); await page.waitForTimeout(1000); await shot('22-tablet-dashboard')
  await page.setViewportSize({ width: 390, height: 844 })
  await go('overview'); await page.waitForTimeout(800); await shot('23-mobile-overview')
  await go('ask'); await page.waitForTimeout(500); await shot('24-mobile-ask')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check('mobile: no horizontal page scroll', overflow <= 1, `overflow=${overflow}px`)
} catch (e) {
  check('e2e run', false, String(e?.message ?? e))
  await shot('zz-failure').catch(() => {})
}
check('no console / page errors', errors.length === 0, errors.slice(0, 5).join(' | '))
check('no external network requests', external.length === 0, external.slice(0, 3).join(', '))
await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)

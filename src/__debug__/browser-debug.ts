import { promises as fs } from 'fs'
import { join } from 'path'
import { chromium } from 'playwright'
import { type ClickOptions, createCursor } from '../spoof'

const delay = async (ms: number): Promise<void> => {
  if (ms < 1) return
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

const cursorDefaultOptions = {
  moveDelay: 100,
  moveSpeed: 99,
  hesitate: 100,
  waitForClick: 10,
  scrollDelay: 100,
  scrollSpeed: 40,
  inViewportMargin: 50,
  waitForSelector: 200
} as const satisfies ClickOptions

chromium
  .launch({ headless: false })
  .then(async (browser) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const cursor = createCursor(
      page,
      undefined,
      undefined,
      {
        move: cursorDefaultOptions,
        moveTo: cursorDefaultOptions,
        click: cursorDefaultOptions,
        scroll: cursorDefaultOptions,
        getElement: cursorDefaultOptions
      },
      true
    )

    const html = await fs.readFile(join(__dirname, 'custom-page.html'), 'utf8')

    await page.goto('data:text/html,' + encodeURIComponent(html), {
      waitUntil: 'networkidle'
    })

    const performActions = async (): Promise<void> => {
      await cursor.click('#box1')

      await cursor.click('#box2')

      await cursor.click('#box3')

      await cursor.click('#box1')

      // await cursor.scrollTo('right')

      // await cursor.scrollTo('left')

      // await cursor.scrollTo('bottom')

      // await cursor.scrollTo('top')
    }

    await performActions()

    // allows us to hit "refresh" button to restart the events
    page.on('load', async () => {
      await delay(500)
      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })
      await delay(1000)

      await performActions()
    })
  })
  .catch((e) => {
    console.error(e)
  })

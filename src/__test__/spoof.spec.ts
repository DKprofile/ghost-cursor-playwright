import { expect, type Page, test } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { installMouseHelper } from '../mouse-helper'
import { type ClickOptions, createCursor, type GhostCursor } from '../spoof'

let cursor: GhostCursor

const cursorDefaultOptions = {
  moveDelay: 0,
  moveSpeed: 99,
  hesitate: 0,
  waitForClick: 0,
  scrollDelay: 0,
  scrollSpeed: 99,
  inViewportMargin: 50
} as const satisfies ClickOptions

declare global {
  // eslint-disable-next-line no-var
  var boxWasClicked: boolean
}

test.describe('Mouse movements', () => {
  const html = readFileSync(join(__dirname, 'custom-page.html'), 'utf8')

  test.beforeEach(async ({ page }) => {
    await installMouseHelper(page)

    await page.goto('data:text/html,' + encodeURIComponent(html), {
      waitUntil: 'networkidle'
    })

    cursor = createCursor(page, undefined, undefined, {
      move: cursorDefaultOptions,
      click: cursorDefaultOptions,
      moveTo: cursorDefaultOptions
    })
  })

  const testClick = async (
    page: Page,
    clickSelector: string
  ): Promise<void> => {
    expect(
      await page.evaluate(() => (window as any).boxWasClicked)
    ).toBeFalsy()
    await cursor.click(clickSelector)
    expect(
      await page.evaluate(() => (window as any).boxWasClicked)
    ).toBeTruthy()
  }

  const getScrollPosition = async (
    page: Page
  ): Promise<{ top: number, left: number }> =>
    await page.evaluate(() => ({ top: window.scrollY, left: window.scrollX }))

  test('Should click on the element without throwing an error (CSS selector)', async ({
    page
  }) => {
    await testClick(page, '#box1')
  })

  test('Should click on the element without throwing an error (XPath selector)', async ({
    page
  }) => {
    await testClick(page, '//*[@id="box1"]')
  })

  test('Should scroll to elements correctly', async ({ page }) => {
    const boxes = await Promise.all(
      [1, 2, 3].map(async (number: number) => {
        const selector = `#box${number}`
        const box = await page.waitForSelector(selector)
        if (box == null) throw new Error(`${selector} not found`)
        return box
      })
    )

    const isInViewport = async (element: any): Promise<boolean> => {
      return await element.evaluate((el: Element) => {
        const rect = el.getBoundingClientRect()
        return (
          rect.top >= 0 &&
					rect.left >= 0 &&
					rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
					rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        )
      })
    }

    expect(await getScrollPosition(page)).toEqual({ top: 0, left: 0 })

    expect(await isInViewport(boxes[0])).toBeTruthy()
    await cursor.click(boxes[0])
    expect(await getScrollPosition(page)).toEqual({ top: 0, left: 0 })
    expect(await isInViewport(boxes[0])).toBeTruthy()

    expect(await isInViewport(boxes[1])).toBeFalsy()
    await cursor.move(boxes[1])
    expect(await getScrollPosition(page)).toEqual({ top: 2395, left: 0 })
    expect(await isInViewport(boxes[1])).toBeTruthy()

    expect(await isInViewport(boxes[2])).toBeFalsy()
    await cursor.move(boxes[2])
    expect(await getScrollPosition(page)).toEqual({ top: 4345, left: 1785 })
    expect(await isInViewport(boxes[2])).toBeTruthy()

    expect(await isInViewport(boxes[0])).toBeFalsy()
    await cursor.click(boxes[0])
    expect(await isInViewport(boxes[0])).toBeTruthy()
  })

  test('Should scroll to position correctly', async ({ page }) => {
    expect(await getScrollPosition(page)).toEqual({ top: 0, left: 0 })

    await cursor.scrollTo('bottom')
    expect(await getScrollPosition(page)).toEqual({ top: 4345, left: 0 })

    await cursor.scrollTo('right')
    expect(await getScrollPosition(page)).toEqual({ top: 4345, left: 1785 })

    await cursor.scrollTo('top')
    expect(await getScrollPosition(page)).toEqual({ top: 0, left: 1785 })

    await cursor.scrollTo('left')
    expect(await getScrollPosition(page)).toEqual({ top: 0, left: 0 })

    await cursor.scrollTo({ y: 200, x: 400 })
    expect(await getScrollPosition(page)).toEqual({ top: 200, left: 400 })
  })
})

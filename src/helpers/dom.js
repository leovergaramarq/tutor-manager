export async function elementExists(page, selector) {
    return await page.evaluate(() => document.querySelector(selector) !== null);
}

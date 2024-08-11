import fs from 'fs';
import url from 'url';
import puppeteer from 'puppeteer';

const visitedUrls = new Set();
const outputFilePath = 'stellar-output.txt';

const emojis = ['🔥', '✨', '🪼', '🦠', '⛑️']

async function crawlPage(page, pageUrl, baseDomain, excludeList = []) {
    if (visitedUrls.has(pageUrl)) {
        return;
    }

    visitedUrls.add(pageUrl);
    console.log(`${getRandomEmoji()} -> Crawling: ${pageUrl}`);

    try {
        await page.goto(pageUrl, { waitUntil: 'networkidle2' });

        // Extract the text content from the page
        const textContent = await page.evaluate(() => document.body.innerText);

        // Save the text content to the output file
        fs.appendFileSync(outputFilePath, `\n\n=== ${pageUrl} ===\n\n${textContent}\n`);

        // Find and crawl all internal links on the page
        const links = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a')).map(anchor => anchor.href)
        );

        for (let link of links) {
            const absoluteLink = url.resolve(pageUrl, link);
            const linkDomain = new URL(absoluteLink).hostname;

            // Check if the link belongs to the same domain
            if (linkDomain === baseDomain && !visitedUrls.has(absoluteLink) && !excludeUrl(absoluteLink, excludeList)) {
                await crawlPage(page, absoluteLink, baseDomain);
            }
        }

    } catch (error) {
        console.error(`Failed to crawl ${pageUrl}:`, error.message);
    }
}

(async () => {
    const startUrl = 'https://developers.stellar.org/docs';
    const baseDomain = new URL(startUrl).hostname;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Start crawling from the homepage of the website
    await crawlPage(page, startUrl, baseDomain);

    await browser.close();
})();

function excludeUrl(pageUrl, ignoredUrls) {
    if (ignoredUrls == []) return
    return ignoredUrls.some(ignoredUrl => pageUrl.startsWith(ignoredUrl));
}

function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

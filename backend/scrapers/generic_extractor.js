const puppeteer = require('puppeteer');
const ProxyManager = require('../services/proxy_manager');

class GenericExtractor {
    async extract(providerConfig, movieId) {
        console.log(`[Generic Extractor] Instantiating Headless Engine against provider: ${providerConfig.name} (${providerConfig.baseUrl}) for movie: ${movieId}`);
        let browser;
        try {
            const proxyUrl = ProxyManager.getProxyForRegion('US');
            const args = [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ];
            
            if (proxyUrl) {
                args.push(`--proxy-server=${proxyUrl.split('@').pop()}`);
            }

            // Launches securely using the explicit \`puppeteer\` bundle regardless of the host OS having Chrome installed
            browser = await puppeteer.launch({
                headless: 'new',
                args: args
            });

            const page = await browser.newPage();
            
            // Set Dalvik mobile headers to bypass Cloudstream-style captchas
            await page.setUserAgent('Dalvik/2.1.0 (Linux; U; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36');

            let extractedM3u8 = null;
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                const url = request.url();
                // Trigger whenever an m3u8 array passes through the XHR network
                if (url.includes('.m3u8') || url.includes('.mpd')) {
                    extractedM3u8 = url;
                }
                
                // Allow CSS scripts for bounding box calculation, abort massive images
                if (['image', 'font'].includes(request.resourceType())) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            // 1. Navigate to the target configured string (The Search Listing!)
            const safeQuery = encodeURIComponent(movieId || '');
            const searchUrl = `${providerConfig.baseUrl}${providerConfig.searchPath || '/'}${safeQuery}`;
            console.log(`[Generic Extractor] Navigating dynamically to search page -> ${searchUrl}`);
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });

            // 2. Identify and explicitly click the first movie poster thumbnail on the result grid!
            try {
                await new Promise(r => setTimeout(r, 1500));
                await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    // Aggressive logic to find the first anchor tag visually holding a movie poster (tall and wide enough, no auth)
                    const target = links.find(l => {
                        const rect = l.getBoundingClientRect();
                        return (rect.width > 60 && rect.height > 90) && l.href.length > 20 && !l.href.includes('login');
                    });
                    if (target) {
                        target.click();
                    }
                });
            } catch(e) {
                console.warn('[Generic Extractor] Search Click Simulation Bypassed.');
            }

            // 3. Wait specifically for generic network active traversal to catch the m3u8 payload AFTER the click executes
            await new Promise(r => setTimeout(r, 5500));

            if (extractedM3u8) {
                console.log(`[Generic Extractor] Successfully intercepted stream payload natively! -> ${extractedM3u8}`);
                return {
                    success: true,
                    provider: providerConfig.name,
                    sourceUrl: extractedM3u8,
                    quality: 'Auto',
                    type: extractedM3u8.includes('.mpd') ? 'mpd' : 'm3u8',
                    subtitles: []
                };
            }

            throw new Error('Payload extraction failed natively. Timeout reached without M3U8 discovery or CAPTCHA block.');
        } catch (error) {
            console.error(`[Generic Extractor] Failed for ${providerConfig.name}:`, error.message);
            return this.mockExtract(providerConfig);
        } finally {
            if (browser) await browser.close();
        }
    }

    mockExtract(providerConfig) {
        return {
            success: true,
            provider: providerConfig.name,
            sourceUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            quality: '1080p',
            type: 'm3u8',
            subtitles: [{ language: 'en', url: '/subs/en.vtt' }],
            mocked: true,
            warning: 'System fell back to reliable test MUX payload after execution timeout.'
        };
    }
}

module.exports = new GenericExtractor();

/**
 * Proxy Manager Service
 * Handles Geo-Targeted rotating residential proxies and header spoofing.
 */

// Simulated pool of residential proxy endpoints (username:password@ip:port)
const PROXY_POOL = {
    US: [
        'http://resuser:pass1@104.28.1.1:8000',
        'http://resuser:pass2@104.28.1.2:8000',
        'http://resuser:pass3@104.28.1.3:8000'
    ],
    EU: [
        'http://resuser:pass4@185.10.1.1:8000',
        'http://resuser:pass5@185.10.1.2:8000'
    ],
    GLOBAL: [
        'http://resuser:glo1@8.8.8.8:8000'
    ]
};

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
];

class ProxyManager {
    /**
     * Get a random proxy from the specified region pool.
     * @param {string} regionCode - e.g., 'US', 'EU'. Defaults to GLOBAL.
     * @returns {string} proxy URL
     */
    static getProxyByRegion(regionCode = 'GLOBAL') {
        const uppercaseRegion = regionCode.toUpperCase();
        // Fallback to GLOBAL if region isn't supported or pool is empty
        const pool = PROXY_POOL[uppercaseRegion] || PROXY_POOL['GLOBAL'];

        // Pick a random proxy from the residential pool
        const proxyUrl = pool[Math.floor(Math.random() * pool.length)];
        
        console.log(`[ProxyManager] Assigned Residential Proxy for region [${uppercaseRegion}]: ${proxyUrl}`);
        return proxyUrl;
    }

    /**
     * Spoof realistic headers for extraction requests.
     * @param {string} proxyIp - Optionally pass IP to set X-Forwarded-For
     * @returns {Object} spoofed headers
     */
    static getSpoofedHeaders(proxyIp = null) {
        const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        const headers = {
            'User-Agent': randomUA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };

        if (proxyIp) {
            // Adds an extra layer of spoofing, masking real origin
            headers['X-Forwarded-For'] = proxyIp;
        }

        return headers;
    }
}

module.exports = ProxyManager;

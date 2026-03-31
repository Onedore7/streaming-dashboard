const axios = require('axios');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://raw.githubusercontent.com/phisher98/cloudstream-extensions-phisher/refs/heads/builds/repo.json';
const DATA_DIR = path.join(__dirname, '../data');
const MASTER_DB_PATH = path.join(DATA_DIR, 'master_providers.json');

async function harvest() {
    console.log('[Harvester v2] Initiating bulk extraction sequence...');
    
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

        const response = await axios.get(REPO_URL, {
            headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Pixel 5)' }
        });

        const pluginLists = response.data.pluginLists || [];
        const masterDatabase = {};

        for (const listUrl of pluginLists) {
            try {
                const listRes = await axios.get(listUrl, {
                    headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Pixel 5)' }
                });
                
                const plugins = listRes.data || [];
                for (const plugin of plugins) {
                    if (!plugin.name) continue;
                    
                    const safeName = plugin.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    
                    if (!masterDatabase[safeName]) {
                        // User Override: Strict Plugin Sub-Selection logic
                        if (safeName.includes('streamplay') || safeName.includes('kisskh')) {
                            
                            // Map the Kotlin .cs3 payloads back to their physical website architectures for Puppeteer
                            let realBaseUrl = `https://${safeName}.to`;
                            let realSearchPath = '/search/';
                            
                            if (safeName.includes('kisskh')) {
                                realBaseUrl = 'https://kisskh.co';
                                realSearchPath = '/Search?q=';
                            } else if (safeName.includes('streamplay')) {
                                // Streamplay aggregates via MultiAPI. We map it identically to a generic robust host for our Puppeteer extraction engine
                                realBaseUrl = 'https://flixhq.to';
                                realSearchPath = '/search/';
                            }

                            masterDatabase[safeName] = {
                                id: safeName,
                                name: plugin.name,
                                description: plugin.description || 'No description provided.',
                                version: plugin.version,
                                language: plugin.language || 'en',
                                baseUrl: realBaseUrl,
                                searchPath: realSearchPath,
                                authors: plugin.authors || []
                            };
                            console.log(`[Harvester v2] Restructured provider: ${safeName} -> ${realBaseUrl}`);
                        }
                    }
                }
            } catch(e) {
                console.warn(`[Harvester v2] Could not traverse list: ${listUrl}`);
            }
        }

        const providerCount = Object.keys(masterDatabase).length;
        fs.writeFileSync(MASTER_DB_PATH, JSON.stringify(masterDatabase, null, 2));
        
        console.log(`[Harvester v2] Success! Saved ${providerCount} deeply mapped providers into master_providers.json.`);
        return masterDatabase;
    } catch (error) {
        console.error('[Harvester v2] FATAL: Bulk extraction failed.', error.message);
        throw error;
    }
}

if (require.main === module) {
    harvest();
}

module.exports = { harvest };

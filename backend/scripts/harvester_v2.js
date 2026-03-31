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

        // Phase 1: Fetch Master Index bypassing standard bot-blocks
        const response = await axios.get(REPO_URL, {
            headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Pixel 5)' }
        });

        const pluginLists = response.data.pluginLists || [];
        const masterDatabase = {};

        console.log(`[Harvester v2] Found ${pluginLists.length} plugin list repositories. Traversing...`);

        // Phase 2: Traverse deeply into each plugin .json URL
        for (const listUrl of pluginLists) {
            try {
                const listRes = await axios.get(listUrl, {
                    headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Pixel 5)' }
                });
                
                const plugins = listRes.data || [];
                for (const plugin of plugins) {
                    if (!plugin.name) continue;
                    
                    // Sanitize name mapping for dictionary keys
                    const safeName = plugin.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    
                    // Deduplicate and structure
                    if (!masterDatabase[safeName]) {
                        // User Override: Strict Plugin Sub-Selection logic
                        if (safeName.includes('streamplay') || safeName.includes('kisskh')) {
                            masterDatabase[safeName] = {
                                id: safeName,
                                name: plugin.name,
                                description: plugin.description || 'No description provided.',
                                version: plugin.version,
                                language: plugin.language || 'en',
                                // Some cloudstream models use specific URL patterns or baseUrls
                                baseUrl: plugin.url || `https://${safeName}.generic.tv`,
                                authors: plugin.authors || []
                            };
                            console.log(`[Harvester v2] Permitted explicitly requested provider: ${safeName}`);
                        }
                    }
                }
            } catch(e) {
                console.warn(`[Harvester v2] Could not traverse list: ${listUrl}`);
            }
        }

        // Output securely
        const providerCount = Object.keys(masterDatabase).length;
        fs.writeFileSync(MASTER_DB_PATH, JSON.stringify(masterDatabase, null, 2));
        
        console.log(`[Harvester v2] Success! Saved ${providerCount} deeply mapped providers into master_providers.json.`);
        return masterDatabase;
    } catch (error) {
        console.error('[Harvester v2] FATAL: Bulk extraction failed.', error.message);
        throw error;
    }
}

// Allow CLI execution
if (require.main === module) {
    harvest();
}

module.exports = { harvest };

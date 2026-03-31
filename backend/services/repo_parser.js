const axios = require('axios');
const { engine } = require('../scrapers/movie_provider');

class RepoParser {
    constructor() {
        this.repoUrl = 'https://raw.githubusercontent.com/phisher98/cloudstream-extensions-phisher/refs/heads/builds/repo.json';
        this.activeSources = [];
        // Mobile User-Agent to satisfy GitHub/Anti-bot logic
        this.headers = {
            'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Pixel 5 Build/RQ3A.210805.001.A1)'
        };
    }

    /**
     * Bootstraps the syncing protocol.
     */
    init() {
        // Trigger immediately on server boot
        this.sync();

        // Standard JS Interval tracking exactly 24 hours (86,400,000 miliseconds)
        setInterval(() => this.sync(), 86400000);
    }

    /**
     * Analyzes JSON from GitHub raw usercontent asynchronously
     */
    async sync() {
        try {
            console.log('[RepoParser] Syncing external GitHub repositories...');
            
            // 1. Fetch Master Repo JSON
            const repoRes = await axios.get(this.repoUrl, { headers: this.headers });
            const repoData = repoRes.data;

            if (!repoData.pluginLists || repoData.pluginLists.length === 0) {
                console.warn('[RepoParser] No plugin URLs detected in root repo object.');
                return;
            }

            // 2. Fetch the Child Plugins List array
            const pluginsUrl = repoData.pluginLists[0];
            const pluginsRes = await axios.get(pluginsUrl, { headers: this.headers });
            const pluginsData = pluginsRes.data;

            this.activeSources = [];
            
            // 3. Map and Format the Payload strictly down to Name/Version/Domain
            console.log(`[RepoParser] Discovered ${pluginsData.length || 0} external plugins.`);
            
            pluginsData.forEach(plugin => {
                // A typical extension object structure: name, version, tvTypes
                // We extract identifiers dynamically and inject stub domains
                const parsedSource = {
                    name: plugin.name,
                    version: plugin.version,
                    lang: plugin.language || 'en',
                    status: plugin.status || 1,
                    // Generic mapping to link internal IDs later
                    domain: plugin.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.generic.tv'
                };
                
                this.activeSources.push(parsedSource);

                // Inject generic metadata into the provider engine.
                // You will define localized payload reversing inside these classes yourself.
                engine.registerDynamicProvider(parsedSource.name, parsedSource.domain);
            });

            console.log('[RepoParser] Successfully completed 24-hr cron sync. Data cached.');

        } catch (error) {
            console.error('[RepoParser] GitHub Fetch Failed due to limits or blocking:', error.message);
        }
    }

    /**
     * Retrieve cleanly formatted array map for `/api/sources`
     */
    getSources() {
        return this.activeSources;
    }
}

// Export a singleton
module.exports = new RepoParser();

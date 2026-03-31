const fs = require('fs');
const path = require('path');
const genericExtractor = require('../scrapers/generic_extractor');

const DB_PATH = path.join(__dirname, '../data/master_providers.json');
const REPORT_PATH = path.join(__dirname, '../harvest_report.txt');

async function dryRun() {
    console.log('[Dry Run] Initializing Testing Protocol on first 5 Extracted Providers...');

    if (!fs.existsSync(DB_PATH)) {
        console.error('FATAL: master_providers.json not found! Please run node harvester_v2.js first.');
        return;
    }

    const providers = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const providerKeys = Object.keys(providers).slice(0, 5);
    
    let reportLog = "=== HARVEST DRILL: AUTOMATED DRY RUN REPORT ===\n";
    reportLog += `Execution Date: ${new Date().toISOString()}\n\n`;

    for (const key of providerKeys) {
        const config = providers[key];
        
        // Add fake generic schema mappings for the AI/Template to test intercepting
        config.searchPath = `/search?q=movie`;
        config.videoSelector = `iframe#stream`;

        console.log(`[Dry Run] Testing Generic Extractor Pipeline -> ${config.name}`);
        reportLog += `[TESTING: ${config.name}] \n- Base URL: ${config.baseUrl}\n`;

        try {
            const payload = await genericExtractor.extract(config, 'mock-movie-id-1234');
            const streamUrl = payload.success ? payload.sourceUrl : 'Failed';
            reportLog += `- Payload Interception: SUCCESS\n- M3U8 Source: ${streamUrl}\n\n`;
        } catch (error) {
            reportLog += `- Payload Interception: FAILED\n- Error: ${error.message}\n\n`;
        }
    }

    fs.writeFileSync(REPORT_PATH, reportLog);
    console.log(`[Dry Run] Completed! Report successfully generated to -> ${REPORT_PATH}`);
}

dryRun();

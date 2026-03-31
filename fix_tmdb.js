const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'backend/server.js');
let content = fs.readFileSync(p, 'utf8');

// The exact string block I previously wrote starting with // --- NEW TMDB NATIVE CATALOG API ---
const oldString = `// --- NEW TMDB NATIVE CATALOG API ---
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8d6d91941230817f7807d643736e8a49';

fastify.get('/api/tmdb/trending', async (request, reply) => {
    try {
        if (!TMDB_API_KEY) return reply.send({ data: [ { id: 'mock1', title: 'TMDB Key Missing', overview: 'Please add TMDB_API_KEY to Render config to see 4k covers!', poster_path: null, backdrop_path: null } ] });
        const res = await axios.get(\`https://api.themoviedb.org/3/trending/movie/day?api_key=\\\${TMDB_API_KEY}\`);
        const movies = res.data.results.map(m => ({
            id: m.id,
            title: m.title,
            overview: m.overview,
            poster_path: m.poster_path ? \`https://image.tmdb.org/t/p/w500\\\${m.poster_path}\` : null,
            backdrop_path: m.backdrop_path ? \`https://image.tmdb.org/t/p/original\\\${m.backdrop_path}\` : null
        }));
        return reply.send({ data: movies });
    } catch(err) {
        return reply.status(500).send({ error: 'TMDB Trending API Error: ' + err.message });
    }
});

fastify.get('/api/tmdb/search', async (request, reply) => {
    try {
        const { q } = request.query;
        if (!q) return reply.status(400).send({ error: 'Missing explicit search query.' });
        if (!TMDB_API_KEY) return reply.send({ data: [{ id: 'mocksearch', title: \`Search Payload: \\\${q} (TMDB Key Missing)\`, overview: 'Add TMDB_API_KEY to Render to view grid searches!', poster_path: null, backdrop_path: null }] });
        
        const res = await axios.get(\`https://api.themoviedb.org/3/search/movie?query=\\\${encodeURIComponent(q)}&api_key=\\\${TMDB_API_KEY}\`);
        const movies = res.data.results.map(m => ({
            id: m.id,
            title: m.title,
            overview: m.overview,
            poster_path: m.poster_path ? \`https://image.tmdb.org/t/p/w500\\\${m.poster_path}\` : null,
            backdrop_path: m.backdrop_path ? \`https://image.tmdb.org/t/p/original\\\${m.backdrop_path}\` : null
        }));
        return reply.send({ data: movies });
    } catch(err) {
        return reply.status(500).send({ error: 'TMDB Search API Error: ' + err.message });
    }
});`;

const newString = `// --- NEW KEYLESS CINEMETA CATALOG API ---
fastify.get('/api/tmdb/trending', async (request, reply) => {
    try {
        const res = await axios.get('https://v3-cinemeta.strem.io/catalog/movie/top.json');
        const movies = res.data.metas.map(m => ({
            id: m.id,
            title: m.name,
            overview: m.description || 'No description available.',
            poster_path: m.poster || null,
            backdrop_path: m.background || null
        }));
        return reply.send({ data: movies });
    } catch(err) {
        return reply.status(500).send({ error: 'Cinemeta Trending API Error: ' + err.message });
    }
});

fastify.get('/api/tmdb/search', async (request, reply) => {
    try {
        const { q } = request.query;
        if (!q) return reply.status(400).send({ error: 'Missing explicit search query.' });
        
        const res = await axios.get(\`https://v3-cinemeta.strem.io/catalog/movie/search/search=\\\${encodeURIComponent(q)}.json\`);
        const movies = (res.data.metas || []).map(m => ({
            id: m.id,
            title: m.name,
            overview: m.description || 'No description available.',
            poster_path: m.poster || null,
            backdrop_path: m.background || null
        }));
        return reply.send({ data: movies });
    } catch(err) {
        return reply.status(500).send({ error: 'Cinemeta Search API Error: ' + err.message });
    }
});`;

if (content.includes('const TMDB_API_KEY')) {
    content = content.replace(oldString, newString);
    fs.writeFileSync(p, content, 'utf8');
    console.log('Successfully patched TMDB to Keyless Cinemeta API!');
} else {
    console.log('TMDB bypass block not found.');
}

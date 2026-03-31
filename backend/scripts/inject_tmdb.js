const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'backend/server.js');
let content = fs.readFileSync(p, 'utf8');

const injection = `
// --- NEW TMDB NATIVE CATALOG API ---
const TMDB_API_KEY = process.env.TMDB_API_KEY;

fastify.get('/api/tmdb/trending', async (request, reply) => {
    try {
        if (!TMDB_API_KEY) return reply.send({ data: [ { id: 'mock1', title: 'TMDB Key Missing', overview: 'Please add TMDB_API_KEY to Render config.', poster_path: null, backdrop_path: null } ] });
        const res = await axios.get(\`https://api.themoviedb.org/3/trending/movie/day?api_key=\${TMDB_API_KEY}\`);
        const movies = res.data.results.map(m => ({
            id: m.id,
            title: m.title,
            overview: m.overview,
            poster_path: m.poster_path ? \`https://image.tmdb.org/t/p/w500\${m.poster_path}\` : null,
            backdrop_path: m.backdrop_path ? \`https://image.tmdb.org/t/p/original\${m.backdrop_path}\` : null
        }));
        return reply.send({ data: movies });
    } catch(err) {
        return reply.status(500).send({ error: 'TMDB Ext Error: ' + err.message });
    }
});

fastify.get('/api/tmdb/search', async (request, reply) => {
    try {
        const { q } = request.query;
        if (!q) return reply.status(400).send({ error: 'Missing explicit search query.' });
        if (!TMDB_API_KEY) return reply.send({ data: [] });
        
        const res = await axios.get(\`https://api.themoviedb.org/3/search/movie?query=\${encodeURIComponent(q)}&api_key=\${TMDB_API_KEY}\`);
        const movies = res.data.results.map(m => ({
            id: m.id,
            title: m.title,
            overview: m.overview,
            poster_path: m.poster_path ? \`https://image.tmdb.org/t/p/w500\${m.poster_path}\` : null,
            backdrop_path: m.backdrop_path ? \`https://image.tmdb.org/t/p/original\${m.backdrop_path}\` : null
        }));
        return reply.send({ data: movies });
    } catch(err) {
        return reply.status(500).send({ error: 'TMDB Ext Error: ' + err.message });
    }
});
`;

if (!content.includes('/api/tmdb/trending')) {
    // Inject right before // Core API logic
    content = content.replace('// Core API logic wrapping', injection + '\n// Core API logic wrapping');
    fs.writeFileSync(p, content, 'utf8');
    console.log('TMDB Endpoints Injected successfully!');
} else {
    console.log('TMDB Endpoints already exist.');
}

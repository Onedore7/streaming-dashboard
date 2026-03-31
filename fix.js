const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'backend/server.js');
let content = fs.readFileSync(p, 'utf8');

const target = `fastify.get('/api/watch', async (request, reply) => {
  const { id } = request.query;
  if (!id) {
    return reply.status(400).send({ error: 'Video ID parameter is required.' });
  }

  try {
    request.log.info(\`API request for /watch?id=\${id} triggered\`);
    // Engine iterates through providers like Loklok/Soap2Day asynchronously
    const payload = await engine.resolveMedia(id);`;

// Convert CRLF locally for the target regex
const pattern = /fastify\.get\('\/api\/watch'[\s\S]*?const payload = await engine\.resolveMedia\(id\);/;

const replacement = `fastify.get('/api/watch', async (request, reply) => {
  const { id, provider } = request.query;
  if (!id) {
    return reply.status(400).send({ error: 'Video ID parameter is required.' });
  }

  try {
    request.log.info(\`API request for /watch?id=\${id} triggered\`);

    if (provider) {
        const dbPath = path.join(__dirname, 'data/master_providers.json');
        if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            if (dbData[provider]) {
                const payload = await genericExtractor.extract(dbData[provider], id);
                if (payload.success) return reply.send({ data: payload });
            }
        }
    }

    // Engine iterates through providers like Loklok/Soap2Day asynchronously
    const payload = await engine.resolveMedia(id);`;

content = content.replace(pattern, replacement);
fs.writeFileSync(p, content, 'utf8');
console.log('Fixed api/watch dynamically!');

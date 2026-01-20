import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID || 'xmwW1Vkjp9MySdwcUvebCoNVIpB5uOLW';

app.get('/api/resolve', async (req, res) => {
  const url = req.query.url;
  console.log('Resolving:', url);
  try {
    const apiUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${CLIENT_ID}`;
    console.log('API URL:', apiUrl);
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log('Response:', data);
    res.json(data);
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stream', async (req, res) => {
  const url = req.query.url;
  console.log('Getting stream:', url);
  try {
    const response = await fetch(`${url}?client_id=${CLIENT_ID}`);
    const data = await response.json();
    console.log('Stream data:', data);
    res.json(data);
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
  console.log('Client ID:', CLIENT_ID);
});

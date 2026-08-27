import { Hono } from 'hono';
import { uploadFile, deleteFile, listMediaFiles } from '../services/r2Storage.js';

const app = new Hono();

// GET all media files
app.get('/', c => {
  const files = listMediaFiles();
  return c.json(files);
});

// POST upload media to Cloudflare R2 / Local
app.post('/upload', async c => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || typeof file === 'string') {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name || 'upload.jpg';
    const mimeType = file.type || 'image/jpeg';

    const uploaded = await uploadFile(buffer, originalName, mimeType);
    return c.json({ success: true, file: uploaded }, 201);
  } catch (error) {
    console.error('Media upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

// DELETE media file
app.delete('/:id', async c => {
  const id = c.req.param('id');
  const deleted = await deleteFile(id);
  if (!deleted) {
    return c.json({ error: 'Media file not found' }, 404);
  }
  return c.json({ success: true, id });
});

export default app;

import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from '../db/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check Cloudflare R2 Configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'frond-assets';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const isR2Configured = Boolean(
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_ENDPOINT &&
  R2_BUCKET_NAME
);

let r2Client = null;
if (isR2Configured) {
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    console.log('☁️ Cloudflare R2 Storage Client initialized successfully.');
  } catch (err) {
    console.warn('⚠️ Cloudflare R2 initialization warning, falling back to local storage:', err.message);
  }
}

/**
 * Upload a file to Cloudflare R2 (with local disk fallback)
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File MIME type (e.g. 'image/jpeg', 'video/mp4')
 * @returns {Promise<{ id: string, url: string, filename: string, mimeType: string, size: number, provider: string }>}
 */
export async function uploadFile(buffer, originalName, mimeType) {
  const ext = path.extname(originalName) || (mimeType.includes('image') ? '.jpg' : '.mp4');
  const uniqueKey = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const id = `media-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const sizeBytes = buffer.length;

  let publicUrl = '';
  let provider = 'local';

  // Try Cloudflare R2 first if available
  if (r2Client && isR2Configured) {
    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueKey,
        Body: buffer,
        ContentType: mimeType,
      });
      await r2Client.send(command);
      provider = 'r2';
      publicUrl = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${uniqueKey}`
        : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${uniqueKey}`;
      console.log(`✅ Uploaded to Cloudflare R2: ${uniqueKey} (${sizeBytes} bytes)`);
    } catch (r2Error) {
      console.error('❌ Cloudflare R2 upload error, writing locally:', r2Error.message);
      provider = 'local';
    }
  }

  // Fallback / Local write
  if (provider === 'local') {
    const localPath = path.join(uploadsDir, uniqueKey);
    fs.writeFileSync(localPath, buffer);
    publicUrl = `/uploads/${uniqueKey}`;
    console.log(`📁 Saved to local disk: ${uniqueKey} (${sizeBytes} bytes)`);
  }

  // Record in Database
  try {
    const insertMedia = db.prepare(`
      INSERT INTO media_files (id, filename, original_name, url, mime_type, size_bytes, storage_provider)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertMedia.run(id, uniqueKey, originalName, publicUrl, mimeType, sizeBytes, provider);
  } catch (dbErr) {
    console.error('Error saving media record to DB:', dbErr.message);
  }

  return {
    id,
    filename: uniqueKey,
    originalName,
    url: publicUrl,
    mimeType,
    size: sizeBytes,
    provider,
  };
}

/**
 * Delete a file from Cloudflare R2 / Local disk
 */
export async function deleteFile(mediaId) {
  const row = db.prepare('SELECT * FROM media_files WHERE id = ?').get(mediaId);
  if (!row) return false;

  if (row.storage_provider === 'r2' && r2Client) {
    try {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: row.filename,
      }));
    } catch (err) {
      console.error('R2 deletion error:', err.message);
    }
  } else {
    const localPath = path.join(uploadsDir, row.filename);
    if (fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch {}
    }
  }

  db.prepare('DELETE FROM media_files WHERE id = ?').run(mediaId);
  return true;
}

/**
 * List all uploaded media files from database
 */
export function listMediaFiles() {
  return db.prepare('SELECT * FROM media_files ORDER BY created_at DESC').all();
}

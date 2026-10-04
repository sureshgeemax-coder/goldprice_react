import ExcelJS from 'exceljs';
import { list, put } from '@vercel/blob';
import JSZip from 'jszip';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeExcelDate, normalizeExcelTimestamp } from './time.js';

const workbookPath = path.join(process.cwd(), 'data', 'GoldRates.xlsx');
const localHistoryPath = path.join(process.cwd(), '.local', 'history.json');
const blobPath = 'gold-price-dashboard/history.json';
let seedPromise;

function cellText(row, column) {
  const cell = row.getCell(column);
  return String(cell.text || cell.value || '').trim();
}

async function readWorkbookSeed() {
  const archive = await JSZip.loadAsync(await readFile(workbookPath));
  const spreadsheetNamespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  for (const name of Object.keys(archive.files)) {
    if (name === 'docProps/app.xml') {
      archive.remove(name);
      continue;
    }
    if (!name.endsWith('.xml')) continue;
    const entry = archive.file(name);
    if (!entry) continue;
    const xml = await entry.async('string');
    if (!xml.includes(`xmlns:x="${spreadsheetNamespace}"`)) continue;
    archive.file(name, xml.replace(/(<\/?)x:/g, '$1').replace(/xmlns:x=/g, 'xmlns='));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await archive.generateAsync({ type: 'nodebuffer' }));
  const sheet = workbook.getWorksheet('GoldRates');
  if (!sheet) throw new Error('The Excel workbook is missing its GoldRates sheet.');

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const date = normalizeExcelDate(cellText(row, 1));
    const lastUpdated = normalizeExcelTimestamp(cellText(row, 9));
    const rate = Number(cellText(row, 6));
    if (!date || !lastUpdated || !Number.isFinite(rate)) return;

    rows.push({
      Date: date,
      Time: cellText(row, 2),
      Source: cellText(row, 3),
      GoldType: cellText(row, 4),
      Purity: Number(cellText(row, 5)),
      RatePerGram: rate,
      Currency: cellText(row, 7),
      SourceUrl: cellText(row, 8),
      LastUpdated: lastUpdated,
      Status: cellText(row, 10),
      ErrorMessage: cellText(row, 11)
    });
  });

  return rows;
}

export function readWorkbookHistory() {
  seedPromise ||= readWorkbookSeed();
  return seedPromise;
}

async function readBlobHistory() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: blobPath, limit: 1 });
  const blob = blobs.find((item) => item.pathname === blobPath);
  if (!blob) return null;

  const response = await fetch(blob.downloadUrl || blob.url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Stored gold history could not be read (${response.status}).`);
  const records = await response.json();
  return Array.isArray(records) ? records : null;
}

export async function readHistory() {
  if (process.env.VERCEL) {
    const stored = await readBlobHistory();
    return stored || readWorkbookHistory();
  }

  try {
    const contents = await readFile(localHistoryPath, 'utf8');
    const records = JSON.parse(contents);
    if (Array.isArray(records)) return records;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  return readWorkbookHistory();
}

export async function writeHistory(records) {
  const contents = JSON.stringify(records);
  if (process.env.VERCEL) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('Persistent history is not configured. Add a Vercel Blob store to provide BLOB_READ_WRITE_TOKEN.');
    }
    await put(blobPath, contents, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });
    return;
  }

  await mkdir(path.dirname(localHistoryPath), { recursive: true });
  await writeFile(localHistoryPath, contents, 'utf8');
}
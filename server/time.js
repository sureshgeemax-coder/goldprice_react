const singaporeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Singapore',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

function pad(value) {
  return String(value).padStart(2, '0');
}

function timestampFromParts(year, month, day, hour, minute, second) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+08:00`;
}

export function getSingaporeParts(date = new Date()) {
  const parts = Object.fromEntries(singaporeFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`
  };
}

export function getSingaporeTimestamp(date = new Date()) {
  const { date: day, time } = getSingaporeParts(date);
  return `${day}T${time}+08:00`;
}

export function parsePublishedTimestamp(value, format) {
  const input = String(value || '').trim();
  let match;

  if (format === 'dmy') {
    match = input.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;
    let hour = Number(match[4]);
    if (match[7]) hour = hour % 12 + (match[7].toUpperCase() === 'PM' ? 12 : 0);
    return timestampFromParts(Number(match[3]), Number(match[2]), Number(match[1]), hour, Number(match[5]), Number(match[6]));
  }

  if (format === 'dmY') {
    match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    const hour = Number(match[4]) % 12 + (match[6].toUpperCase() === 'PM' ? 12 : 0);
    return timestampFromParts(Number(match[3]), Number(match[2]), Number(match[1]), hour, Number(match[5]), 0);
  }

  if (format === 'iso') {
    match = input.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    return timestampFromParts(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
  }

  return null;
}

export function normalizeExcelDate(value) {
  const input = String(value || '').trim();
  const match = input.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : '';
}

export function normalizeExcelTimestamp(value) {
  const parsed = parsePublishedTimestamp(value, 'dmy');
  if (parsed) return parsed;
  const input = String(value || '').trim();
  return /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input) ? input : null;
}

export function dateDaysAgo(date, days) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() - days);
  return result.toISOString().slice(0, 10);
}
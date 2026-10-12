export default function recordRows(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(rows)) throw new Error('The server returned an invalid record list.');
  return rows;
}

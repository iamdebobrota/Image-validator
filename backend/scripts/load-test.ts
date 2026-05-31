import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/images';
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '20', 10);
const IMAGE_PATH = process.argv[2];

if (!IMAGE_PATH) {
  console.error('Usage: npx tsx scripts/load-test.ts <path-to-test-image>');
  console.error('Example: npx tsx scripts/load-test.ts ~/photo.jpg');
  console.error('Set CONCURRENCY=50 to change concurrent uploads (default 20)');
  process.exit(1);
}

const imageBuffer = fs.readFileSync(path.resolve(IMAGE_PATH));
const filename = path.basename(IMAGE_PATH);

async function uploadOne(index: number): Promise<{ index: number; id?: string; status: string; ms: number; error?: string }> {
  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  form.append('image', blob, `load-test-${index}-${filename}`);

  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: form });
    const data = await res.json();
    const ms = Date.now() - start;
    return { index, id: data.id, status: data.status ?? 'error', ms };
  } catch (err: any) {
    const ms = Date.now() - start;
    return { index, status: 'error', ms, error: err.message };
  }
}

async function run() {
  console.log(`\nLoad Test: ${CONCURRENCY} concurrent uploads`);
  console.log(`Image: ${filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
  console.log(`Target: ${API_URL}\n`);

  const start = Date.now();
  const promises = Array.from({ length: CONCURRENCY }, (_, i) => uploadOne(i));
  const results = await Promise.all(promises);
  const totalMs = Date.now() - start;

  const accepted = results.filter((r) => r.status === 'accepted').length;
  const rejected = results.filter((r) => r.status === 'rejected').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const avgMs = Math.round(results.reduce((sum, r) => sum + r.ms, 0) / results.length);
  const maxMs = Math.max(...results.map((r) => r.ms));
  const minMs = Math.min(...results.map((r) => r.ms));

  console.log('--- Results ---');
  console.log(`Total:    ${results.length} uploads`);
  console.log(`Accepted: ${accepted}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`Errors:   ${errors}`);
  console.log(`\nTiming:`);
  console.log(`  Total:   ${totalMs}ms`);
  console.log(`  Average: ${avgMs}ms per upload`);
  console.log(`  Fastest: ${minMs}ms`);
  console.log(`  Slowest: ${maxMs}ms`);
  console.log(`  Throughput: ${((CONCURRENCY / totalMs) * 1000).toFixed(1)} uploads/sec`);

  if (errors > 0) {
    console.log('\nErrors:');
    results.filter((r) => r.error).forEach((r) => {
      console.log(`  [${r.index}] ${r.error}`);
    });
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

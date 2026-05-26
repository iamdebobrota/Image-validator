import imgHash from 'imghash';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Repository, Not, IsNull } from 'typeorm';
import { Image, ImageStatus } from '../entities/Image';

export async function computePHash(buffer: Buffer): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `${uuidv4()}.jpg`);
  try {
    fs.writeFileSync(tmpPath, buffer);
    const hash = await imgHash.hash(tmpPath, 16, 'hex');
    return hash;
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

function hammingDistance(a: string, b: string): number {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += xor.toString(2).split('1').length - 1;
  }
  return dist;
}

export async function checkDuplicate(
  newHash: string,
  imageRepo: Repository<Image>,
  threshold: number
): Promise<{ isDuplicate: boolean; matchId?: string }> {
  const existing = await imageRepo.find({
    where: {
      pHash: Not(IsNull()),
      status: ImageStatus.ACCEPTED,
    },
    select: { id: true, pHash: true },
  });

  for (const img of existing) {
    if (img.pHash) {
      const distance = hammingDistance(newHash, img.pHash);
      if (distance <= threshold) {
        return { isDuplicate: true, matchId: img.id };
      }
    }
  }

  return { isDuplicate: false };
}

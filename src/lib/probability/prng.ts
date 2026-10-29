/**
 * Seeded PRNG using the Mulberry32 algorithm.
 * Guarantees 100% deterministic packet sequences for Daily Challenges and tests.
 */
export class SeededRandom {
  private state: number;

  constructor(seedStringOrNumber: string | number) {
    if (typeof seedStringOrNumber === "number") {
      this.state = seedStringOrNumber >>> 0;
    } else {
      let hash = 0;
      for (let i = 0; i < seedStringOrNumber.length; i++) {
        hash = (Math.imul(31, hash) + seedStringOrNumber.charCodeAt(i)) | 0;
      }
      this.state = hash >>> 0;
    }
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(array: readonly T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }
}

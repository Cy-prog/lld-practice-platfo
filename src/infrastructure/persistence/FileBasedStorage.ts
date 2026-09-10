import fs from "fs/promises";
import path from "path";
import os from "os";

export class FileBasedStorage<T extends { id: string }> {
  private filePath: string;
  private memoryCache: Map<string, T> | null = null;
  private isLoaded = false;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(collectionName: string) {
    // In serverless / read-only environments like Vercel or AWS Lambda, process.cwd() is read-only.
    // Use os.tmpdir() when VERCEL is set so writes succeed without EROFS errors.
    const isServerless = Boolean(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY
    );
    const dataDir = isServerless
      ? path.join(os.tmpdir(), ".lld_data")
      : path.resolve(process.cwd(), ".data");
    this.filePath = path.join(dataDir, `${collectionName}.json`);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isLoaded && this.memoryCache) {
      return;
    }

    try {
      const dataDir = path.dirname(this.filePath);
      await fs.mkdir(dataDir, { recursive: true });

      const content = await fs.readFile(this.filePath, "utf-8");
      const items: T[] = JSON.parse(content);
      this.memoryCache = new Map(items.map((item) => [item.id, item]));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        this.memoryCache = new Map();
        try {
          await this.flushToFile();
        } catch {
          // Ignore
        }
      } else {
        // Corrupted file or read-only filesystem: start fresh in-memory cache
        this.memoryCache = new Map();
      }
    }
    this.isLoaded = true;
  }

  private async flushToFile(): Promise<void> {
    if (!this.memoryCache) return;

    // Chain file writes to prevent race conditions
    this.writeLock = this.writeLock.then(async () => {
      try {
        const dataDir = path.dirname(this.filePath);
        await fs.mkdir(dataDir, { recursive: true });

        const items = Array.from(this.memoryCache!.values());
        const tempPath = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
        const jsonContent = JSON.stringify(items, null, 2);

        await fs.writeFile(tempPath, jsonContent, "utf-8");
        await fs.rename(tempPath, this.filePath);
      } catch (err) {
        // If filesystem write fails on serverless, log and retain data in memoryCache
        console.warn(`Storage file write skipped for ${this.filePath}:`, err);
      }
    });

    await this.writeLock;
  }

  async getAll(): Promise<T[]> {
    await this.ensureInitialized();
    return Array.from(this.memoryCache!.values());
  }

  async getById(id: string): Promise<T | null> {
    await this.ensureInitialized();
    return this.memoryCache!.get(id) || null;
  }

  async save(item: T): Promise<void> {
    await this.ensureInitialized();
    this.memoryCache!.set(item.id, item);
    await this.flushToFile();
  }

  async saveMany(items: T[]): Promise<void> {
    await this.ensureInitialized();
    for (const item of items) {
      this.memoryCache!.set(item.id, item);
    }
    await this.flushToFile();
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existed = this.memoryCache!.delete(id);
    if (existed) {
      await this.flushToFile();
    }
    return existed;
  }

  async clear(): Promise<void> {
    this.memoryCache = new Map();
    this.isLoaded = true;
    await this.flushToFile();
  }
}

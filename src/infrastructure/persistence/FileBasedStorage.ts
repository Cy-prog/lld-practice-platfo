import fs from "fs/promises";
import path from "path";

export class FileBasedStorage<T extends { id: string }> {
  private filePath: string;
  private memoryCache: Map<string, T> | null = null;
  private isLoaded = false;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(collectionName: string) {
    const dataDir = path.resolve(process.cwd(), ".data");
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
        await this.flushToFile();
      } else {
        // Corrupted file handling: start fresh cache but don't overwrite blindly
        console.error(`Error reading ${this.filePath}:`, err);
        this.memoryCache = new Map();
      }
    }
    this.isLoaded = true;
  }

  private async flushToFile(): Promise<void> {
    if (!this.memoryCache) return;

    // Chain file writes to prevent race conditions
    this.writeLock = this.writeLock.then(async () => {
      const dataDir = path.dirname(this.filePath);
      await fs.mkdir(dataDir, { recursive: true });

      const items = Array.from(this.memoryCache!.values());
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      const jsonContent = JSON.stringify(items, null, 2);

      await fs.writeFile(tempPath, jsonContent, "utf-8");
      await fs.rename(tempPath, this.filePath);
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

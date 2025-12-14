import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

/**
 * Storage Service
 * Provides abstraction layer for file storage operations
 * Supports local filesystem and can be extended for S3/MinIO
 * 
 * Design Pattern: Strategy Pattern for different storage backends
 */

export interface StorageFile {
  key: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export interface StorageResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface StorageConfig {
  type: "local" | "s3";
  basePath?: string;           // For local storage
  bucket?: string;             // For S3
  region?: string;             // For S3
  accessKeyId?: string;        // For S3
  secretAccessKey?: string;    // For S3
  endpoint?: string;           // For S3-compatible (MinIO)
}

/**
 * Storage Provider Interface
 */
export interface IStorageProvider {
  upload(file: StorageFile): Promise<StorageResult>;
  download(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
  getStream(key: string): Promise<Readable | null>;
}

/**
 * Local Filesystem Storage Provider
 */
export class LocalStorageProvider implements IStorageProvider {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string = "uploads", baseUrl: string = "/uploads") {
    this.basePath = path.join(process.cwd(), basePath);
    this.baseUrl = baseUrl;
    
    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(file: StorageFile): Promise<StorageResult> {
    try {
      // Create directory structure based on key
      const fullPath = path.join(this.basePath, file.key);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file asynchronously
      await fs.promises.writeFile(fullPath, file.buffer);

      return {
        success: true,
        key: file.key,
        url: this.getUrl(file.key),
      };
    } catch (error: any) {
      console.error("Local storage upload failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async download(key: string): Promise<Buffer | null> {
    try {
      // Handle both old format (/uploads/recordings/...) and new format (recordings/...)
      let normalizedKey = key;
      if (normalizedKey.startsWith('/uploads/')) {
        normalizedKey = normalizedKey.substring('/uploads/'.length);
      }
      
      const fullPath = path.join(this.basePath, normalizedKey);
      
      if (!fs.existsSync(fullPath)) {
        console.warn(`[LocalStorage] File not found: ${fullPath}`);
        return null;
      }
      return await fs.promises.readFile(fullPath);
    } catch (error) {
      console.error("Local storage download failed:", error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, key);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Local storage delete failed:", error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, key);
    return fs.existsSync(fullPath);
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  async getStream(key: string): Promise<Readable | null> {
    try {
      const fullPath = path.join(this.basePath, key);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      return fs.createReadStream(fullPath);
    } catch (error) {
      console.error("Local storage stream failed:", error);
      return null;
    }
  }

  /**
   * Get full filesystem path (for local operations)
   */
  getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }
}

/**
 * S3 Storage Provider (placeholder - implement when needed)
 * 
 * For production, install @aws-sdk/client-s3 and implement:
 * - upload: PutObjectCommand
 * - download: GetObjectCommand
 * - delete: DeleteObjectCommand
 * - exists: HeadObjectCommand
 */
export class S3StorageProvider implements IStorageProvider {
  private bucket: string;
  private region: string;
  private endpoint?: string;
  // private s3Client: S3Client;

  constructor(config: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;

    // TODO: Uncomment when @aws-sdk/client-s3 is installed
    // this.s3Client = new S3Client({
    //   region: config.region,
    //   endpoint: config.endpoint,
    //   credentials: {
    //     accessKeyId: config.accessKeyId,
    //     secretAccessKey: config.secretAccessKey,
    //   },
    // });
    
    console.warn("⚠️  S3StorageProvider is a placeholder. Install @aws-sdk/client-s3 for production use.");
  }

  async upload(file: StorageFile): Promise<StorageResult> {
    // TODO: Implement with S3Client.send(new PutObjectCommand({...}))
    console.warn("S3 upload not implemented. Using local fallback.");
    return {
      success: false,
      error: "S3 storage not implemented. Please configure local storage or implement S3.",
    };
  }

  async download(key: string): Promise<Buffer | null> {
    // TODO: Implement with S3Client.send(new GetObjectCommand({...}))
    console.warn("S3 download not implemented.");
    return null;
  }

  async delete(key: string): Promise<boolean> {
    // TODO: Implement with S3Client.send(new DeleteObjectCommand({...}))
    console.warn("S3 delete not implemented.");
    return false;
  }

  async exists(key: string): Promise<boolean> {
    // TODO: Implement with S3Client.send(new HeadObjectCommand({...}))
    console.warn("S3 exists check not implemented.");
    return false;
  }

  getUrl(key: string): string {
    if (this.endpoint) {
      // MinIO or S3-compatible
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getStream(key: string): Promise<Readable | null> {
    // TODO: Implement with S3Client.send(new GetObjectCommand({...}))
    console.warn("S3 stream not implemented.");
    return null;
  }
}

/**
 * Storage Service Factory
 * Creates appropriate storage provider based on configuration
 */
export class StorageService {
  private provider: IStorageProvider;
  private static instance: StorageService;

  constructor(config?: StorageConfig) {
    const storageType = config?.type || process.env.STORAGE_TYPE || "local";

    if (storageType === "s3" && config?.bucket) {
      this.provider = new S3StorageProvider({
        bucket: config.bucket,
        region: config.region || process.env.AWS_REGION || "us-east-1",
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
        endpoint: config.endpoint || process.env.S3_ENDPOINT,
      });
    } else {
      this.provider = new LocalStorageProvider(
        config?.basePath || process.env.UPLOAD_PATH || "uploads",
        process.env.UPLOAD_BASE_URL || "/uploads"
      );
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Upload a file
   */
  async upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    directory: string = ""
  ): Promise<StorageResult> {
    const key = directory ? `${directory}/${fileName}` : fileName;
    return this.provider.upload({
      key,
      buffer,
      mimeType,
      size: buffer.length,
    });
  }

  /**
   * Upload audio file for speaking practice
   */
  async uploadAudio(
    buffer: Buffer,
    attemptId: string,
    fileName: string,
    mimeType: string
  ): Promise<StorageResult> {
    const key = `audio/${attemptId}/${Date.now()}_${fileName}`;
    return this.provider.upload({
      key,
      buffer,
      mimeType,
      size: buffer.length,
    });
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(
    buffer: Buffer,
    userId: string,
    fileName: string,
    mimeType: string
  ): Promise<StorageResult> {
    const ext = path.extname(fileName);
    const key = `avatars/${userId}${ext}`;
    return this.provider.upload({
      key,
      buffer,
      mimeType,
      size: buffer.length,
    });
  }

  /**
   * Download a file
   */
  async download(key: string): Promise<Buffer | null> {
    return this.provider.download(key);
  }

  /**
   * Get file stream (for efficient large file handling)
   */
  async getStream(key: string): Promise<Readable | null> {
    return this.provider.getStream(key);
  }

  /**
   * Delete a file
   */
  async delete(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }

  /**
   * Check if file exists
   */
  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  /**
   * Get public URL for a file
   */
  getUrl(key: string): string {
    return this.provider.getUrl(key);
  }

  /**
   * Get the underlying provider (for advanced operations)
   */
  getProvider(): IStorageProvider {
    return this.provider;
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();







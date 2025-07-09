import fs from 'fs';
import path from 'path';

export class FileValidator {
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  static isPDF(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.pdf';
  }

  static validatePDF(filePath: string): { valid: boolean; error?: string } {
    if (!filePath || filePath.trim().length === 0) {
      return { valid: false, error: 'PDF path cannot be empty' };
    }

    if (!this.exists(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }

    if (!this.isPDF(filePath)) {
      return { valid: false, error: 'File must be a PDF' };
    }

    return { valid: true };
  }

  static getFileInfo(filePath: string): { name: string; size: number; extension: string } {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      size: stats.size,
      extension: path.extname(filePath)
    };
  }
}
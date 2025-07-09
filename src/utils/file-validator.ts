import fs from 'fs';
import path from 'path';

/**
 * Utility class for file validation operations
 */
export class FileValidator {
  /**
   * Check if a file exists at the given path
   */
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Check if a file is a PDF based on its extension
   */
  static isPDF(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.pdf';
  }

  /**
   * Validate that a file is a valid PDF
   */
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

  /**
   * Get basic file information
   */
  static getFileInfo(filePath: string): { name: string; size: number; extension: string } {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      size: stats.size,
      extension: path.extname(filePath)
    };
  }
}
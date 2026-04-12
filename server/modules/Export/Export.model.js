/**
 * Export Model
 * Represents a data export transaction
 */

class Export {
  constructor(data = {}) {
    this.machineId = data.machineId || null;
    this.exportType = data.exportType || 'manual'; // daily, weekly, manual
    this.dateRange = data.dateRange || {
      start: new Date(),
      end: new Date()
    };
    this.exportPath = data.exportPath || null;
    this.recordCount = data.recordCount || 0;
    this.exportedAt = data.exportedAt || new Date();
    this.status = data.status || 'pending'; // pending, completed, failed
    this.errorMessage = data.errorMessage || null;
    this.fileSize = data.fileSize || null;
    this.checksum = data.checksum || null;
  }

  /**
   * Mark export as completed
   */
  markCompleted(fileSize, checksum) {
    this.status = 'completed';
    this.fileSize = fileSize;
    this.checksum = checksum;
    return this;
  }

  /**
   * Mark export as failed
   */
  markFailed(errorMessage) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    return this;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      machineId: this.machineId,
      exportType: this.exportType,
      dateRange: this.dateRange,
      exportPath: this.exportPath,
      recordCount: this.recordCount,
      exportedAt: this.exportedAt,
      status: this.status,
      errorMessage: this.errorMessage,
      fileSize: this.fileSize,
      checksum: this.checksum
    };
  }
}

module.exports = Export;

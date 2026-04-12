import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Events Collection Schema
 * Stores raw event stream: machine pulses, status changes, problems, manual logs
 * TTL index automatically deletes documents older than 15 months (450 days)
 */
const eventSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['pulse', 'status_change', 'problem', 'roll_weight', 'downtime', 'quality'],
      required: true,
      index: true,
    },
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      // Type-specific nested data:
      // pulse: { rotation: number, runtime: string, runtimeSeconds: number }
      // status_change: { newStatus: string, oldStatus: string }
      // problem: { problemType: string, downtime: number, downtimeSeconds: number }
      // roll_weight: { weight: number, rollNumber: number }
      // downtime: { reason: string, remarks: string }
      // quality: { faultType: string, severity: string, description: string }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // TTL index set below - automatically removes documents after 450 days (15 months)
    },
  },
  { timestamps: false }
);

// Compound index for efficient querying by machine and time
eventSchema.index({ machineId: 1, timestamp: -1 });

// TTL index: automatically delete documents 450 days (15 months) after creation
// 450 days = 15 * 30 days
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 450 * 24 * 60 * 60 });

/**
 * KPI Snapshots Collection Schema
 * Pre-computed daily and weekly aggregations of raw events
 * Used for dashboard historical view without real-time aggregation overhead
 */
const kpiSnapshotSchema = new Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly'],
      required: true,
      index: true,
    },
    snapshotDate: {
      type: Date,
      required: true,
      index: true,
    },
    metrics: {
      totalPulses: { type: Number, default: 0 },
      totalRuntime: { type: Number, default: 0 }, // in seconds
      totalDowntime: { type: Number, default: 0 }, // in seconds
      problemCount: { type: Number, default: 0 },
      averageRollWeight: { type: Number, default: 0 },
      qualityLogCount: { type: Number, default: 0 },
      downtimeLogCount: { type: Number, default: 0 },
      machineTimesActuallyRanInMinutes: { type: Number, default: 0 },
      actualRollsCompleted: { type: Number, default: 0 },
      qualityDefects: { type: Number, default: 0 },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    timestamps: false,
    collection: 'kpi_snapshots'
  }
);

// Index for efficient snapshot queries
kpiSnapshotSchema.index({ machineId: 1, period: 1, snapshotDate: -1 });

/**
 * Exports Collection Schema
 * Audit trail of data exports (for compliance and recovery before TTL deletion)
 * Tracks which data batches were exported and when
 */
const exportSchema = new Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    exportType: {
      type: String,
      enum: ['daily', 'weekly', 'manual'],
      required: true,
    },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    exportPath: {
      type: String,
      required: true,
    },
    recordCount: {
      type: Number,
      required: true,
    },
    exportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    errorMessage: String,
    fileSize: Number, // in bytes
    checksum: String, // for data integrity verification
  },
  {
    timestamps: true,
    collection: 'exports'
  }
);

// Index for efficient export history queries
exportSchema.index({ machineId: 1, exportedAt: -1 });
exportSchema.index({ status: 1, exportedAt: -1 });

/**
 * Initialize indexes when models are created
 */
export async function initializeIndexes() {
  try {
    const Event = mongoose.model('Event', eventSchema);
    const KPISnapshot = mongoose.model('KPISnapshot', kpiSnapshotSchema);
    const Export = mongoose.model('Export', exportSchema);

    // Sync indexes (this will create indexes defined in schema)
    await Event.syncIndexes();
    await KPISnapshot.syncIndexes();
    await Export.syncIndexes();

    console.log('✅ MongoDB indexes created/verified');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    throw error;
  }
}

export const Event = mongoose.model('Event', eventSchema);
export const KPISnapshot = mongoose.model('KPISnapshot', kpiSnapshotSchema);
export const Export = mongoose.model('Export', exportSchema);

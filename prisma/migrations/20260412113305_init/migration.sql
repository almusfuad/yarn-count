-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('pulse', 'status_change', 'problem', 'roll_weight', 'downtime', 'quality');

-- CreateEnum
CREATE TYPE "SnapshotPeriod" AS ENUM ('daily', 'weekly');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('daily', 'weekly', 'manual');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('online', 'offline', 'maintenance', 'error');

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "status" "MachineStatus" NOT NULL DEFAULT 'online',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_snapshots" (
    "id" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "period" "SnapshotPeriod" NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "exportType" "ExportType" NOT NULL,
    "dateRange" JSONB NOT NULL DEFAULT '{}',
    "exportPath" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ExportStatus" NOT NULL DEFAULT 'pending',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_machineId_timestamp_idx" ON "events"("machineId", "timestamp");

-- CreateIndex
CREATE INDEX "events_timestamp_idx" ON "events"("timestamp");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "kpi_snapshots_machineId_period_snapshotDate_idx" ON "kpi_snapshots"("machineId", "period", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_snapshots_machineId_period_snapshotDate_key" ON "kpi_snapshots"("machineId", "period", "snapshotDate");

-- CreateIndex
CREATE INDEX "exports_machineId_status_idx" ON "exports"("machineId", "status");

-- CreateIndex
CREATE INDEX "exports_status_idx" ON "exports"("status");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_snapshots" ADD CONSTRAINT "kpi_snapshots_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

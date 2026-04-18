-- CreateTable
CREATE TABLE "IntakeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "transcript" TEXT NOT NULL DEFAULT '',
    "lat" REAL,
    "lng" REAL,
    "ticket" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'intake',
    "incidentId" TEXT
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reporterKind" TEXT NOT NULL DEFAULT 'dispatcher',
    "mediaUrl" TEXT,
    "assignedUnitId" TEXT,
    "eta" INTEGER,
    "intakeSessionId" TEXT,
    CONSTRAINT "Incident_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Incident_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callsign" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available'
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "stillUrl" TEXT NOT NULL,
    "lastCongestion" REAL,
    "lastSampledAt" DATETIME
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actions" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSession_incidentId_key" ON "IntakeSession"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_intakeSessionId_key" ON "Incident"("intakeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_callsign_key" ON "Unit"("callsign");

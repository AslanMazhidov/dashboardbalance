-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "salesPlan" REAL NOT NULL DEFAULT 0,
    "salesFact" REAL NOT NULL DEFAULT 0,
    "discounts" REAL NOT NULL DEFAULT 0,
    "salesWithDiscounts" REAL NOT NULL DEFAULT 0,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "yandexFood" REAL NOT NULL DEFAULT 0,
    "salesDeviation" REAL NOT NULL DEFAULT 0,
    "monthSalesPlan" REAL NOT NULL DEFAULT 0,
    "monthSalesFact" REAL NOT NULL DEFAULT 0,
    "monthSalesDeviation" REAL NOT NULL DEFAULT 0,
    "monthSalesDeviationRub" REAL NOT NULL DEFAULT 0,
    "ordersPlan" REAL NOT NULL DEFAULT 0,
    "ordersFact" INTEGER NOT NULL DEFAULT 0,
    "ordersDeviation" REAL NOT NULL DEFAULT 0,
    "loyaltyPlan" REAL NOT NULL DEFAULT 0,
    "loyaltyFact" INTEGER NOT NULL DEFAULT 0,
    "loyaltyPenetration" REAL NOT NULL DEFAULT 0,
    "loyaltyDeviation" REAL NOT NULL DEFAULT 0,
    "avgCheckPlan" REAL NOT NULL DEFAULT 0,
    "avgCheckFact" REAL NOT NULL DEFAULT 0,
    "avgCheckDeviation" REAL NOT NULL DEFAULT 0,
    "fillRatePlan" REAL NOT NULL DEFAULT 0,
    "fillRateFact" REAL NOT NULL DEFAULT 0,
    "avgDishes" REAL NOT NULL DEFAULT 0,
    "avgDrinks" REAL NOT NULL DEFAULT 0,
    "portions" REAL NOT NULL DEFAULT 0,
    "productivityPlan" REAL NOT NULL DEFAULT 0,
    "hoursWorked" REAL NOT NULL DEFAULT 0,
    "productivityFact" REAL NOT NULL DEFAULT 0,
    "orderDeliveryTime" REAL NOT NULL DEFAULT 0,
    "importBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyReport_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DailyReport_locationId_idx" ON "DailyReport"("locationId");

-- CreateIndex
CREATE INDEX "DailyReport_date_idx" ON "DailyReport"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_locationId_date_key" ON "DailyReport"("locationId", "date");

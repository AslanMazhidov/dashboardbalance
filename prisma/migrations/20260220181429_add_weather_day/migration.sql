-- CreateTable
CREATE TABLE "WeatherDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "tempMin" REAL NOT NULL,
    "tempMax" REAL NOT NULL,
    "tempMean" REAL NOT NULL,
    "precipitation" REAL NOT NULL,
    "weatherCode" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherDay_date_key" ON "WeatherDay"("date");

-- CreateIndex
CREATE INDEX "WeatherDay_date_idx" ON "WeatherDay"("date");

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'ULTRA_RARE', 'SECRET_RARE');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 'DAMAGED');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "set" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "condition" "Condition" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_set_idx" ON "Card"("set");

-- CreateIndex
CREATE INDEX "Card_rarity_idx" ON "Card"("rarity");

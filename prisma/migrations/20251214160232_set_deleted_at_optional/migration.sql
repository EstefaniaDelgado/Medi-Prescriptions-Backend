-- AlterTable
ALTER TABLE "doctors" ALTER COLUMN "deletedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "deletedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "prescriptions" ALTER COLUMN "deletedAt" DROP NOT NULL;

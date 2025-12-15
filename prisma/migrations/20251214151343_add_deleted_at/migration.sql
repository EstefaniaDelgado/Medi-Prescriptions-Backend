/*
  Warnings:

  - Added the required column `deletedAt` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deletedAt` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deletedAt` to the `prescriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deletedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

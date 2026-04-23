-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "aiApiKey" TEXT,
ADD COLUMN     "aiProvider" TEXT,
ADD COLUMN     "billingCycle" TEXT,
ADD COLUMN     "billingPlan" TEXT,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ad_sets_campaignId_idx" ON "ad_sets"("campaignId");

-- CreateIndex
CREATE INDEX "ai_usage_workspaceId_idx" ON "ai_usage"("workspaceId");

-- CreateIndex
CREATE INDEX "ai_usage_campaignId_idx" ON "ai_usage"("campaignId");

-- CreateIndex
CREATE INDEX "audit_logs_campaignId_idx" ON "audit_logs"("campaignId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "campaigns_workspaceId_idx" ON "campaigns"("workspaceId");

-- CreateIndex
CREATE INDEX "campaigns_createdById_idx" ON "campaigns"("createdById");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "comments_pieceId_idx" ON "comments"("pieceId");

-- CreateIndex
CREATE INDEX "comments_campaignId_idx" ON "comments"("campaignId");

-- CreateIndex
CREATE INDEX "pieces_adSetId_idx" ON "pieces"("adSetId");

-- CreateIndex
CREATE INDEX "pieces_assigneeId_idx" ON "pieces"("assigneeId");

-- CreateIndex
CREATE INDEX "pieces_taskStatus_idx" ON "pieces"("taskStatus");

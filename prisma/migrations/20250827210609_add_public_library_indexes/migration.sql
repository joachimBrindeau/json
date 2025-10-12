-- CreateIndex
CREATE INDEX "json_documents_visibility_idx" ON "public"."json_documents"("visibility");

-- CreateIndex
CREATE INDEX "json_documents_published_at_idx" ON "public"."json_documents"("published_at");

-- CreateIndex
CREATE INDEX "json_documents_view_count_idx" ON "public"."json_documents"("view_count");

-- CreateIndex
CREATE INDEX "json_documents_visibility_published_at_idx" ON "public"."json_documents"("visibility", "published_at");

-- CreateIndex
CREATE INDEX "json_documents_visibility_created_at_idx" ON "public"."json_documents"("visibility", "created_at");

-- CreateIndex
CREATE INDEX "json_documents_visibility_view_count_idx" ON "public"."json_documents"("visibility", "view_count");

-- CreateIndex
CREATE INDEX "json_documents_tags_idx" ON "public"."json_documents" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "json_documents_category_idx" ON "public"."json_documents"("category");

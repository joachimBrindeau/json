-- CreateTable
CREATE TABLE "public"."seo_settings" (
    "id" TEXT NOT NULL,
    "page_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "og_image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_page_key_key" ON "public"."seo_settings"("page_key");

-- CreateIndex
CREATE INDEX "seo_settings_page_key_idx" ON "public"."seo_settings"("page_key");

-- CreateIndex
CREATE INDEX "seo_settings_is_active_idx" ON "public"."seo_settings"("is_active");

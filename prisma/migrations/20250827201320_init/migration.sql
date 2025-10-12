-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."json_documents" (
    "id" UUID NOT NULL,
    "share_id" TEXT NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "metadata" JSONB,
    "size" BIGINT NOT NULL,
    "node_count" INTEGER NOT NULL DEFAULT 0,
    "max_depth" INTEGER NOT NULL DEFAULT 0,
    "complexity" TEXT NOT NULL DEFAULT 'Low',
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "user_id" TEXT,
    "expires_at" TIMESTAMPTZ,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "published_at" TIMESTAMP(3),
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "accessed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "json_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."json_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "json_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."json_analytics" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "parse_time" INTEGER NOT NULL,
    "render_time" INTEGER,
    "memory_usage" BIGINT,
    "view_count" INTEGER NOT NULL DEFAULT 1,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "json_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."json_sessions" (
    "id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "document_id" UUID,
    "connection_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cursor" JSONB,
    "selection" JSONB,
    "viewport" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "json_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "json_documents_share_id_key" ON "public"."json_documents"("share_id");

-- CreateIndex
CREATE UNIQUE INDEX "json_documents_slug_key" ON "public"."json_documents"("slug");

-- CreateIndex
CREATE INDEX "json_documents_size_idx" ON "public"."json_documents"("size");

-- CreateIndex
CREATE INDEX "json_documents_complexity_idx" ON "public"."json_documents"("complexity");

-- CreateIndex
CREATE INDEX "json_documents_created_at_idx" ON "public"."json_documents"("created_at");

-- CreateIndex
CREATE INDEX "json_documents_share_id_idx" ON "public"."json_documents"("share_id");

-- CreateIndex
CREATE INDEX "json_documents_user_id_idx" ON "public"."json_documents"("user_id");

-- CreateIndex
CREATE INDEX "json_documents_expires_at_idx" ON "public"."json_documents"("expires_at");

-- CreateIndex
CREATE INDEX "json_documents_is_anonymous_idx" ON "public"."json_documents"("is_anonymous");

-- CreateIndex
CREATE INDEX "json_content_gin" ON "public"."json_documents" USING GIN ("content");

-- CreateIndex
CREATE INDEX "json_chunks_document_id_chunk_index_idx" ON "public"."json_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "json_chunks_path_idx" ON "public"."json_chunks"("path");

-- CreateIndex
CREATE UNIQUE INDEX "json_chunks_document_id_chunk_index_key" ON "public"."json_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "json_analytics_document_id_idx" ON "public"."json_analytics"("document_id");

-- CreateIndex
CREATE INDEX "json_analytics_last_viewed_idx" ON "public"."json_analytics"("last_viewed");

-- CreateIndex
CREATE UNIQUE INDEX "json_sessions_session_id_key" ON "public"."json_sessions"("session_id");

-- CreateIndex
CREATE INDEX "json_sessions_session_id_idx" ON "public"."json_sessions"("session_id");

-- CreateIndex
CREATE INDEX "json_sessions_document_id_idx" ON "public"."json_sessions"("document_id");

-- CreateIndex
CREATE INDEX "json_sessions_expires_at_idx" ON "public"."json_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."json_documents" ADD CONSTRAINT "json_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."json_chunks" ADD CONSTRAINT "json_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."json_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."json_analytics" ADD CONSTRAINT "json_analytics_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."json_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

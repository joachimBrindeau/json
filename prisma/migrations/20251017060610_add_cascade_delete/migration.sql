-- DropForeignKey
ALTER TABLE "public"."json_documents" DROP CONSTRAINT "json_documents_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."json_documents" ADD CONSTRAINT "json_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

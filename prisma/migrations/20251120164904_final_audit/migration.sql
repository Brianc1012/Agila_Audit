-- CreateTable
CREATE TABLE "action_type" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type_id" INTEGER NOT NULL,
    "action_by" TEXT,
    "action_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_data" JSONB,
    "new_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_type_code_key" ON "action_type"("code");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_action_type_id_idx" ON "audit_log"("action_type_id");

-- CreateIndex
CREATE INDEX "audit_log_action_by_idx" ON "audit_log"("action_by");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_action_type_id_action_at_idx" ON "audit_log"("entity_type", "action_type_id", "action_at");

-- CreateIndex
CREATE INDEX "audit_log_action_at_idx" ON "audit_log"("action_at");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_entity_type_entity_id_version_key" ON "audit_log"("entity_type", "entity_id", "version");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_action_type_id_fkey" FOREIGN KEY ("action_type_id") REFERENCES "action_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE app_knowledge_reads ADD COLUMN IF NOT EXISTS total_read_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE app_knowledge_reads ADD COLUMN IF NOT EXISTS max_scroll_percent integer NOT NULL DEFAULT 0;

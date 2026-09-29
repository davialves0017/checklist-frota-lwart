ALTER TABLE `inspection_answers` ADD `action_status` text DEFAULT 'pendente' NOT NULL;
ALTER TABLE `inspection_answers` ADD `action_plan` text DEFAULT '' NOT NULL;
ALTER TABLE `inspection_answers` ADD `action_owner` text DEFAULT '' NOT NULL;
ALTER TABLE `inspection_answers` ADD `action_due_date` text;
ALTER TABLE `inspection_answers` ADD `action_updated_at` text;
ALTER TABLE `inspection_answers` ADD `action_updated_by` text;

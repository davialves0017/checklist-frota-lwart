CREATE TABLE `inspection_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inspection_id` text NOT NULL,
	`item_number` integer NOT NULL,
	`question` text NOT NULL,
	`response` text NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`is_problem` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`inspection_id`) REFERENCES `inspections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_answers_inspection_id` ON `inspection_answers` (`inspection_id`);--> statement-breakpoint
CREATE INDEX `idx_answers_problem` ON `inspection_answers` (`is_problem`);--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`checklist_type` text NOT NULL,
	`inspector_name` text NOT NULL,
	`inspection_date` text NOT NULL,
	`km` integer NOT NULL,
	`fleet` text NOT NULL,
	`plate` text NOT NULL,
	`branch` text NOT NULL,
	`photo_key` text NOT NULL,
	`signature_key` text NOT NULL,
	`total_items` integer NOT NULL,
	`problem_count` integer DEFAULT 0 NOT NULL,
	`action_status` text DEFAULT 'pendente' NOT NULL,
	`action_plan` text DEFAULT '' NOT NULL,
	`action_owner` text DEFAULT '' NOT NULL,
	`action_due_date` text,
	`created_at` text NOT NULL,
	`action_updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_inspections_created_at` ON `inspections` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inspections_fleet` ON `inspections` (`fleet`);--> statement-breakpoint
CREATE INDEX `idx_inspections_action_status` ON `inspections` (`action_status`);
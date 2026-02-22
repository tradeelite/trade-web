CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `holdings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portfolio_id` integer NOT NULL,
	`ticker` text NOT NULL,
	`shares` real NOT NULL,
	`avg_cost` real NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_holding` ON `holdings` (`portfolio_id`,`ticker`);--> statement-breakpoint
CREATE TABLE `ocr_uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`extracted_data` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `option_trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticker` text NOT NULL,
	`option_type` text NOT NULL,
	`direction` text NOT NULL,
	`strike_price` real NOT NULL,
	`expiry_date` text NOT NULL,
	`premium` real NOT NULL,
	`quantity` integer NOT NULL,
	`brokerage` text,
	`status` text DEFAULT 'open' NOT NULL,
	`close_premium` real,
	`close_date` text,
	`notes` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

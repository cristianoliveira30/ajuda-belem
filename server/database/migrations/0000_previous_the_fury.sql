CREATE TABLE `historico_solicitacao` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`protocolo` text NOT NULL,
	`status` text NOT NULL,
	`data` text NOT NULL,
	`mensagem` text NOT NULL,
	FOREIGN KEY (`protocolo`) REFERENCES `solicitacoes`(`protocolo`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `historico_protocolo_idx` ON `historico_solicitacao` (`protocolo`);--> statement-breakpoint
CREATE TABLE `solicitacoes` (
	`protocolo` text PRIMARY KEY NOT NULL,
	`user_id` integer,
	`categoria` text NOT NULL,
	`rua` text NOT NULL,
	`numero` text NOT NULL,
	`bairro` text NOT NULL,
	`complemento` text,
	`ponto_referencia` text,
	`descricao` text NOT NULL,
	`fotos` text,
	`risco` text,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`telefone` text NOT NULL,
	`cpf` text,
	`status` text NOT NULL,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `solicitacoes_email_idx` ON `solicitacoes` (`email`);--> statement-breakpoint
CREATE INDEX `solicitacoes_cpf_idx` ON `solicitacoes` (`cpf`);--> statement-breakpoint
CREATE INDEX `solicitacoes_user_id_idx` ON `solicitacoes` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`cpf` text,
	`telefone` text,
	`papel` text,
	`secretaria` text,
	`criado_em` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_cpf_unique` ON `users` (`cpf`);
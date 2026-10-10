CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reading_id" uuid,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"locale" text NOT NULL,
	"tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_atoms" (
	"id" text PRIMARY KEY NOT NULL,
	"tradition" text NOT NULL,
	"key" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"body_md" text NOT NULL,
	"tone" text,
	"source_ref" text,
	"author" text,
	"reviewer" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credits_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_content" (
	"date" date NOT NULL,
	"locale" text NOT NULL,
	"segment_key" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	CONSTRAINT "daily_content_date_locale_segment_key_pk" PRIMARY KEY("date","locale","segment_key")
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"user_id" uuid NOT NULL,
	"product" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"expires_at" timestamp with time zone,
	"trial" boolean DEFAULT false NOT NULL,
	"raw_json" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_user_id_product_pk" PRIMARY KEY("user_id","product")
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"variant" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experiments_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "glossary" (
	"term_key" text NOT NULL,
	"locale" text NOT NULL,
	"term" text NOT NULL,
	"note" text,
	CONSTRAINT "glossary_term_key_locale_pk" PRIMARY KEY("term_key","locale")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"is_self" boolean DEFAULT false NOT NULL,
	"birth_enc" "bytea" NOT NULL,
	"birth_hash" text NOT NULL,
	"core_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_user_id_token_pk" PRIMARY KEY("user_id","token")
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid,
	"partner_profile_id" uuid,
	"kind" text NOT NULL,
	"locale" text NOT NULL,
	"input_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"engine_json" jsonb,
	"ai_json" jsonb,
	"ai_model" text,
	"tokens" integer,
	"cost_usd" numeric(10, 5),
	"paid_by" text DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"longest" integer DEFAULT 0 NOT NULL,
	"last_date" date
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_uid" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"country" text,
	"tradition_pack" text DEFAULT 'western' NOT NULL,
	"calendar_standard" text DEFAULT 'cn' NOT NULL,
	"tz" text DEFAULT 'UTC' NOT NULL,
	"daily_hour" smallint DEFAULT 7 NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_auth_uid_unique" UNIQUE("auth_uid")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"type" text NOT NULL,
	"user_id" uuid,
	"raw_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_reading_id_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits_ledger" ADD CONSTRAINT "credits_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_partner_profile_id_profiles_id_fk" FOREIGN KEY ("partner_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_messages_user_idx" ON "ai_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_atoms_key_locale_version" ON "content_atoms" USING btree ("key","locale","version");--> statement-breakpoint
CREATE INDEX "content_atoms_key_idx" ON "content_atoms" USING btree ("key","status");--> statement-breakpoint
CREATE INDEX "credits_ledger_user_idx" ON "credits_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credits_ledger_ref_idx" ON "credits_ledger" USING btree ("ref_id");--> statement-breakpoint
CREATE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profiles_hash_idx" ON "profiles" USING btree ("birth_hash");--> statement-breakpoint
CREATE INDEX "readings_user_idx" ON "readings" USING btree ("user_id","created_at");
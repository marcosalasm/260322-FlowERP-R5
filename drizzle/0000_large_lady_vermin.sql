CREATE TABLE "accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"purchase_order_id" integer,
	"subcontract_id" integer,
	"supplier_id" integer,
	"supplier_name" text NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"paid_amount" numeric DEFAULT '0',
	"credited_amount" numeric DEFAULT '0',
	"applied_credit_note_ids" jsonb DEFAULT '[]'::jsonb,
	"payments" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'Pendiente de Pago' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_receivable" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"offer_id" integer,
	"client_name" text NOT NULL,
	"company_name" text,
	"payment_date" date,
	"contract_amount" numeric DEFAULT '0' NOT NULL,
	"payments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "administrative_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"year" integer NOT NULL,
	"name" text NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'Borrador' NOT NULL,
	"approval_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "administrative_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"date" date NOT NULL,
	"category_id" integer NOT NULL,
	"budget_id" integer,
	"amount" numeric DEFAULT '0' NOT NULL,
	"supplier" text NOT NULL,
	"description" text NOT NULL,
	"invoice_number" text,
	"payment_proof_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"details" jsonb,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bonos" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"nombre" text NOT NULL,
	"tipo_bono" text NOT NULL,
	"entidad" text NOT NULL,
	"estatus" text NOT NULL,
	"ubicacion" text NOT NULL,
	"fecha_entrega" date NOT NULL,
	"monto" numeric DEFAULT '0' NOT NULL,
	"budget_id" integer,
	"constructora" text,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"logs" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"budget_id" integer,
	"item_number" text,
	"description" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_sub_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"activity_id" integer,
	"item_number" text,
	"description" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL,
	"material_unit_cost" numeric DEFAULT '0' NOT NULL,
	"labor_unit_cost" numeric DEFAULT '0' NOT NULL,
	"subcontract_unit_cost" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"consecutive_number" text NOT NULL,
	"prospect_id" integer,
	"date" date NOT NULL,
	"description" text,
	"indirect_costs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"direct_cost_total" numeric DEFAULT '0' NOT NULL,
	"indirect_cost_total" numeric DEFAULT '0' NOT NULL,
	"total" numeric DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'CRC' NOT NULL,
	"tax_rate" numeric DEFAULT '0' NOT NULL,
	"final_total" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"consecutive" text NOT NULL,
	"offer_id" integer,
	"project_name" text,
	"description" text NOT NULL,
	"change_type" text NOT NULL,
	"amount_impact" numeric DEFAULT '0' NOT NULL,
	"budget_impact" numeric DEFAULT '0' NOT NULL,
	"creation_date" text,
	"approval_date" text,
	"status" text DEFAULT 'Pendiente Aprobación' NOT NULL,
	"budget_id" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"legal_id" text,
	"address" text,
	"phone" text,
	"email" text,
	"logo_base64" text,
	"country" text DEFAULT 'CR',
	"iva_rate" numeric DEFAULT '13',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_note_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"credit_note_id" integer,
	"purchase_order_item_id" integer,
	"name" text NOT NULL,
	"quantity_to_credit" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"credit_amount" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"goods_receipt_id" integer,
	"purchase_order_id" integer,
	"project_id" integer,
	"supplier_id" integer,
	"supplier_name" text NOT NULL,
	"creation_date" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"approval_date" timestamp with time zone,
	"reason" text NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Pendiente Aprobación' NOT NULL,
	"applied_to_invoice" boolean DEFAULT false,
	"pdf_attachment_name" text
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"goods_receipt_id" integer,
	"purchase_order_item_id" integer,
	"name" text NOT NULL,
	"quantity_ordered" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL,
	"quantity_received" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"purchase_order_id" integer,
	"creation_date" date NOT NULL,
	"expected_receipt_date" date,
	"actual_receipt_date" date,
	"received_by" text,
	"status" text DEFAULT 'Pendiente de Recepción' NOT NULL,
	"notes" text,
	"closed_by_credit_note_ids" jsonb DEFAULT '[]'::jsonb,
	"is_subcontract_receipt" boolean DEFAULT false,
	"amount_received" numeric DEFAULT '0',
	"progress_description" text,
	"subcontractor_invoice" text
);
--> statement-breakpoint
CREATE TABLE "labor_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"hourly_rate" numeric DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'CRC' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"unit_cost" numeric,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"consecutive_number" text NOT NULL,
	"prospect_id" integer,
	"date" date NOT NULL,
	"description" text,
	"amount" numeric DEFAULT '0' NOT NULL,
	"budget_amount" numeric DEFAULT '0' NOT NULL,
	"project_type" text NOT NULL,
	"status" text DEFAULT 'Confección' NOT NULL,
	"budget_id" integer,
	"pdf_attachment_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pre_op_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"prospect_id" integer,
	"prospect_name" text,
	"budget_id" integer,
	"budget_name" text,
	"fecha" date NOT NULL,
	"total_gasto" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Registrado' NOT NULL,
	"desglose" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pre_op_rubros" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"nombre" text NOT NULL,
	"limite_por_prospecto" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predetermined_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"base_unit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predetermined_sub_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"predetermined_activity_id" integer,
	"item_number" text,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"quantity_per_base_unit" numeric DEFAULT '0' NOT NULL,
	"unit" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"offer_id" integer,
	"name" text NOT NULL,
	"creation_date" date NOT NULL,
	"initial_contract_amount" numeric DEFAULT '0' NOT NULL,
	"initial_budget" numeric DEFAULT '0' NOT NULL,
	"contract_amount" numeric DEFAULT '0' NOT NULL,
	"budget" numeric DEFAULT '0' NOT NULL,
	"location" text,
	"owner" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'En Ejecución' NOT NULL,
	"expenses" numeric DEFAULT '0' NOT NULL,
	"unforeseen_expenses" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"phone" text,
	"email" text,
	"next_follow_up_date" date,
	"birthday" date,
	"spouse_name" text,
	"children" text,
	"hobbies" text,
	"follow_ups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"purchase_order_id" integer,
	"name" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"service_request_id" integer,
	"project_id" integer,
	"supplier_id" integer,
	"supplier_name" text NOT NULL,
	"order_date" date NOT NULL,
	"expected_delivery_date" date,
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"discount" numeric DEFAULT '0',
	"iva" numeric DEFAULT '0',
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Pendiente Aprobación Financiera' NOT NULL,
	"payment_terms" text,
	"proforma_number" text,
	"is_warranty" boolean DEFAULT false,
	"is_pre_op" boolean DEFAULT false,
	"prospect_id" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_response_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_response_id" integer,
	"service_request_item_id" integer,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"quality" text DEFAULT 'Media' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "quote_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_request_id" integer,
	"supplier_id" integer,
	"supplier_name" text NOT NULL,
	"quote_number" text,
	"delivery_days" integer DEFAULT 0 NOT NULL,
	"payment_terms" text,
	"quality_notes" text,
	"total" numeric DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'CRC' NOT NULL,
	"pdf_attachment_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_order_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_item_overage_percentage" numeric,
	"max_project_overage_percentage" numeric
);
--> statement-breakpoint
CREATE TABLE "service_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"unit_cost" numeric,
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_request_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"service_request_id" integer,
	"name" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL,
	"specifications" text,
	"is_unforeseen" boolean DEFAULT false,
	"unforeseen_justification" text,
	"estimated_unit_cost" numeric
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"project_id" integer,
	"project_name" text NOT NULL,
	"request_date" date NOT NULL,
	"requester" text NOT NULL,
	"requester_id" integer,
	"required_date" date,
	"status" text DEFAULT 'Pendiente Aprobación Director' NOT NULL,
	"final_justification" text,
	"overrun_justification" text,
	"is_warranty" boolean DEFAULT false,
	"is_pre_op" boolean DEFAULT false,
	"prospect_id" integer,
	"rejection_history" jsonb DEFAULT '[]'::jsonb,
	"winner_selection" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subcontracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"purchase_order_id" integer,
	"project_id" integer,
	"supplier_id" integer,
	"contract_number" text NOT NULL,
	"scope_description" text NOT NULL,
	"contract_amount" numeric DEFAULT '0' NOT NULL,
	"payment_terms" text,
	"creation_date" date NOT NULL,
	"installments" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"service_type" text,
	"location" text,
	"phone" text,
	"email" text,
	"bank_account" text,
	"bank_account_details" text,
	"bank_account_2" text,
	"bank_account_2_details" text,
	"sinpe_phone" text,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE "system_sequences" (
	"prefix" text PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer,
	"role_id" integer,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"clerk_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"individual_permissions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_subcontract_id_subcontracts_id_fk" FOREIGN KEY ("subcontract_id") REFERENCES "public"."subcontracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administrative_expenses" ADD CONSTRAINT "administrative_expenses_budget_id_administrative_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."administrative_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonos" ADD CONSTRAINT "bonos_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_activities" ADD CONSTRAINT "budget_activities_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_sub_activities" ADD CONSTRAINT "budget_sub_activities_activity_id_budget_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."budget_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_op_expenses" ADD CONSTRAINT "pre_op_expenses_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_op_expenses" ADD CONSTRAINT "pre_op_expenses_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predetermined_sub_activities" ADD CONSTRAINT "predetermined_sub_activities_predetermined_activity_id_predetermined_activities_id_fk" FOREIGN KEY ("predetermined_activity_id") REFERENCES "public"."predetermined_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_response_items" ADD CONSTRAINT "quote_response_items_quote_response_id_quote_responses_id_fk" FOREIGN KEY ("quote_response_id") REFERENCES "public"."quote_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_response_items" ADD CONSTRAINT "quote_response_items_service_request_item_id_service_request_items_id_fk" FOREIGN KEY ("service_request_item_id") REFERENCES "public"."service_request_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_responses" ADD CONSTRAINT "quote_responses_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_responses" ADD CONSTRAINT "quote_responses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_request_items" ADD CONSTRAINT "service_request_items_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
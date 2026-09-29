import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const inspections = sqliteTable(
  "inspections",
  {
    id: text("id").primaryKey(),
    checklistType: text("checklist_type").notNull(),
    inspectorName: text("inspector_name").notNull(),
    inspectionDate: text("inspection_date").notNull(),
    km: integer("km").notNull(),
    fleet: text("fleet").notNull(),
    plate: text("plate").notNull(),
    branch: text("branch").notNull(),
    photoKey: text("photo_key").notNull(),
    signatureKey: text("signature_key").notNull(),
    totalItems: integer("total_items").notNull(),
    problemCount: integer("problem_count").notNull().default(0),
    actionStatus: text("action_status").notNull().default("pendente"),
    actionPlan: text("action_plan").notNull().default(""),
    actionOwner: text("action_owner").notNull().default(""),
    actionDueDate: text("action_due_date"),
    createdAt: text("created_at").notNull(),
    actionUpdatedAt: text("action_updated_at"),
    actionUpdatedBy: text("action_updated_by"),
  },
  (table) => [
    index("idx_inspections_created_at").on(table.createdAt),
    index("idx_inspections_fleet").on(table.fleet),
    index("idx_inspections_action_status").on(table.actionStatus),
  ],
);

export const inspectionAnswers = sqliteTable(
  "inspection_answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inspectionId: text("inspection_id")
      .notNull()
      .references(() => inspections.id, { onDelete: "cascade" }),
    itemNumber: integer("item_number").notNull(),
    question: text("question").notNull(),
    response: text("response").notNull(),
    comment: text("comment").notNull().default(""),
    evidenceKey: text("evidence_key"),
    isProblem: integer("is_problem", { mode: "boolean" }).notNull().default(false),
    actionStatus: text("action_status").notNull().default("pendente"),
    actionPlan: text("action_plan").notNull().default(""),
    actionOwner: text("action_owner").notNull().default(""),
    actionDueDate: text("action_due_date"),
    actionUpdatedAt: text("action_updated_at"),
    actionUpdatedBy: text("action_updated_by"),
  },
  (table) => [
    index("idx_answers_inspection_id").on(table.inspectionId),
    index("idx_answers_problem").on(table.isProblem),
  ],
);

export const drivers = sqliteTable("drivers", {
  name: text("name").primaryKey(),
  createdAt: text("created_at").notNull(),
});

export const adminUsers = sqliteTable("admin_users", {
  username: text("username").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role").notNull().default("user"),
  canManageUsers: integer("can_manage_users", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

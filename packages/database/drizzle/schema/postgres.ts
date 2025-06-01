import { createId as cuid } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

// Enums
export const purchaseTypeEnum = pgEnum("PurchaseType", [
	"SUBSCRIPTION",
	"ONE_TIME",
]);

// Tables
export const user = pgTable("user", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	username: text("username").unique(),
	role: text("role"),
	banned: boolean("banned"),
	banReason: text("banReason"),
	banExpires: timestamp("banExpires"),
	onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
	paymentsCustomerId: text("paymentsCustomerId"),
	locale: text("locale"),
});

export const session = pgTable(
	"session",
	{
		id: varchar("id", { length: 255 })
			.$defaultFn(() => cuid())
			.primaryKey(),
		expiresAt: timestamp("expiresAt").notNull(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonatedBy"),
		activeOrganizationId: text("activeOrganizationId"),
		token: text("token").notNull(),
		createdAt: timestamp("createdAt").notNull(),
		updatedAt: timestamp("updatedAt").notNull(),
	},
	(table) => [uniqueIndex("session_token_idx").on(table.token)],
);

export const account = pgTable("account", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	expiresAt: timestamp("expiresAt"),
	password: text("password"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt"),
});

export const passkey = pgTable("passkey", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	name: text("name"),
	publicKey: text("publicKey").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	credentialID: text("credentialID").notNull(),
	counter: integer("counter").notNull(),
	deviceType: text("deviceType").notNull(),
	backedUp: boolean("backedUp").notNull(),
	transports: text("transports"),
	createdAt: timestamp("createdAt"),
});

export const twoFactor = pgTable("twoFactor", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	secret: text("secret").notNull(),
	backupCodes: text("backupCodes").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const organization = pgTable(
	"organization",
	{
		id: varchar("id", { length: 255 })
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name").notNull(),
		slug: text("slug"),
		logo: text("logo"),
		createdAt: timestamp("createdAt").notNull(),
		metadata: text("metadata"),
		paymentsCustomerId: text("paymentsCustomerId"),
	},

	(table) => [uniqueIndex("organization_slug_idx").on(table.slug)],
);

export const member = pgTable(
	"member",
	{
		id: varchar("id", { length: 255 })
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role").notNull(),
		createdAt: timestamp("createdAt").notNull(),
	},
	(table) => [
		uniqueIndex("member_user_org_idx").on(
			table.userId,
			table.organizationId,
		),
	],
);

export const invitation = pgTable("invitation", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	inviterId: text("inviterId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const purchase = pgTable("purchase", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	organizationId: text("organizationId").references(() => organization.id, {
		onDelete: "cascade",
	}),
	userId: text("userId").references(() => user.id, {
		onDelete: "cascade",
	}),
	type: purchaseTypeEnum("type").notNull(),
	customerId: text("customerId").notNull(),
	subscriptionId: text("subscriptionId").unique(),
	productId: text("productId").notNull(),
	status: text("status"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt"),
});

export const aiChat = pgTable("aiChat", {
	id: varchar("id", { length: 255 })
		.$defaultFn(() => cuid())
		.primaryKey(),
	organizationId: text("organizationId").references(() => organization.id, {
		onDelete: "cascade",
	}),
	userId: text("userId").references(() => user.id, { onDelete: "cascade" }),
	title: text("title"),
	messages:
		json("messages").$type<
			{
				role: "user" | "assistant";
				content: string;
			}[]
		>(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt"),
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
	invitations: many(invitation),
	purchases: many(purchase),
	memberships: many(member),
	aiChats: many(aiChat),
	twoFactors: many(twoFactor),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	invitations: many(invitation),
	purchases: many(purchase),
	aiChats: many(aiChat),
}));

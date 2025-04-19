import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1745101056760 implements MigrationInterface {
  name = 'InitSchema1745101056760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_visits_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_visits_user_device"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_user_devices_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT "FK_dynamic_link_click_events_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT "FK_dynamic_link_click_events_user_device"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT "FK_dynamic_link_click_events_dynamic_link"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP CONSTRAINT "FK_dynamic_links_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_click_events_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_click_events_user_device"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_click_events_link"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_qr_codes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_qr_codes_link"`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" DROP CONSTRAINT "FK_links_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_user_subscriptions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_user_subscriptions_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_active_subscription"`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_endpoints" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "events" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "secret" character varying(255) NOT NULL, "failedAttempts" integer NOT NULL DEFAULT '0', "lastFailedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_94337b83da05cccf80e967580c0" UNIQUE ("secret"), CONSTRAINT "PK_054c4cfb95223732f5939d2d546" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "metaTitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "metaTitle" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "metaDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "metaDescription" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "metaImage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "metaImage" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "tags" text`);
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ALTER COLUMN "timestamp" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ALTER COLUMN "userDeviceId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ALTER COLUMN "xDeviceMemory" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "links" ADD "tags" text`);
    await queryRunner.query(
      `ALTER TYPE "public"."redirect_type" RENAME TO "redirect_type_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."links_redirecttype_enum" AS ENUM('301', '302')`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "redirectType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "redirectType" TYPE "public"."links_redirecttype_enum" USING "redirectType"::"text"::"public"."links_redirecttype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "redirectType" SET DEFAULT '302'`,
    );
    await queryRunner.query(`DROP TYPE "public"."redirect_type_old"`);
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "links" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "links" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."plan_name" RENAME TO "plan_name_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_name_enum" AS ENUM('FREE', 'BASIC', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "name" TYPE "public"."plans_name_enum" USING "name"::"text"::"public"."plans_name_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."plan_name_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."billing_frequency" RENAME TO "billing_frequency_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_billingfrequency_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "billingFrequency" TYPE "public"."plans_billingfrequency_enum" USING "billingFrequency"::"text"::"public"."plans_billingfrequency_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."billing_frequency_old"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."subscription_status" RENAME TO "subscription_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM('active', 'trial', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "status" TYPE "public"."user_subscriptions_status_enum" USING "status"::"text"::"public"."user_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "status" SET DEFAULT 'trial'`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscription_status_old"`);
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "planId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role" RENAME TO "user_role_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_old"`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "preferredLanguage" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "timezone" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_6bad25ae49d5d94043062f912b8" UNIQUE ("activeSubscriptionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_28f19616757b505532162fd6e75" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_8c53188ba68a6aa25af8af85407" FOREIGN KEY ("userDeviceId") REFERENCES "user_devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" ADD CONSTRAINT "FK_b3d432c73e6dd8c2b5349ae2e2d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" ADD CONSTRAINT "FK_52b6641f6b80b9bc6127bc929e6" FOREIGN KEY ("userDeviceId") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" ADD CONSTRAINT "FK_79ff286d9a3b824be4a1fcbe2f7" FOREIGN KEY ("dynamicLinkId") REFERENCES "dynamic_links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD CONSTRAINT "FK_6980cf6985bb7c3b0a522458eab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_6b22981c806282f2dbd4128b053" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_0cd8981046e6473f680e6e45ab8" FOREIGN KEY ("userDeviceId") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_a575423ed8d1710f659b4d788c5" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_6e1d60e5946560526825f786c43" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_9f6c6ff04146916ebc16a2581bd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ADD CONSTRAINT "FK_56668229b541edc1d0e291b4c3b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_2dfab576863bc3f84d4f6962274" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_55c9f77733123bd2ead29886017" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_6bad25ae49d5d94043062f912b8" FOREIGN KEY ("activeSubscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "FK_fd866edd4a9cf92aec0901ce4dc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "webhook_endpoints" DROP CONSTRAINT "FK_fd866edd4a9cf92aec0901ce4dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_6bad25ae49d5d94043062f912b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_55c9f77733123bd2ead29886017"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_2dfab576863bc3f84d4f6962274"`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" DROP CONSTRAINT "FK_56668229b541edc1d0e291b4c3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_9f6c6ff04146916ebc16a2581bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" DROP CONSTRAINT "FK_6e1d60e5946560526825f786c43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_a575423ed8d1710f659b4d788c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_0cd8981046e6473f680e6e45ab8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_6b22981c806282f2dbd4128b053"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP CONSTRAINT "FK_6980cf6985bb7c3b0a522458eab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT "FK_79ff286d9a3b824be4a1fcbe2f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT "FK_52b6641f6b80b9bc6127bc929e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" DROP CONSTRAINT "FK_b3d432c73e6dd8c2b5349ae2e2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_8c53188ba68a6aa25af8af85407"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_28f19616757b505532162fd6e75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_6bad25ae49d5d94043062f912b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "timezone" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "preferredLanguage" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_old" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "planId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_status_old" AS ENUM('active', 'trial', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "status" TYPE "public"."subscription_status_old" USING "status"::"text"::"public"."subscription_status_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ALTER COLUMN "status" SET DEFAULT 'trial'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."subscription_status_old" RENAME TO "subscription_status"`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."billing_frequency_old" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "billingFrequency" TYPE "public"."billing_frequency_old" USING "billingFrequency"::"text"::"public"."billing_frequency_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."plans_billingfrequency_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."billing_frequency_old" RENAME TO "billing_frequency"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_name_old" AS ENUM('FREE', 'BASIC', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ALTER COLUMN "name" TYPE "public"."plan_name_old" USING "name"::"text"::"public"."plan_name_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."plans_name_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."plan_name_old" RENAME TO "plan_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "links" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "links" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."redirect_type_old" AS ENUM('301', '302')`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "redirectType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "redirectType" TYPE "public"."redirect_type_old" USING "redirectType"::"text"::"public"."redirect_type_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ALTER COLUMN "redirectType" SET DEFAULT '302'`,
    );
    await queryRunner.query(`DROP TYPE "public"."links_redirecttype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."redirect_type_old" RENAME TO "redirect_type"`,
    );
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "links" ADD "tags" text array`);
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ALTER COLUMN "xDeviceMemory" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ALTER COLUMN "userDeviceId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ALTER COLUMN "timestamp" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "tags"`);
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "tags" text array`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "metaImage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "metaImage" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "metaDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "metaDescription" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" DROP COLUMN "metaTitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD "metaTitle" character varying(255)`,
    );
    await queryRunner.query(`DROP TABLE "webhook_endpoints"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_active_subscription" FOREIGN KEY ("activeSubscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_user_subscriptions_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_user_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ADD CONSTRAINT "FK_links_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_qr_codes_link" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ADD CONSTRAINT "FK_qr_codes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_click_events_link" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_click_events_user_device" FOREIGN KEY ("userDeviceId") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_click_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_links" ADD CONSTRAINT "FK_dynamic_links_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" ADD CONSTRAINT "FK_dynamic_link_click_events_dynamic_link" FOREIGN KEY ("dynamicLinkId") REFERENCES "dynamic_links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" ADD CONSTRAINT "FK_dynamic_link_click_events_user_device" FOREIGN KEY ("userDeviceId") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dynamic_link_click_events" ADD CONSTRAINT "FK_dynamic_link_click_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_user_devices_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_visits_user_device" FOREIGN KEY ("userDeviceId") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_visits_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}

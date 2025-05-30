import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDataBaseTables1745345092873 implements MigrationInterface {
    name = 'UpdateDataBaseTables1745345092873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_devices" DROP CONSTRAINT "UQ_user_devices_deviceId_userId"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP CONSTRAINT "UQ_plans_name_billingfrequency"`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "fingerprintHash" character varying`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "browser" character varying`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "deviceType" character varying`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "dynamic_link_click_events" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dynamic_link_click_events" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dynamic_link_click_events" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "expiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "deepLinkPath" character varying`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "click_events" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "click_events" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "click_events" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD "scanCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "qr_codes" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "links" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD "autoRenew" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD "source" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "utmSource" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "utmCampaign" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "links" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "links" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "price" SET DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_e12ac4f8016243ac71fd2e415a" ON "user_devices" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e81c41e04269a2d2152f0d60b5" ON "user_devices" ("deviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_47ff77b09f8a35e6044cd8900a" ON "user_devices" ("xDeviceId") `);
        await queryRunner.query(`CREATE INDEX "idx_dynamic_link_click_event_dynamic_link_id" ON "dynamic_link_click_events" ("dynamicLinkId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c0ece84097d579841557ad4a9" ON "dynamic_link_click_events" ("dynamicLinkId", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c9ab6501247f9e3c1ebc96adc" ON "dynamic_link_click_events" ("deviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3312e9810d2dbc3942afc491ff" ON "dynamic_link_click_events" ("cfRay") `);
        await queryRunner.query(`CREATE INDEX "IDX_52b6641f6b80b9bc6127bc929e" ON "dynamic_link_click_events" ("userDeviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b3d432c73e6dd8c2b5349ae2e2" ON "dynamic_link_click_events" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b76d595adc4a825daf5bc2cfd6" ON "dynamic_link_click_events" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd0d6508d78c1d6b2ba4633a63" ON "dynamic_links" ("alias") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4791dafd9fd4216ba613ccd35" ON "click_events" ("deviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_42eb587bc4a0df03452890bf7e" ON "click_events" ("cfRay") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cd8981046e6473f680e6e45ab" ON "click_events" ("userDeviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6b22981c806282f2dbd4128b05" ON "click_events" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_53f7f6e7fa562ebb09767f61cd" ON "click_events" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_a575423ed8d1710f659b4d788c" ON "click_events" ("linkId") `);
        await queryRunner.query(`CREATE INDEX "idx_qrcode_link" ON "qr_codes" ("linkId") `);
        await queryRunner.query(`CREATE INDEX "idx_qrcode_user" ON "qr_codes" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a2507a408bd33a2431ebc48f8" ON "links" ("alias") `);
        await queryRunner.query(`CREATE INDEX "IDX_868c1da0225f6a0ebd92312e82" ON "links" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_b78d58bc595027528586770d92" ON "links" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_56668229b541edc1d0e291b4c3" ON "links" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_253d25dae4c94ee913bc5ec485" ON "plans" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_a01df6373e8f0408ada36a2ab2" ON "plans" ("billingFrequency") `);
        await queryRunner.query(`CREATE INDEX "IDX_5efa750e09b30e7d4725b3b508" ON "plans" ("isMostPopular") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dfab576863bc3f84d4f696227" ON "user_subscriptions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5970e6723936d28477041ebf85" ON "user_subscriptions" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_60375470f2677f1b872599b16e" ON "users" ("isEmailVerified") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f7e382eedca99c726dc48ccce" ON "users" ("isPhoneVerified") `);
        await queryRunner.query(`CREATE INDEX "IDX_87886a844ebeb8aa3ece3413ac" ON "visits" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_28f19616757b505532162fd6e7" ON "visits" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8c53188ba68a6aa25af8af8540" ON "visits" ("userDeviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cc3347a4720afbe3ee88a12fce" ON "visits" ("cfRay") `);
        await queryRunner.query(`CREATE INDEX "IDX_78adb0c8665c50789286fb0087" ON "visits" ("deviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d1973f31734ca03aa6cb169ad" ON "visits" ("xDeviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d88026bd323efb96906e3947a3" ON "visits" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_76799bc9dc5719140b183b51eb" ON "visits" ("updatedAt") `);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD CONSTRAINT "UQ_5f3efa34f1621c790e524c7acf4" UNIQUE ("userId", "deviceId", "xDeviceId")`);
        await queryRunner.query(`ALTER TABLE "plans" ADD CONSTRAINT "UQ_f48e6dcb1d756e3761f05977102" UNIQUE ("name", "billingFrequency")`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "UQ_257ef154b0f23ce6f3df08dc7d5" UNIQUE ("userId", "planId", "status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "UQ_257ef154b0f23ce6f3df08dc7d5"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP CONSTRAINT "UQ_f48e6dcb1d756e3761f05977102"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP CONSTRAINT "UQ_5f3efa34f1621c790e524c7acf4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_76799bc9dc5719140b183b51eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d88026bd323efb96906e3947a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d1973f31734ca03aa6cb169ad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78adb0c8665c50789286fb0087"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cc3347a4720afbe3ee88a12fce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c53188ba68a6aa25af8af8540"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28f19616757b505532162fd6e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87886a844ebeb8aa3ece3413ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f7e382eedca99c726dc48ccce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60375470f2677f1b872599b16e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5970e6723936d28477041ebf85"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2dfab576863bc3f84d4f696227"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5efa750e09b30e7d4725b3b508"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a01df6373e8f0408ada36a2ab2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_253d25dae4c94ee913bc5ec485"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_56668229b541edc1d0e291b4c3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b78d58bc595027528586770d92"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_868c1da0225f6a0ebd92312e82"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a2507a408bd33a2431ebc48f8"`);
        await queryRunner.query(`DROP INDEX "public"."idx_qrcode_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_qrcode_link"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a575423ed8d1710f659b4d788c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53f7f6e7fa562ebb09767f61cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b22981c806282f2dbd4128b05"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cd8981046e6473f680e6e45ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42eb587bc4a0df03452890bf7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4791dafd9fd4216ba613ccd35"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd0d6508d78c1d6b2ba4633a63"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b76d595adc4a825daf5bc2cfd6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3d432c73e6dd8c2b5349ae2e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52b6641f6b80b9bc6127bc929e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3312e9810d2dbc3942afc491ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c9ab6501247f9e3c1ebc96adc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c0ece84097d579841557ad4a9"`);
        await queryRunner.query(`DROP INDEX "public"."idx_dynamic_link_click_event_dynamic_link_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_47ff77b09f8a35e6044cd8900a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e81c41e04269a2d2152f0d60b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e12ac4f8016243ac71fd2e415a"`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "price" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "links" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "links" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "utmCampaign"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "utmSource"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP COLUMN "autoRenew"`);
        await queryRunner.query(`ALTER TABLE "links" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "qr_codes" DROP COLUMN "scanCount"`);
        await queryRunner.query(`ALTER TABLE "click_events" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "click_events" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "click_events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "deepLinkPath"`);
        await queryRunner.query(`ALTER TABLE "dynamic_links" DROP COLUMN "expiresAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_link_click_events" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_link_click_events" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "dynamic_link_click_events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP COLUMN "deviceType"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP COLUMN "browser"`);
        await queryRunner.query(`ALTER TABLE "user_devices" DROP COLUMN "fingerprintHash"`);
        await queryRunner.query(`ALTER TABLE "plans" ADD CONSTRAINT "UQ_plans_name_billingfrequency" UNIQUE ("name", "billingFrequency")`);
        await queryRunner.query(`ALTER TABLE "user_devices" ADD CONSTRAINT "UQ_user_devices_deviceId_userId" UNIQUE ("userId", "deviceId")`);
    }

}

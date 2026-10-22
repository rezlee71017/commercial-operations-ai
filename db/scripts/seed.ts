import { db } from '../index';
import { warehouses, categories, systemSettings, coupons } from '../schema';

async function main() {
  console.log('🌱 Starting database seeding...');

  // ۱. ساخت انبار اولیه
  await db.insert(warehouses).values([
    { name: 'Central Warehouse', location: 'Primary Logistics Hub' }
  ]).onConflictDoNothing();

  // ۲. ساخت دسته‌بندی‌های اصلی
  await db.insert(categories).values([
    { name: 'Smartphones', slug: 'smartphones' },
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Accessories', slug: 'accessories' }
  ]).onConflictDoNothing();

  // ۳. تنظیمات سیستمی و سیاست‌های هوش مصنوعی
  await db.insert(systemSettings).values([
    {
      key: 'ai_policy_rules',
      value: {
        maxDiscountPercent: 15,
        minMarginPercent: 20,
        autoApprovalEnabled: false
      }
    }
  ]).onConflictDoNothing();

  // ۴. کوپن اولیه نمونه
  await db.insert(coupons).values([
    {
      code: 'WELCOME10',
      discountPercent: 10,
      isActive: true
    }
  ]).onConflictDoNothing();

  console.log('✅ Seeding completed successfully!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

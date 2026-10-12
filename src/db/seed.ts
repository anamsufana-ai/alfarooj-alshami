import { sql } from "drizzle-orm";
import { branches } from "@/data/branches";
import { menuPageCounts, menus } from "@/data/menus";
import { majorToMinor } from "@/domain/money";
import { rows, type Database } from "./client";

function slug(value: string, index: number): string {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  return `${base}-${index}`;
}

export async function seedIfEmpty(db: Database): Promise<void> {
  const existing = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM emirates LIMIT 1`));
  if (existing.length === 0) {
    await seedReference(db);
  }
  await seedMissingMenus(db);
}

export async function seedReference(db: Database): Promise<void> {
  const emirates = [
    ["dubai", "Dubai", "دبي", 1],
    ["sharjah", "Sharjah", "الشارقة", 2],
    ["ajman", "Ajman", "عجمان", 3],
  ] as const;
  for (const [id, nameEn, nameAr, sort] of emirates) {
    await db.execute(sql`
      INSERT INTO emirates (id, name_en, name_ar, sort_order)
      VALUES (${id}, ${nameEn}, ${nameAr}, ${sort})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const branch of branches) {
    await db.execute(sql`
      INSERT INTO branches (
        id, emirate_id, slug, name_en, name_ar, phones, published_location_en, published_location_ar,
        location_precision, address_conflict_note_en, address_conflict_note_ar, delivery_mode,
        delivery_fee_minor, pickup_mode, hours_status, hours_note_en, hours_note_ar, source_url,
        source_note_en, source_note_ar
      ) VALUES (
        ${branch.id}, ${branch.emirateId}, ${branch.slug}, ${branch.nameEn}, ${branch.nameAr},
        ${JSON.stringify(branch.phones)}::jsonb, ${branch.publishedLocationEn}, ${branch.publishedLocationAr},
        ${branch.locationPrecision}, ${branch.addressConflictNoteEn}, ${branch.addressConflictNoteAr},
        ${branch.deliveryMode}, ${branch.deliveryFeeMinor}, ${branch.pickupMode}, ${branch.hoursStatus},
        ${branch.hoursNoteEn}, ${branch.hoursNoteAr}, ${branch.sourceUrl}, ${branch.sourceNoteEn}, ${branch.sourceNoteAr}
      )
      ON CONFLICT (id) DO NOTHING
    `);
  }
}

export async function seedMissingMenus(db: Database): Promise<void> {
  for (const menu of menus) {
    const found = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM menus WHERE id = ${menu.id}`));
    if (found.length > 0) continue;
    const pages = new Set(menu.categories.flatMap((category) => category.items.map((item) => item.page)));
    const note = `Imported from picture pages ${[...pages].sort((a, b) => a - b).join(", ") || "none"} of ${menuPageCounts[menu.id] ?? "?"} pages. Pending human review. Prices were not copied from another branch.`;
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO menus (id, branch_id, source_filename, source_title, source_created_at, currency, vat_note_en, vat_note_ar, review_status)
        VALUES (${menu.id}, ${menu.branchId}, ${menu.sourceFilename}, ${menu.sourceTitle}, ${menu.sourceCreatedAt}, 'AED', ${menu.vatNoteEn}, ${menu.vatNoteAr}, 'pending_review')
      `);
      let categoryIndex = 0;
      for (const category of menu.categories) {
        const categoryId = `${menu.id}-c${categoryIndex}`;
        await tx.execute(sql`
          INSERT INTO menu_categories (id, menu_id, branch_id, name_en, name_ar, sort_order, source_page)
          VALUES (${categoryId}, ${menu.id}, ${menu.branchId}, ${category.en}, ${category.ar}, ${categoryIndex}, ${category.page})
        `);
        for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
          const item = category.items[itemIndex];
          const itemId = `${categoryId}-${slug(item.en, itemIndex)}`;
          const review = item.review ?? "pending_review";
          const available = item.available !== false && review !== "needs_clarification";
          const price = item.price && !item.choices ? majorToMinor(item.price) : null;
          await tx.execute(sql`
            INSERT INTO menu_items (
              id, category_id, menu_id, branch_id, name_en, name_ar, description_en, description_ar,
              price_minor, currency, is_available, sort_order, source_page, review_status, extraction_note
            ) VALUES (
              ${itemId}, ${categoryId}, ${menu.id}, ${menu.branchId}, ${item.en}, ${item.ar},
              ${item.descriptionEn ?? null}, ${item.descriptionAr ?? null}, ${price}, 'AED', ${available},
              ${itemIndex}, ${item.page}, ${review}, ${item.note ?? note}
            )
          `);
          if (item.choices && item.choices.length > 0) {
            const groupId = `${itemId}-size`;
            await tx.execute(sql`
              INSERT INTO modifier_groups (id, item_id, name_en, name_ar, required, min_select, max_select, sort_order)
              VALUES (${groupId}, ${itemId}, 'Choice', 'الخيار', true, 1, 1, 0)
            `);
            for (let choiceIndex = 0; choiceIndex < item.choices.length; choiceIndex += 1) {
              const choice = item.choices[choiceIndex];
              await tx.execute(sql`
                INSERT INTO modifier_choices (id, group_id, name_en, name_ar, price_delta_minor, absolute_price_minor, sort_order)
                VALUES (${`${groupId}-${choiceIndex}`}, ${groupId}, ${choice.en}, ${choice.ar}, 0, ${majorToMinor(choice.price)}, ${choiceIndex})
              `);
            }
          }
        }
        categoryIndex += 1;
      }
    });
  }
}

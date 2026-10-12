import { category, dish, unclear } from "../menu-build";
import type { SeedMenu } from "../types";

const partial = "Read from one panel of the single-page Rigga poster. Other panels on that poster are not entered yet.";

export const riggaMenu: SeedMenu = {
  id: "menu-rigga-2022-02",
  branchId: "branch-dubai-rigga",
  sourceFilename: "menu- dubai-al-rigga- branch.pdf",
  sourceTitle: null,
  sourceCreatedAt: "2022-02-25",
  vatNoteEn: null,
  vatNoteAr: null,
  categories: [
    category("juice", "العصائر", 1, [
      dish("Orange", "برتقال", "13", 1, undefined, undefined),
      dish("Pineapple", "أناناس", "15", 1),
      dish("Kiwi", "كيوي", "13", 1),
      dish("Mango", "مانجو", "15", 1),
      dish("Lemon", "ليمون", "13", 1),
      dish("Lemon with Mint", "ليمون بالنعناع", "14", 1),
      dish("Bananas With Milk", "موز بالحليب", "14", 1),
      dish("Watermelon Juice", "عصير بطيخ", "13", 1),
      dish("Avocado", "أفوكادو", "16", 1),
      dish("Melon", "شمام", "13", 1),
      dish("Apple", "تفاح", "14", 1),
      dish("Pomegranate", "رمان", "16", 1),
      dish("Carrots", "جزر", "14", 1),
      dish("Cocktail", "كوكتيل", "16", 1),
      dish("Milk Chic Chocolate", "ميلك شيك شوكولاتة", "16", 1),
      dish("Milk Shake Strawberry", "ميلك شيك فراولة", "16", 1),
      dish("Milk Chic Vanilla", "ميلك شيك فانيلا", "16", 1),
      dish("Fruit Salad", "سلطة فواكة", "18", 1),
      dish("Fruit Salad With Ice Cream", "سلطة فواكه مع آيس كريم", "22", 1),
    ].map((item) => ({ ...item, note: item.note ?? partial }))),
    category("Drinks", "المشروبات", 1, [
      dish("Eran Milk", "لبن عيران", "6", 1),
      dish("Pepsi", "بيبسي", "3", 1),
      dish("Small Water", "مياه صغير", "2", 1),
      dish("Large Water", "مياه كبير", "4", 1),
      dish("Coffee", "قهوة تركي", "8", 1),
      dish("Turkish Coffee", "قهوة تركية", "8", 1),
      dish("Nescafe", "نسكافيه", "8", 1),
      dish("Lipton Tea", "شاي ليبتون", "5", 1),
      dish("Green Tea", "شاي أخضر", "5", 1),
      dish("Tea with milk", "شاي بالحليب", "5", 1),
      dish("Soft drinks", "مشروبات غازية", "3", 1),
    ].map((item) => ({ ...item, note: partial }))),
    category("Sweets", "حلويات", 1, [
      dish("Creme Caramel", "كريم كراميل", "15", 1),
      dish("Rice With Milk", "رز بالحليب", "15", 1),
      dish("Muhalabiah", "مهلبية", "15", 1),
      dish("Kunafah with cream", "كنافة بالقشطة", "15", 1),
      dish("Kunafah with cheese", "كنافة بالجبنة", "15", 1),
    ].map((item) => ({ ...item, note: partial }))),
    category("Import gap", "نواقص القراءة", 1, [
      unclear(
        "Remaining Rigga poster panels",
        "بقية ألواح ملصق الرقة",
        1,
        "The Rigga file is one tall poster made of several menu panels. Juice, drinks, and sweets were entered from one panel. The food panels on the same poster still need a line-by-line review before they are sold here.",
      ),
    ]),
  ],
};

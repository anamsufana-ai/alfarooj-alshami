// Al Farooj Al Shami: five branches, five printed menus.
// Prices are copied exactly as printed on each branch menu. Every printed
// menu says "All prices include 5% VAT", so the customer pays the printed
// price and the VAT inside it is shown on the invoice (see src/pricing.js).
// Sources: menu PDFs supplied by the owner (Rigga Feb 2022, International City
// Feb 2022, Muweilah Feb 2022, Sahara Jan 2022, Ajman Aug 2021).

const items = [];
let seq = 0;

function add(location, category, rows) {
  for (const [name, price, ar = "", note = ""] of rows) {
    seq += 1;
    items.push({ id: `${location}-${category}-${seq}`, location, category, name, price, ar, note });
  }
}

add("rigga", "juices", [
  ["Orange", 13, "برتقال"],
  ["Pineapple", 13, "أناناس"],
  ["Kiwi", 13, "كيوي"],
  ["Mango", 13, "مانجو"],
  ["Lemon", 13, "ليمون"],
  ["Lemon with Mint", 13, "ليمون بالنعناع"],
  ["Banana with Milk", 13, "موز بالحليب"],
  ["Watermelon", 13, "عصير بطيخ"],
  ["Avocado", 16, "أفوكادو"],
  ["Melon", 13, "شمام"],
  ["Apple", 16, "تفاح"],
  ["Pomegranate", 16, "رمان"],
  ["Carrot", 16, "جزر"],
  ["Cocktail", 16, "كوكتيل"],
  ["Chocolate Milkshake", 16, "ميلك شيك شوكولاته"],
  ["Strawberry Milkshake", 16, "ميلك شيك فراولة"],
  ["Vanilla Milkshake", 16, "ميلك شيك فانيلا"],
  ["Fruit Salad", 27, "سلطة فواكه"],
  ["Fruit Salad with Ice Cream", 32, "سلطة فواكه مع آيس كريم"],
]);

add("rigga", "drinks", [
  ["Laban Ayran", 8, "لبن عيران"],
  ["Pepsi", 4, "بيبسي"],
  ["Small Water", 2, "مياه صغير"],
  ["Large Water", 4, "مياه كبير"],
  ["Tea", 6, "شاي"],
  ["Turkish Coffee", 9, "قهوة تركي"],
  ["Nescafe", 9, "نسكافيه"],
  ["Lipton Tea", 6, "شاي ليبتون"],
  ["Green Tea", 6, "شاي أخضر"],
  ["Tea with Milk", 8, "شاي بالحليب"],
  ["Soft Drinks", 3, "مشروبات غازية"],
]);

add("rigga", "sweets", [
  ["Creme Caramel", 9, "كريم كراميل"],
  ["Rice with Milk", 9, "رز بالحليب"],
  ["Muhalabiah", 9, "مهلبية"],
  ["Knafeh with Cream", 15, "كنافة بالقشطة"],
  ["Knafeh with Cheese", 15, "كنافة بالجبنة"],
]);

add("rigga", "seafood", [
  ["Shrimps Grilled / Fried", 48, "روبيان مشوي / مقلي"],
  ["Fillet Hamour Grilled / Fried", 48, "فيليه هامور مشوي / مقلي"],
  ["Supreme Fish", 58, "سوبريم سمك"],
  ["Shrimps 1 KG", 189, "كيلو روبيان"],
]);

add("rigga", "hot", [
  ["Hummus with Minced Meat", 24, "حمص باللحمة الناعمة"],
  ["Hummus with Meat Slices", 25, "حمص باللحمة الشقف"],
  ["Hummus with Pine Nuts", 26, "حمص بالصنوبر"],
  ["Mofaraka Potatoes & Meat", 30, "مفركة بطاطا باللحمة"],
  ["Fried Eggs", 15, "بيض مقلي"],
  ["Spicy Potatoes", 16, "بطاطا حرة"],
  ["Mushroom with Meat", 30, "مفركة فطر باللحمة"],
  ["Eggs with Meat", 26, "بيض باللحمة"],
  ["Sambousek (6 pcs)", 24, "سمبوسك 6 حبة"],
  ["Grilled Halloumi", 26, "حلوم مشوي"],
  ["Fried Kibbeh", 26, "كبة مقلية"],
  ["Falafel Plate", 13, "صحن فلافل"],
  ["French Fries", 13, "بطاطا مقلية"],
  ["Sliced Broasted Potatoes", 14, "بطاطا بروستد شرحات"],
  ["Chicken Liver", 32, "كبدة دجاج"],
]);

add("rigga", "soup", [
  ["Shrimp Soup", 15, "شوربة روبيان"],
  ["Chicken Soup", 13, "شوربة دجاج"],
  ["Mushroom Soup", 13, "شوربة فطر"],
  ["Lentil Soup", 11, "شوربة عدس"],
  ["Corn Soup", 13, "شوربة ذرة"],
]);

add("rigga", "fattah", [
  ["Fatteh with Oil", 19, "فتة بالزيت"],
  ["Fatteh Fa'aseh", 21, "فتة فئسة"],
  ["Fatteh with Minced Meat", 22, "فتة باللحمة الناعمة"],
  ["Fatteh with Meat Slices", 25, "فتة باللحمة شقف"],
  ["Fatteh with Ghee", 19, "فتة بالسمنة"],
  ["Foul with Oil", 15, "فول بالزيت"],
  ["Msabbaha", 15, "مسبحة"],
  ["Falafel", 13, "فلافل"],
]);

add("rigga", "manakish", [
  ["Manakish Zaatar", 7, "مناقيش زعتر"],
  ["Manakish Muhammara", 7, "مناقيش محمرة"],
  ["Manakish Labneh", 8, "مناقيش لبنة"],
  ["Manakish Labneh & Zaatar", 9, "مناقيش لبنة و زعتر"],
  ["Manakish Kashkawan", 9, "مناقيش قشقوان"],
  ["Manakish Cheese & Muhammara", 10, "مناقيش جبنة و محمرة"],
  ["Manakish Cheese & Zaatar", 10, "مناقيش جبنة و زعتر"],
  ["Manakish Cheese & Mortadella", 11, "مناقيش جبنة و مرتديلا"],
  ["Manakish Cheese & Meat", 10, "مناقيش جبنة و لحمة"],
  ["Manakish Meat", 8, "مناقيش لحمة"],
  ["Manakish Cheese", 8, "مناقيش جبنة"],
  ["Manakish Labneh & Vegetables", 9, "مناقيش لبنة و خضار"],
  ["Manakish Labneh & Honey", 10, "مناقيش لبنة وعسل"],
]);

add("rigga", "pizza", [
  ["Vegetable Pizza", 27, "بيتزا خضار"],
  ["Chicken Pizza", 30, "بيتزا دجاج"],
  ["Pepperoni Pizza", 30, "بيتزا ببروني"],
  ["Margherita Pizza", 27, "بيتزا مرغريتا"],
]);

add("rigga", "special", [
  ["Chicken Fajita", 32, "فاهيتا دجاج"],
  ["Beef Steak, Pepper or Mushroom", 53, "ستيك لحم مشوي بالفلفل أو الفطر"],
  ["Chicken Milanese", 37, "ستيك دجاج ميلانيز"],
  ["Spaghetti Bolognese", 32, "اسباغيتي بولونيز"],
  ["Chicken Pasta Alfredo", 32, "باستا الفريدو دجاج"],
  ["Cordon Bleu", 48, "كوردون بلو"],
]);

add("rigga", "cold", [
  ["Laban", 16, "لبن"],
  ["Hummus Beiruti", 17, "حمص بيروتي"],
  ["Hummus", 15, "حمص"],
  ["Baba Ghanoush", 16, "بابا غنوج"],
  ["Muhammara", 16, "محمرة"],
  ["Kibbeh Nayeh", 31, "كبة نية"],
  ["Grape Leaves", 16, "ورق عنب"],
  ["Moutabal", 15, "متبل"],
  ["Garlic Plate (Large)", 11, "صحن ثوم كبير"],
  ["Garlic Plate (Small)", 6, "صحن ثوم صغير"],
]);

add("rigga", "salads", [
  ["Fattoush", 15, "فتوش"],
  ["Tabbouleh", 16, "تبولة"],
  ["Olive Salad", 19, "سلطة زيتون"],
  ["Coleslaw Salad", 13, "سلطة كول سلو"],
  ["Cabbage Salad", 15, "سلطة ملفوف"],
  ["Arabic Salad", 15, "سلطة عربية"],
  ["Cucumber & Laban Salad", 13, "سلطة لبن بالخيار"],
  ["Rocca Salad", 15, "سلطة جرجير"],
  ["Chicken Caesar Salad", 21, "سلطة سيزر بالدجاج"],
  ["Greek Salad", 21, "سلطة يونانية"],
]);

add("rigga", "shawarma", [
  ["Chicken Shawarma", 6, "شاورما دجاج"],
  ["Chicken Shawarma Big", 16, "شاورما دجاج صاروخ"],
  ["Mexican Spicy Chicken Shawarma", 6, "شاورما دجاج مكسيكي سبايسي"],
  ["Meat Shawarma", 7, "شاورما لحم"],
  ["Meat Shawarma Rocket", 18, "شاورما لحم صاروخ"],
  ["Arabic Chicken Shawarma", 21, "شاورما عربي دجاج"],
  ["Arabic Meat Shawarma", 23, "شاورما عربي لحم"],
  ["Chicken Shawarma 1/2 KG", 53, "نصف كيلو شاورما دجاج"],
  ["Chicken Shawarma 1 KG", 105, "كيلو شاورما دجاج"],
  ["Meat Shawarma 1/2 KG", 63, "نصف كيلو شاورما لحم"],
  ["Meat Shawarma 1 KG", 125, "كيلو شاورما لحم"],
  ["Mix Shawarma Plate", 32, "صحن شاورما مكس"],
  ["Shawarma Rocket Mix", 18, "شاورما صاروخ مكس"],
]);

add("rigga", "shawarma-meals", [
  ["Chicken Shawarma Plate", 27, "صحن شاورما دجاج"],
  ["Chicken Shawarma Plate & Hummus", 32, "صحن شاورما دجاج مع حمص"],
  ["Meat Shawarma Plate", 32, "صحن شاورما لحم"],
  ["Meat Shawarma Plate & Hummus", 37, "صحن شاورما لحم مع حمص"],
  ["Toshka Chicken Plate", 32, "صحن طوشكا دجاج"],
]);

add("rigga", "sandwiches", [
  ["Al Farooj Al Shami Burger", 19, "برجر الفروج الشامي", "Chicken or meat, cabbage salad, fries, Pepsi."],
  ["Chicken Burger", 10, "برجر دجاج"],
  ["Chicken Burger with Eggs", 13, "برجر دجاج مع بيض"],
  ["Beef Burger", 10, "برجر لحم"],
  ["Beef Burger with Eggs", 13, "برجر لحم مع بيض"],
  ["Fajita Sandwich", 19, "فاهيتا"],
  ["Philadelphia Meat", 21, "فيلادلفيا لحم"],
  ["Francisco", 19, "فرانشيسكو"],
  ["Mexican Chicken Sandwich", 19, "سندويش دجاج مكسيكي"],
  ["Crispy Chicken Sandwich", 19, "سندويش دجاج كريسبي"],
  ["Crispy Fish Sandwich", 19, "سندويش سمك كريسبي"],
  ["Falafel Sandwich Small", 4, "سندويش فلافل صغير"],
  ["Falafel Sandwich Big", 8, "سندويش فلافل كبير"],
  ["Hummus Sandwich with Meat", 14, "سندويش حمص باللحمة"],
  ["Fries Sandwich", 10, "سندويش بطاطا"],
]);

add("rigga", "grill-sandwiches", [
  ["Tikka Meat Sandwich", 16, "سندويش تكا شقف لحم"],
  ["Kebab Sandwich", 14, "سندويش كباب"],
  ["Shish Tawook Sandwich", 14, "سندويش شيش طاووق"],
  ["Chicken Kebab Sandwich", 14, "كباب دجاج"],
]);

add("rigga", "grills", [
  ["Grilled Kibbeh (4 pcs)", 27, "كبة مشوية 4 حبات"],
  ["Grilled Kibbeh (2 pcs)", 16, "كبة مشوية 2 حبة"],
  ["Lamb Chops", 48, "ريش"],
  ["Mixed Grill", 39, "مشاوي مشكل"],
  ["Kebab", 35, "كباب"],
  ["Tikka Meat", 39, "لحمة شقف"],
  ["Tikka Meat & Zaatar", 39, "لحمة شقف بالزعتر"],
  ["Eggplant Kebab", 35, "كباب باذنجان"],
  ["Tikka Meat & Yoghurt", 39, "لحمة شقف بالروب"],
  ["Al Farooj Al Shami Grills", 47, "مشاوي الفروج الشامي"],
  ["Chicken Kebab", 30, "كباب دجاج"],
  ["Khashkhash Kebab", 35, "كباب خشخاش"],
  ["Half Boneless Chicken", 25, "نصف دجاجة مسحب"],
  ["Half Chicken Charcoal", 23, "نصف دجاجة عالفحم"],
  ["Full Chicken Charcoal", 46, "دجاج كامل عالفحم"],
  ["Full Boneless Chicken Charcoal", 50, "فروج مسحب كامل عالفحم"],
  ["Arayes", 30, "عرايس"],
  ["Arayes with Cheese", 35, "عرايس بالجبنة"],
  ["Chicken Wings", 27, "جوانح دجاج"],
  ["Shish Tawook", 31, "شيش طاووق"],
  ["Grilled Pigeon", 37, "حمام مشوي"],
]);

add("rigga", "grills-kg", [
  ["Mixed Grill 1 KG", 145, "1 كغ مشاوي مشكل"],
  ["Kebab 1 KG", 135, "كيلو كباب"],
  ["Lamb Chops 1 KG", 189, "1 كغ ريش"],
  ["Shish Tawook 1 KG", 115, "كيلو شيش طاووق"],
  ["Tikka Meat 1 KG", 145, "كيلو تكا لحم"],
]);

add("rigga", "farooj", [
  ["Half Broasted Chicken", 25, "نصف دجاج بروستد", "4 pcs, fries, garlic, cabbage salad, Mexican sauce, pickles, bread."],
  ["Fish Broasted", 25, "بروستد سمك", "Fish fillet, fries, garlic, tahini, pickles, bread."],
  ["Crispy Chicken Meal", 25, "وجبة كريسبي دجاج", "4 pcs, fries, garlic, cabbage salad, Mexican sauce, pickles, bread."],
  ["Chicken Escalope", 32, "إسكالوب دجاج"],
  ["Chicken Charcoal Kabsa", 32, "كبسة دجاج عالفحم"],
  ["Rice Plate", 9, "صحن رز"],
]);

add("rigga", "oven", [
  ["Meat Slices", 35, "شرحات لحم"],
  ["Chicken Slices", 35, "شرحات دجاج"],
  ["Kofta with Tomatoes", 35, "كفتة بالبندورة"],
  ["Kofta with Tahini", 35, "كفتة بالطحينة"],
  ["Brain in the Oven", 35, "نخاعات بالفرن"],
]);

add("intl", "hot", [
  ["Hummus & Meat", 25, "حمص باللحمة"],
  ["Abo Al Hool", 24, "أبو الهول", "Egg & Meat & Cheese, Homus"],
  ["Foul With Laban", 15, "فول باللبن"],
  ["Foul With Oil", 15, "فول بالزيت"],
  ["Fatteh With Meat", 22, "فتة باللحمة"],
  ["Fatteh With Ghee", 16, "فتة بالسمنة"],
  ["Fried Eggs", 13, "بيض مقلي"],
  ["Eggs With Meat", 22, "بيض باللحمة"],
  ["Roll Burak", 18, "برك رول"],
  ["Fried Kubba (6 Pcs)", 27, "كبة مقلية (6 حبات)"],
  ["Chicken Nashif", 27, "ناشف دجاج"],
  ["Meat Nashif", 29, "ناشف لحم"],
  ["Potato Cutlets", 14, "بطاطا شرمات"],
  ["Falafel Dish", 12, "صحن فلافل"],
  ["Mafrakeh Mushroom & Meat", 29, "مفركة فطر باللحمة"],
  ["Potato Fingers", 12, "بطاطا أصابع"],
  ["Qudsiah", 16, "قدسية"],
  ["Spicy Potatoes", 16, "بطاطا حرة"],
]);

add("intl", "cold", [
  ["Motabbal", 14, "متبل"],
  ["Hommus plate", 14, "صحن حمص"],
  ["Tabbouleh", 15, "تبولة"],
  ["Fattoush", 14, "فتوش"],
  ["Arabic salad", 13, "سلطة عربية"],
  ["Grape leaves", 15, "ورق عنب"],
  ["Hommus Beiruti", 15, "حمص بيروتي"],
  ["Rokkah salad", 14, "سلطة جرجير"],
  ["Raw Kibbeh", 30, "كبة نية"],
  ["Baba ghanoush", 15, "بابا غنوج"],
  ["Labnah", 15, "لبنة"],
  ["Muhammara", 16, "محمرة"],
  ["ColeSlaw", 15, "سلطة كول سلو"],
  ["Cabbage salad", 15, "سلطة ملفوف"],
  ["Greek salad", 20, "سلطة يونانية"],
  ["Garlic Plate", 12, "صحن ثوم"],
]);

add("intl", "soup", [
  ["Lentil Soup", 9, "شوربة عدس"],
  ["Chicken Soup", 13, "شوربة دجاج"],
  ["Mushroom Soup", 13, "شوربة الفطر"],
  ["Vegetable Soup", 12, "شوربة الخضار"],
  ["Shrimp Soup", 14, "شوربة روبيان"],
]);

add("intl", "grills", [
  ["Tikka Meat", 38, "لحمة شقف"],
  ["Mix Grilled", 36, "مشاوي مشكلة"],
  ["Chicken Wings", 29, "جوانح دجاج"],
  ["Shish Tawook", 30, "شيش طاووق"],
  ["Kabab Kishkash", 32, "كباب خشخاش"],
  ["Kabab", 30, "كباب"],
  ["Kubba On Sikh", 32, "كبة عالسيخ"],
  ["Eggplant Kabab", 33, "كباب باذنجان"],
  ["Lamb Chops", 47, "ريش"],
  ["Grilled kibbah", 27, "كبة مشوية", "4 Pcs"],
  ["Arayes & cheese", 32, "عرايس بالجبنة"],
  ["Arayes", 30, "عرايس"],
  ["Half Chicken Charcoal", 23, "نصف دجاجة عالفحم"],
]);

add("intl", "grills-kg", [
  ["1 k.g Mixed Grill", 140, "1 كغ مشاوي مشكل"],
  ["1 k.g Shish Tawook", 120, "1 كغ شيش طاووق"],
  ["1 k.g Kabab", 125, "1 كغ كباب"],
  ["1 k.g Tekka", 145, "1 كغ تكا"],
  ["Chicken Wings", 115, "1 كغ جوانح"],
]);

add("intl", "sandwiches", [
  ["Al Farooj Al Shami Chicken Burger Meal", 16, "وجبة برجر دجاج الفروج الشامي"],
  ["Al Farooj Al Shami Beef Burger Meal", 17, "وجبة برجر لحم الفروج الشامي"],
  ["Chicken Burger", 12, "سندويش برجر دجاج"],
  ["Beef Burger", 13, "سندويش برجر لحم"],
  ["Vahiti", 19, "فاهيتا"],
  ["Crispy", 19, "كرسبي"],
  ["Philadelphia", 20, "فلاديلفيا"],
  ["Crispy Fish", 16, "سمل كرسبي"],
  ["Shish Tawook", 14, "شيش طاووق"],
  ["Meat Tikka", 16, "تكا لحم"],
  ["Potato", 10, "بطاطا"],
  ["Kabab", 14, "كباب"],
  ["Falafel Big", 8, "فلافل كبير"],
]);

add("intl", "farooj", [
  ["Chicken Kabsa On Charcoal", 29, "كبسة دجاج على الفحم"],
  ["Musahab On Charcoal", 23, "مسحب على الفحم"],
  ["Chicken Kabsa", 32, "كبسة دجاج"],
  ["Meat Kabsa", 35, "كبسة لحم"],
  ["Stuffed Lamb Meal", 35, "وجبة خروف محشي"],
  ["Freekeh Chicken", 32, "فريكة دجاج"],
  ["Freekeh Meat", 35, "فريكة لحم"],
  ["Rice Plate", 10, "صحن رز"],
  ["Kabsah Rice Plate", 12, "صحن رز كبسة"],
  ["Freekeh Plate", 12, "صحن فريكة"],
  ["Fahita", 30, "فاهيتا"],
]);

add("intl", "shawarma", [
  ["Arabic Chicken", 20, "عربي دجاج"],
  ["Arabic Meat", 22, "عربي لحم"],
  ["Chicken Shawarma Sandwich", 6, "سندويش شاورما دجاج"],
  ["Meat Shawarma Sandwich", 6.5, "سندويش شاورما لحم"],
  ["Mexican Chicken Shawarma Sandwich", 6, "سندويش شاورما مكسيكي دجاج"],
  ["Chicken Shawarma Plate", 27, "صحن شاورما دجاج"],
  ["Meat Shawarma Plate", 30, "صحن شاورما لحم"],
  ["Mix Shawarma Plate", 28, "صحن شاورما مشكل"],
  ["Chicken Shawarma Plate & Homus", 29, "صحن شاورما دجاج بالحمص"],
  ["Meat Shawarma Plate & Homus", 32, "صحن شاورما لحم بالحمص"],
  ["Chicken Shawarma Rocket", 14, "صاروخ شاورما دجاج"],
  ["Meat Shawarma Rocket", 16, "صاروخ شاورما لحم"],
]);

add("intl", "broasted", [
  ["Full Broasted", 52, "بروستد كامل"],
  ["Half Broasted Chicken", 27, "نصف دجاج بروستد"],
  ["Chicken Crispy", 27, "كرسبي دجاج"],
  ["Fish Crispy", 22, "كرسبي سمل"],
]);

add("intl", "seafood", [
  ["Grilled Shrimp", 45, "روبيان مشوي"],
  ["Grilled hamour fillet", 35, "فيليه هامور مشوي"],
  ["Grilled Zubaidi", 45, "زبيدي مشوي"],
  ["Grilled Sultan Ibrahim", 40, "سلطان ابراهيم مشوي"],
  ["Grilled Shary", 45, "شعري مشوي"],
  ["Supreme grilled", 50, "سوبريم مشوي"],
  ["Grilled Salmon Fillet", 48, "فيليه سلمون مشوي", "Sauteed Potatoes & Vegetables"],
]);

add("intl", "oven", [
  ["Kofta & Tomatoes", 32, "كفتة بالبندورة"],
  ["Kofta & Tahini", 32, "كفتة بالطحينة"],
  ["Chicken Slices & Potatoes", 31, "شرحات دجاج بالبطاطا"],
  ["Meat Slices & Potatoes", 32, "شرحات لحم بالبطاطا"],
  ["Chicken Liver", 29, "كبدة دجاج"],
  ["Sheep Liver", 32, "كبدة غنم"],
  ["Lamb's Brain", 32, "نخاعات"],
  ["Hindi Kabab", 32, "كباب هندي"],
]);

add("intl", "manakish", [
  ["Cheese", 8, "بالجبنة"],
  ["Zatar", 6, "زعتر"],
  ["Meat Manakesh Pomegranate Molasses", 6, "مناقيش لحمة دبس الرمان"],
  ["Meat & Dough Vegetables", 6, "لحم بعجين خضار"],
  ["Spinach", 6, "سبانخ"],
  ["Labnah & Vegetables", 7, "لبنة بالخضرة"],
  ["Cheese With Meat", 8, "جبنة باللحمة"],
  ["Labnah With Zatar", 8, "لبنة بالزعتر"],
  ["Cheese With Zatar", 8, "جبنة بالزعتر"],
  ["Mortadella Cheese", 9, "جبنة مرتديلا"],
  ["Mohamara", 6, "محمرة"],
  ["Cheese Mohamara", 8, "جبنة بالمحمرة"],
  ["Loaf Meat Slices", 27, "رغيف شرحات لحم"],
  ["Loaf Chicken Slices", 24, "رغيف شرحات دجاج"],
]);

add("intl", "drinks", [
  ["Laban Ayran", 6, "عيران"],
  ["Pepsi", 3, "بيبسي"],
  ["Small Water", 2, "مياه صغير"],
  ["Big Water", 4, "مياه كبير"],
]);

add("intl", "juices", [
  ["Orange", 12, "برتقال"],
  ["Cocktail", 13, "كوكتيل"],
  ["Slices Cocktail", 15, "كوكتيل شقف"],
  ["Avocado", 14, "أفوكادو"],
  ["Strawberries", 13, "فراولة"],
  ["Mango", 13, "مانجو"],
  ["Bananas With Milk", 12, "موز بالحليب"],
  ["Pomegranate", 15, "رمان"],
  ["Carrots", 13, "جزر"],
  ["Apple", 14, "تفاح"],
  ["Pineapple", 13, "أناناس"],
  ["Watermelon", 12, "بطيخ"],
  ["Melon", 12, "شمام"],
  ["Lemon Mint", 12, "ليمون نعناع"],
  ["Kiwi", 12, "كيوي"],
]);

add("muweilah", "western", [
  ["Cordon Blue Chicken", 42, "كوردون بلو دجاج"],
  ["Supreme Chicken", 42, "دجاج سوبريم"],
  ["Fahita", 30, "فاهيتا"],
  ["Chicken Scallops", 32, "اسكالوب دجاج ميلانيز"],
  ["Chicken Steak", 35, "ستيك دجاج"],
  ["Beef Fillet Bwvir", 50, "فيليه لحم بوافير"],
  ["Beef Fillet & Mushroom Sauce", 50, "فيليه لحم مع صوص فطر"],
]);

add("muweilah", "pasta", [
  ["Spaghetti Bolognese", 37, "سباغيتي بولونيز"],
  ["Photochini Alfredo", 37, "فوتوتشيني ألفريدو"],
  ["Photochini Alpesto", 37, "فوتوتشيني البيستو"],
  ["Pina Arabiata (Spicy)", 32, "بينا أرابياتا (سبايسي)"],
  ["Spaghetti Napolitana", 32, "سباغيتي نابوليتانا"],
]);

add("muweilah", "drinks", [
  ["Laban Ayran", 7, "عيران"],
  ["Pepsi", 3.15, "بيبسي"],
  ["Small Water", 2, "مياه صغير"],
  ["Big Water", 4, "مياه كبير"],
]);

add("muweilah", "juices", [
  ["Al Shami Cocktail", 15, "كوكتيل الشامي"],
  ["Fruit Cocktail", 14, "كوكتيل فواكة"],
  ["Avocado", 15, "أفوكادو"],
  ["Strawberries", 13, "فراولة"],
  ["Mango", 14, "مانجو"],
  ["Bananas With Milk", 12, "موز بالحليب"],
  ["Pomegranate", 18, "رمان"],
  ["Carrots", 13, "جزر"],
  ["Apple", 14, "تفاح"],
  ["Pineapple", 14, "أناناس"],
  ["Watermelon", 13, "بطيخ"],
  ["Melon", 13, "شمام"],
  ["Lemon Mint", 14, "ليمون نعناع"],
  ["Fruit Salad", 20, "سلطة فواكة"],
]);

add("muweilah", "oven", [
  ["Kofta & Tomatoes", 30, "كفتة بالبندورة", "Served with homus and vegetables"],
  ["Kofta & Tahini", 30, "كفتة بالطحينة", "Served with homus and vegetables"],
  ["Chicken Slices & Potatoes", 29, "شرحات دجاج بالبطاطا", "Served with homus and vegetables"],
  ["Meat Slices & Potatoes", 30, "شرحات لحم بالبطاطا", "Served with homus and vegetables"],
  ["Chicken Liver", 27, "كبدة دجاج", "Served with homus and vegetables"],
  ["Sheep Liver", 30, "كبدة غنم", "Served with homus and vegetables"],
  ["Lamb's Brain", 30, "نخاعات", "Served with homus and vegetables"],
]);

add("muweilah", "seafood", [
  ["Shrimp (grilled or fried)", 48, "روبيان (مشوي، مقلي)"],
  ["Grilled hamour fillet", 35, "فيليه هامور مشوي"],
  ["Zubaidi (grilled, fried)", 45, "زبيدي (مشوي، مقلي)"],
  ["Sultan Ibrahim (grilled, fried)", 40, "سلطان ابراهيم (مشوي، مقلي)"],
  ["Hairy (grilled, fried)", 50, "شعري (مشوي، مقلي)"],
  ["Supreme grilled", 50, "سوبريم مشوي"],
  ["Grilled Salmon Fillet", 50, "فيليه سلمون مشوي", "Sauteed Potatoes & Vegetables"],
]);

add("muweilah", "manakish", [
  ["Cheese", 7, "جبنة"],
  ["Zatar", 6, "زعتر"],
  ["Meat Manakesh Pomegranate Molasses", 7, "مناقيش لحمة دبس الرمان"],
  ["Meat & Dough Vegetables", 7, "لحم بعجين خضار"],
  ["Spinach", 7, "سبانخ"],
  ["Labnah & Vegetables", 7, "لبنة بالخضرة"],
  ["Cheese With Meat", 8, "جبنة باللحمة"],
  ["Labnah With Zatar", 8, "لبنة بالزعتر"],
  ["Cheese With Zatar", 8, "جبنة بالزعتر"],
  ["Mortadella Cheese", 8, "جبنة مرتديلا"],
  ["Mohamara", 6, "محمرة"],
  ["Cheese Mohamara", 8, "جبنة بالمحمرة"],
  ["Shamyat Plate", 15, "صحن شاميات"],
  ["Loaf Meat Slices", 25, "رغيف شرحات لحم"],
  ["Loaf Chicken Slices", 22, "رغيف شرحات دجاج"],
]);

add("muweilah", "shamyat", [
  ["Shamyat (1/2 Kg)", 58, "شاميات (1/2 كغ)"],
  ["Shamyat (1 Kg)", 110, "شاميات (1 كغ)"],
]);

add("muweilah", "shawarma", [
  ["Arabic Chicken", 19, "عربي دجاج"],
  ["Arabic Meat", 20, "عربي لحم"],
  ["Chicken Shawarma Sandwich", 6, "سندويش شاورما دجاج"],
  ["Meat Shawarma Sandwich", 7, "سندويش شاورما لحم"],
  ["Mexican Chicken Shawarma Sandwich", 6, "سندويش شاورما مكسيكي دجاج"],
  ["Chicken Shawarma Plate", 25, "صحن شاورما دجاج"],
  ["Meat Shawarma Plate", 27, "صحن شاورما لحم"],
  ["Mix Shawarma Plate", 27, "صحن شاورما مشكل"],
  ["Chicken Shawarma Plate & Homus", 27, "صحن شاورما دجاج بالحمص"],
  ["Meat Shawarma Plate & Homus", 29, "صحن شاورما لحم بالحمص"],
  ["Chicken Shawarma Rocket", 13, "صاروخ شاورما دجاج"],
  ["Meat Shawarma Rocket", 14, "صاروخ شاورما لحم"],
]);

add("muweilah", "sandwiches", [
  ["Al Farooj Al Shami Chicken Burger", 15, "برجر الفروج الشامي دجاج"],
  ["Al Farooj Al Shami Beef Burger", 15, "برجر الفروج الشامي لحم"],
  ["Vahiti", 18, "فاهيتا"],
  ["Sausage", 18, "سجق"],
  ["Crispy", 18, "كرسبي"],
  ["Philadelphia", 20, "فلاديلفيا"],
  ["Crispy Fish", 18, "سمك كرسبي"],
  ["Shish Tawook", 13, "شيش طاووق"],
  ["Meat Tikka", 15, "تكا لحم"],
  ["Potato", 11, "بطاطا"],
  ["Kabab", 13, "كباب"],
  ["Falafel Small", 4, "فلافل صغير"],
  ["Falafel Big", 8, "فلافل كبير"],
]);

add("muweilah", "grills-kg", [
  ["1Kg Normal Grills", 135, "1 كغ مشاوي مشكل"],
  ["1Kg Kabab", 120, "1 كغ كباب"],
  ["1Kg Tekka", 140, "1 كغ تكة"],
  ["1Kg Shish Tawouk", 120, "1 كغ شيش طاووق"],
  ["1Kg Wings", 110, "1 كغ جوانح"],
]);

add("muweilah", "hot", [
  ["Abo Al Hool", 21, "أبو الهول", "Egg & Meat & Cheese, Homus"],
  ["Hummus & Meat", 24, "حمص باللحمة"],
  ["Fatteh Faksa With Oil", 17, "فتة مفسحة بالزيت"],
  ["Foul With Oil", 15, "فول بالزيت"],
  ["Fatteh With Ghee", 16, "فتة بالسمنة"],
  ["Fatteh With Meat", 21, "فتة باللحمة"],
  ["Eggs With Meat", 22, "بيض باللحمة"],
  ["Fried Eggs", 13, "بيض مقلي"],
  ["Fried Kubba", 22, "كبة مقلية"],
  ["Roll Burak", 18, "برك رول"],
  ["Meat Nashif", 27, "ناشف لحم"],
  ["Chicken Nashif", 25, "ناشف دجاج"],
  ["Falafel Dish", 12, "صحن فلافل"],
  ["Potato Cutlets", 14, "بطاطا شرمات"],
  ["Potato Fingers", 12, "بطاطا أصابع"],
  ["Mafrakeh Mushroom & Meat", 27, "مفركة فطر باللحمة"],
  ["Spicy Potatoes", 15, "بطاطا حرة"],
  ["Qudsiah", 15, "قدسية"],
]);

add("muweilah", "grills", [
  ["Mixed Grill", 35, "مشاوي مشكل"],
  ["Tekka", 35, "تكة"],
  ["Shish Tawouk", 30, "شيش طاووق"],
  ["Wings", 27, "جوانح"],
  ["Kabab", 30, "كباب"],
  ["Kabab Kishkash", 32, "كباب خشخاش"],
  ["Eggplant Kabab", 33, "كباب باذنجان"],
  ["Kubba On Sikh", 32, "كبة عالسيخ"],
  ["Arais", 28, "عرايس"],
  ["Arais With Cheese", 30, "عرايس بالجبنة"],
  ["Grilled Kubba", 28, "كبة مشوية"],
]);

add("muweilah", "broasted", [
  ["Full Broasted", 48, "بروستد كامل"],
  ["Half Broasted Chicken", 25, "نصف دجاج بروستد"],
  ["Chicken Crispy", 25, "كرسبي دجاج"],
  ["Fish Crispy", 24, "كرسبي سمك"],
]);

add("muweilah", "soup", [
  ["Lentil Soup", 10, "شوربة عدس"],
  ["Chicken Soup", 13, "شوربة دجاج"],
  ["Mushroom Soup", 13, "شوربة الفطر"],
  ["Vegetable Soup", 12, "شوربة الخضار"],
]);

add("muweilah", "farooj", [
  ["Full Chicken Oven", 46.5, "دجاج مسحب كامل بالفرن مع صلصة", "With potatoes and sauce in the oven"],
  ["Half Chicken Oven", 25, "نصف دجاج مسحب بالفرن مع صلصة", "With potatoes and sauce in the oven"],
  ["Chicken Kabsa On Charcoal", 30, "كبسة دجاج على الفحم"],
  ["Chicken Kabsa", 30, "كبسة دجاج"],
  ["Meat Kabsa", 35, "كبسة لحم"],
  ["Stuffed Lamb Meal", 35, "وجبة خروف محشي"],
  ["Freekeh Chicken", 32, "فريكة دجاج"],
  ["Freekeh Meat", 37, "فريكة لحم"],
  ["Rice Plate", 10, "صحن رز"],
  ["Freekeh Plate", 12, "صحن فريكة"],
]);

add("muweilah", "cold", [
  ["Homus", 13, "حمص"],
  ["Mutabal", 13, "متبل"],
  ["Fattoush", 14, "فتوش"],
  ["Tabula", 14, "تبولة"],
  ["Grape Leaves", 14, "ورق عنب"],
  ["Arabic Salad", 12, "سلطة عربية"],
  ["Arugula salad", 13, "سلطة جرجير"],
  ["Hummus Beiruti", 15, "حمص بيروتي"],
  ["Baba ghanoush", 15, "بابا غنوج"],
  ["Raw Kibbeh", 30, "كبة نية"],
  ["Muhammara", 15, "محمرة"],
  ["Labnah", 14, "لبنة"],
  ["Cabbage salad", 14, "سلطة ملفوف"],
  ["ColeSlaw", 14, "سلطة كول سلو"],
  ["Garlic Plate", 12, "صحن ثوم"],
  ["Greek salad", 20, "سلطة يونانية"],
]);

add("sahara", "hot", [
  ["Sliced Broasted frieds", 12, "بطاطا بروستد شرحات"],
  ["French fries", 10, "بطاطا مقلية"],
  ["Fried kebbe", 22, "كبة مقلية"],
]);

add("sahara", "cold", [
  ["Motabbal", 13, "متبل"],
  ["Hommus", 13, "حمص"],
  ["Grape leaves", 15, "ورق عنب"],
  ["Labnah", 13, "لبنة"],
  ["Yoghurt", 10, "لبن روب"],
  ["Garlic plate", 10, "صحن ثوم"],
  ["Mixed Appetizers", 40, "مقبلات مشكل"],
]);

add("sahara", "salads", [
  ["Tabbouleh", 15, "تبولة"],
  ["Fattoush", 14, "فتوش"],
  ["Arabic salad", 13, "سلطة عربية"],
  ["Coleslaw salad", 13, "سلطة كول سلو"],
  ["Cucumber & laban", 12, "سلطة لبن بالخيار"],
  ["Rokkah salad", 15, "سلطة جرجير"],
  ["Chicken caesar salad", 20, "سلطة سيزر بالدجاج"],
]);

add("sahara", "pizza", [
  ["Chicken Pizza", 30, "بيتزا دجاج"],
  ["Vegetables pizza", 27, "بيتزا خضار"],
  ["Margherita pizza", 27, "بيتزا مرغرينا"],
  ["Pepperoni pizza", 30, "بيتزا بيبروني"],
]);

add("sahara", "grills", [
  ["Mix Grilled", 35, "مشاوي مشكلة"],
  ["Mix Grilled Al shami", 45, "مشاوي مشكل الشامي"],
  ["Shish Tawook", 30, "شيش طاووق"],
  ["Lamb Chops", 48, "ريش"],
  ["Chicken Wings", 27, "جوانح دجاج"],
  ["Tikka Meat", 35, "لحمة شقف"],
  ["Grilled kibbah (2 Pcs)", 16, "كبة مشوية (2 حبات)"],
  ["Grilled kibbah (4 Pcs)", 27, "كبة مشوية (4 حبات)"],
  ["Kabab", 30, "كباب"],
  ["Hamour Grilled / Fried", 35, "فيليه هامور مشوي / مقلي"],
  ["Shrimps Grilled / Fried", 48, "روبيان مشوي / مقلي"],
  ["Chicken Charcoal (Half)", 23, "دجاجة عالفحم (نصف)"],
  ["Chicken Charcoal (Full)", 45, "دجاجة عالفحم (كامل)"],
  ["Arayes", 30, "عرايس"],
  ["Arayes & cheese", 35, "عرايس بجبنة"],
]);

add("sahara", "grills-kg", [
  ["1kg Mix Grilled", 130, "1 ك مشاوي مشكل"],
  ["1/2 kg Mix Grilled", 70, "1/2 مشاوي مشكل"],
  ["1kg Lamb Chops", 189, "1 ك ريش"],
  ["1/2 kg Lamb Chops", 95, "1/2 ك ريش"],
  ["1kg Kabab", 115, "1 ك كباب"],
  ["1kg Shish Tawook", 115, "1 ك شيش طاووق"],
  ["1kg Tikka Meat", 130, "1 ك تكا لحم"],
]);

add("sahara", "grill-sandwiches", [
  ["Sandwiches Tekka Meat Steak", 15, "سندويش تكا شقف لحم"],
  ["Kabab Sandwich", 13, "سندويش كباب"],
  ["Shish Tawook Sandwich", 13, "سندويش شيش طاووق"],
]);

add("sahara", "sandwiches", [
  ["Al Farooj Al Shami Burger", 19, "برجر الفروج الشامي", "coleslow salad + Fries + Pepsi"],
  ["Chicken Burger", 10, "برجر دجاج"],
  ["Beef Burger", 10, "برجر لحم"],
  ["Vajita", 16, "فاهيتا"],
  ["Mexican Chicken Sandwiches", 16, "سندويش دجاج مكسيكي"],
  ["Crispy Chicken Sandwiches", 16, "سندويش دجاج كرسبي"],
  ["Crispy Fish Sandwiches", 16, "سندويش سمل كرسبي"],
  ["Fries sandwiche", 10, "سندويش بطاطا"],
]);

add("sahara", "farooj", [
  ["Full Broasted Chicken", 49, "دجاج بروستد كامل"],
  ["Half Of Broasted Chicken", 25, "نصف دجاج بروستد"],
  ["Fish Broasted", 25, "بروستد سمل"],
  ["Chicken Crispy meal", 25, "وجبة كرسبي دجاج"],
  ["Chicken Charcoal Kabsa", 30, "كبسة دجاج عالفحم"],
  ["Rice Plate", 9, "صحن رز"],
]);

add("sahara", "manakish", [
  ["Manakesh Zaatar", 6, "مناقيش زعتر"],
  ["Manakesh mohamara", 6, "مناقيش محمرة"],
  ["Manakesh labnah", 8, "مناقيش لبنة"],
  ["Manakesh labnah & Zaatar", 8, "مناقيش لبنة و زعتر"],
  ["Manakesh Kashkawan", 9, "مناقيش قشقوان"],
  ["Manakesh Cheese & mohamara", 8, "مناقيش جبنة و محمرة"],
  ["Manakesh Cheese & Zaatar", 8, "مناقيش جبنة و زعتر"],
  ["Manakesh Cheese & Mortadella", 8, "مناقيش جبنة و مرتديلا"],
  ["Manakesh Cheese & meat", 8, "مناقيش جبنة و لحمة"],
  ["Manakesh meat", 7, "مناقيش لحمة"],
  ["Manakesh Cheese", 7, "مناقيش جبنة"],
  ["Manakesh labnah & Vegetables", 9, "مناقيش لبنة و خضار"],
  ["Manakesh labnah & Honey", 10, "مناقيش لبنة وعسل"],
]);

add("sahara", "shawarma-meals", [
  ["Chicken Shawarma Plate", 27, "صحن شاورما دجاج"],
  ["Chicken Shawarma Plate & Hommus", 32, "صحن شاورما دجاج مع حمص"],
  ["Meat Shawarma Plate", 32, "صحن شاورما لحم"],
  ["Meat Shawarma Plate & Hummus", 37, "صحن شاورما لحم مع حمص"],
  ["Toshka Chicken Plate", 32, "صحن طوشكا دجاج"],
]);

add("sahara", "shawarma", [
  ["Chicken Shawarma", 6, "شاورما دجاج"],
  ["Chicken Shawarma Big", 16, "شاورما دجاج صاروخ"],
  ["Shawarma Rocket Mix", 18, "شاورما صاروخ مكس"],
  ["Shawarma Mexican Spicy Chicken", 6, "شاورما دجاج مكسيكي سبايسي"],
  ["Meat Shawarma", 7, "شاورما لحم"],
  ["Shawarma Meat Rocket", 18, "شاورما لحم صاروخ"],
  ["Arabic Chicken Shawerma", 21, "شاورما عربي دجاج"],
  ["Arabic Meat Shawerma", 23, "شاورما عربي لحم"],
  ["1/2 K.g Chicken Shawarma", 53, "نصف كيلو شاورما دجاج"],
  ["1 K.g Chicken Shawarma", 105, "كيلو شاورما دجاج"],
  ["1/2 K.g meat shawarma", 63, "نصف كيلو شاورما لحم"],
  ["1 K.g Meat Shawarma", 125, "كيلو شاورما لحم"],
  ["Mix Shawarma Pleat", 32, "صحن شاورما مكس"],
]);

add("sahara", "soup", [
  ["Lentil Soup", 10, "شوربة عدس"],
]);

add("sahara", "drinks", [
  ["Orange", 13, "برتقال"],
  ["Eran Milk", 6, "لبن عيران"],
  ["Small water", 2, "مياه صغيرة"],
  ["Large water", 4, "مياه كبير"],
  ["Tea", 5, "شاي"],
  ["Soft Drinks", 3, "مشروبات غازية"],
]);

add("ajman", "hot", [
  ["Homus With Meat", 21, "حمص باللحمة"],
  ["Bean With Oil", 15, "فول حب بالزيت"],
  ["Fatta With Ghee", 16, "فتة بالسمنة"],
  ["Fatta With Meat", 21, "فتة باللحمة"],
  ["Eggs With Meat", 21, "بيض باللحمة"],
  ["Fried Eggs", 13, "بيض مقلي"],
  ["Fried Kubba", 21, "كبة مقلية"],
  ["Cheese Roll Burak", 16, "برك رول جبنة"],
  ["Nashif Meat", 26.5, "ناشف لحم"],
  ["Nashif Chicken", 23.5, "ناشف دجاج"],
  ["Flafel Plate", 11, "صحن فلافل"],
  ["Slices French Fries", 13, "بطاطا مقلية شرحات"],
  ["French Fries Fingers", 10, "بطاطا مقلية أصابع"],
  ["Mushroom & Meat", 26.5, "مفركة فطر باللحمة"],
  ["Spicy potatoes", 15, "بطاطا حرة"],
  ["Mixed Fried Vegetables", 16, "صحن مقالي مشكل"],
]);

add("ajman", "cold", [
  ["Homus", 13, "حمص"],
  ["Mutabal", 13, "متبل"],
  ["Fattoush", 13, "فتوش"],
  ["Tabula", 13, "تبولة"],
  ["Grape Leaves", 14, "ورق عنب"],
  ["Arabic Salad", 12, "سلطة عربية"],
  ["Arabic Salad Small Cut", 13, "سلطة عربية ناعمة"],
  ["Rocca salad", 13, "سلطة جرجير"],
  ["Homus Perotti", 13, "حمص بيروتي"],
  ["Baba Ghanough", 13, "بابا غنوج"],
  ["Row Meat", 30, "كبة نية"],
  ["Muhamarah Plate", 13, "صحن محمرة"],
  ["Labnah Plate", 13, "صحن لبنة"],
  ["Coleslaw Salad", 13, "سلطة كول سلو"],
  ["Cabbage Salad", 13, "سلطة ملفوف"],
  ["Garlic Plate", 13, "صحن ثوم"],
  ["Greek Salad", 19, "سلطة يونانية"],
]);

add("ajman", "grills", [
  ["1 Kg Mix Grills", 115, "1 ك مشكال مشاوي"],
  ["1 Kg Kabab", 105, "1 ك كباب"],
  ["1 Kg Tekka", 116, "1 ك تكة"],
  ["1 Kg Shish Tawouk", 100, "1 ك شيش طاووق"],
  ["1 Kg Wings", 105, "1 ك جوانح"],
  ["Meat Tekka Plate", 34, "صحن تكة لحم"],
  ["Kebab Plate", 29, "صحن كباب"],
  ["Kabab Kishkash Plate", 31, "صحن كباب خشخاش"],
  ["Eggplant Kabab Plate", 34, "صحن كباب باذنجان"],
  ["Lamb Chops", 43, "صحن ريش غنم"],
  ["Shish Tawouk Plate", 29, "صحن شيش طاووق"],
  ["Chicken wings", 27, "صحن جوانح دجاج"],
  ["Mix Grills Plate", 34, "صحن مشاوي مشكل"],
  ["Arais Plate", 28, "صحن عرايس"],
  ["Arais With cheese Plate", 30, "صحن عرايس بالجبنة"],
  ["Kubba On Sikh", 30, "كبة عالسيخ"],
  ["Grilled Kubba", 30, "كبة مشوية"],
  ["Toshka", 28.5, "طوشكا"],
  ["Hamur Fish Fillet Grilled", 34, "فيليه سمك هامور مشوي عالفحم"],
  ["Full chicken charcoal", 38, "دجاج كامل عالفحم"],
  ["Half chicken charcoal", 22, "نصف دجاج عالفحم"],
]);

add("ajman", "sandwiches", [
  ["Al Farooj Al Shami Chicken Burger", 17, "برجر الفروج الشامي دجاج"],
  ["Al Farooj Al Shami Beef Burger", 17, "برجر الفروج الشامي لحم"],
  ["Chicken Burger", 12, "برجر دجاج"],
  ["Beef Burger", 12, "برجر لحم"],
  ["Vahiti", 17, "فاهيتا"],
  ["Francesco", 17, "فرانشيسكو"],
  ["Crispy Chicken", 17, "دجاج كرسبي"],
  ["Crispy Fish", 17, "سمل كرسبي"],
  ["Shish Tawook", 13, "شيش طاووق"],
  ["Meat Tikka", 15, "تكا لحم"],
  ["French Fries Sandwich", 11, "سندويش بطاطا"],
  ["Kabab Sandwich", 13, "سندويش كباب"],
  ["Small Falafel Sandwiche", 4, "سندويش فلافل صغير"],
  ["Large Falafel Sandwiche", 8, "سندويش فلافل كبير"],
]);

add("ajman", "farooj", [
  ["Full Chicken Oven", 46.5, "دجاج مسحب كامل بالفرن مع صلصة"],
  ["Half Chicken Oven", 24, "نصف دجاج مسحب بالفرن مع صلصة"],
  ["Chicken Kabsa", 28, "كبسة دجاج"],
  ["Meat Kabsa", 35, "كبسة لحم"],
  ["Wheat Kabsa", 35, "فريكة لحم"],
  ["Rice Plate", 9, "صحن رز"],
  ["Wheat Plate", 11, "صحن فريكة"],
  ["Chicken Kabsa On Charcoal", 28, "كبسة دجاج على الفحم"],
  ["Charcoal Chicken Freekeh", 30, "فريكة دجاج على الفحم"],
]);

add("ajman", "shawarma", [
  ["Arabic Chicken", 19, "عربي دجاج"],
  ["Arabic Meat", 20, "عربي لحم"],
  ["Chicken Shawarma Sandwich", 5.25, "سندويش شاورما دجاج"],
  ["Meat Shawarma Sandwich", 6.25, "سندويش شاورما لحم"],
  ["Mexican Chicken Shawarma Sandwich", 5.25, "سندويش شاورما مكسيكي دجاج"],
  ["Chicken Shawarma Plate", 23, "صحن شاورما دجاج"],
  ["Meat Shawarma Plate", 24, "صحن شاورما لحم"],
  ["Mix Shawarma Plate", 24, "صحن شاورما مشكل"],
  ["Chicken Shawarma Plate & Homus", 26, "صحن شاورما دجاج بالحمص"],
  ["Meat Shawarma Plate & Homus", 27, "صحن شاورما لحم بالحمص"],
  ["Chicken Shawarma Samon Sandwiches", 12, "سندويش شاورما دجاج صمون"],
  ["Meat Shawarma Samon Sandwiches", 13, "سندويش شاورما لحم صمون"],
]);

add("ajman", "broasted", [
  ["Full Broasted", 47, "بروستد كامل"],
  ["Half Broasted Chicken", 24, "نصف دجاج بروستد"],
  ["Chicken Crispy", 24, "كرسبي دجاج"],
  ["Broasted Fish Fillet", 22, "بروستد سمل فيليه"],
]);

add("ajman", "soup", [
  ["Lentil Soup", 8.5, "شوربة عدس"],
  ["Chicken Soup", 11, "شوربة دجاج"],
  ["Mushroom Soup", 11, "شوربة الفطر"],
  ["Vegetable Soup", 11, "شوربة الخضار"],
]);

add("ajman", "western", [
  ["Cordon Blue Chicken", 39, "كوردون بلو دجاج"],
  ["Fahita", 27, "فاهيتا"],
  ["Chicken Scallops", 32, "اسكالوب دجاج ميلانيز"],
  ["Chicken Steak", 32, "ستيك دجاج"],
  ["Beef Fillet Bwvir", 39, "فيليه لحم بوافير"],
  ["Beef Fillet & Mushroom Sauce", 39, "فيليه لحم مع صوص فطر"],
]);

add("ajman", "oven", [
  ["Kofta & Tomatoes", 29, "كفتة بالبندورة", "Served with homus and vegetables"],
  ["Kofta & Tahini", 29, "كفتة بالطحينة", "Served with homus and vegetables"],
  ["Chicken Slices & Potatoes", 29, "شرحات دجاج بالبطاطا", "Served with homus and vegetables"],
  ["Meat Slices & Potatoes", 29, "شرحات لحم بالبطاطا", "Served with homus and vegetables"],
  ["Chicken Liver", 29, "كبدة دجاج", "Served with homus and vegetables"],
  ["Sheep Liver", 29, "كبدة غنم", "Served with homus and vegetables"],
  ["Lamb's Brain", 29, "نخاعات", "Served with homus and vegetables"],
]);

add("ajman", "manakish", [
  ["Cheese", 6, "جبنة"],
  ["Zatar", 5.5, "زعتر"],
  ["Meat & Dough pomegranate molasses", 6, "لحم بعجين دبس الرمان"],
  ["Meat & Dough Vegetables", 6, "لحم بعجين خضار"],
  ["Spinach", 6, "سبانخ"],
  ["Labnah & Vegetables", 6.5, "لبنة بالخضرة"],
  ["Cheese With Meat", 6.5, "جبنة باللحمة"],
  ["Labnah With Zatar", 6.5, "لبنة بالزعتر"],
  ["Cheese With Zatar", 6.5, "جبنة بالزعتر"],
  ["Mortadella Cheese", 6.5, "جبنة مرتديلا"],
  ["Cheese Marmara", 6.5, "جبنة بالمحمرة"],
  ["Shamyat Plate", 15, "صحن شاميات"],
]);

add("ajman", "sweets", [
  ["Rice With Milk", 7.5, "رز بالحليب"],
  ["Creme Caramel", 7.5, "كريم كراميل"],
  ["Muhalabia", 7.5, "مهلبية"],
]);

add("ajman", "juices", [
  ["Orange", 10.5, "برتقال"],
  ["Fruit Cocktail", 13, "كوكتيل فواكة"],
  ["Avocado", 14, "أفوكادو"],
  ["Strawberries", 13, "فراولة"],
  ["Mango", 14, "مانجو"],
  ["Bananas With Milk", 13, "موز بالحليب"],
  ["Pomegranate", 16, "رمان"],
  ["Carrots", 13, "جزر"],
  ["Apple", 15, "تفاح"],
  ["Pineapple", 14, "أناناس"],
  ["Watermelon", 13, "بطيخ"],
  ["Melon", 13, "شمام"],
  ["Lemon Mint", 13, "ليمون نعناع"],
  ["Fruit Salad", 18, "سلطة فواكة"],
]);

add("ajman", "drinks", [
  ["Laban Ayran", 5.5, "عيران"],
  ["Lemonade", 6, "ليموناضة"],
  ["Pepsi", 3.15, "بيبسي"],
  ["Small Water", 2, "مياه صغير"],
  ["Big Water", 4, "مياه كبير"],
]);

export const menuItems = items;

// Order of sections on the menu page.
export const categories = [
  { id: "grills", name: "Grilled meals", ar: "وجبات المشاوي" },
  { id: "grills-kg", name: "Grills by the kilo", ar: "مشاوي بالكيلو" },
  { id: "shawarma", name: "Shawarma", ar: "الشاورما" },
  { id: "shawarma-meals", name: "Shawarma meals", ar: "وجبات الشاورما" },
  { id: "farooj", name: "Al Farooj Al Shami dishes", ar: "أطباق الفروج الشامي" },
  { id: "broasted", name: "Broasted", ar: "البروستد" },
  { id: "hot", name: "Hot appetizers", ar: "المقبلات الساخنة" },
  { id: "cold", name: "Cold appetizers", ar: "مقبلات" },
  { id: "salads", name: "Salads", ar: "السلطات" },
  { id: "fattah", name: "Foul & fatteh", ar: "فول و فتات" },
  { id: "soup", name: "Soup", ar: "شوربة" },
  { id: "oven", name: "Oven trays", ar: "صواني بالفرن" },
  { id: "seafood", name: "Seafood", ar: "مأكولات بحرية" },
  { id: "western", name: "Western dishes", ar: "وجبات غربية" },
  { id: "special", name: "Special meals", ar: "وجبات مميزة" },
  { id: "pasta", name: "Pasta", ar: "باستا" },
  { id: "sandwiches", name: "Sandwiches", ar: "سندويشات" },
  { id: "grill-sandwiches", name: "Grill sandwiches", ar: "سندويش المشاوي" },
  { id: "manakish", name: "Manakish", ar: "المناقيش" },
  { id: "shamyat", name: "Shamyat", ar: "شاميات" },
  { id: "pizza", name: "Pizza", ar: "بيتزا" },
  { id: "sweets", name: "Sweets", ar: "حلويات" },
  { id: "juices", name: "Fresh juices", ar: "العصائر" },
  { id: "drinks", name: "Drinks", ar: "المشروبات" },
];

// No special offers are printed on the menus yet. Add them here when the owner confirms them.
export const offers = [];

const maps = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// Names and phone numbers as printed on the branch menus and the official
// branches page. Hours are shown only where a menu prints them.
export const locations = [
  {
    id: "rigga",
    name: "Al Rigga",
    ar: "الرقة",
    city: "Dubai",
    cityAr: "دبي",
    address: "Al Rigga Street, Dubai",
    addressAr: "شارع الرقة، دبي",
    phone: "04 299 9112",
    phones: ["04 299 9112", "04 299 9340"],
    phoneHref: "tel:+97142999112",
    whatsapp: "",
    trn: "", // UAE VAT registration number (TRN): shown on invoices once filled in
    hours: "",
    deliveryFee: 0,
    deliveryNote: "",
    maps: maps("Al Farooj Al Shami Restaurant Al Rigga Street Dubai"),
    hero: "/images/food/grills.webp",
  },
  {
    id: "intl",
    name: "International City",
    ar: "إنترناشيونال سيتي",
    city: "Dubai",
    cityAr: "دبي",
    address: "International City, Dubai",
    addressAr: "إنترناشيونال سيتي، دبي",
    phone: "04 584 1456",
    phones: ["04 584 1456"],
    phoneHref: "tel:+97145841456",
    whatsapp: "",
    trn: "",
    hours: "Orders 8:00 AM – 3:00 AM",
    deliveryFee: 0,
    deliveryNote: "",
    maps: maps("Al Farooj Al Shami Restaurant International City Dubai"),
    hero: "/images/food/seafood.webp",
  },
  {
    id: "muweilah",
    name: "Muweilah",
    ar: "مويلح",
    city: "Sharjah",
    cityAr: "الشارقة",
    address: "Muweilah, Sharjah (Branch 1)",
    addressAr: "مويلح، الشارقة (فرع 1)",
    phone: "06 565 9922",
    phones: ["06 565 9922"],
    phoneHref: "tel:+97165659922",
    whatsapp: "",
    trn: "",
    hours: "",
    deliveryFee: 0,
    deliveryNote: "Free delivery",
    maps: maps("Al Farooj Al Shami Restaurant Muweilah Sharjah"),
    hero: "/images/food/shawarma.webp",
  },
  {
    id: "sahara",
    name: "Sahara",
    ar: "صحارى",
    city: "Sharjah",
    cityAr: "الشارقة",
    address: "Sahara Mall, Sharjah (Branch 2)",
    addressAr: "صحارى مول، الشارقة (فرع 2)",
    phone: "06 546 6617",
    phones: ["06 546 6617"],
    phoneHref: "tel:+97165466617",
    whatsapp: "",
    trn: "",
    hours: "",
    deliveryFee: 0,
    deliveryNote: "Free delivery",
    maps: maps("Al Farooj Al Shami Restaurant Sahara Sharjah"),
    hero: "/images/food/broasted.webp",
  },
  {
    id: "ajman",
    name: "Ajman",
    ar: "عجمان",
    city: "Ajman",
    cityAr: "عجمان",
    address: "Sheikh Rashid bin Humaid Street, Ajman Towers 1, Ajman",
    addressAr: "شارع الشيخ راشد بن حميد، أبراج عجمان 1، عجمان",
    phone: "06 744 4711",
    phones: ["06 744 4711"],
    phoneHref: "tel:+97167444711",
    whatsapp: "",
    trn: "",
    hours: "",
    deliveryFee: 0,
    deliveryNote: "Free delivery",
    maps: maps("Al Farooj Al Shami Restaurant Ajman Towers Ajman"),
    hero: "/images/food/kabsa.webp",
  },
];

// Photos are the restaurant's own menu photography.
const food = (name) => `/images/food/${name}.webp`;

export const categoryPhotos = {
  grills: food("grills"),
  "grills-kg": food("grills"),
  shawarma: food("shawarma2"),
  "shawarma-meals": food("shawarma"),
  farooj: food("kabsa"),
  broasted: food("broasted"),
  hot: food("fattah"),
  cold: food("appetizers"),
  salads: food("salads"),
  fattah: food("fattah"),
  soup: food("kabsa"),
  oven: food("oven"),
  seafood: food("seafood"),
  western: food("fish"),
  special: food("fish"),
  pasta: food("fish"),
  sandwiches: food("sandwiches"),
  "grill-sandwiches": food("sandwiches"),
  manakish: food("pizza"),
  shamyat: food("oven"),
  pizza: food("pizza"),
  sweets: food("sweets"),
  juices: food("sweets"),
  drinks: food("sweets"),
};

// Categories that have a real photo of their own (the rest use the pattern tile).
export const photoCategories = new Set([
  "grills", "grills-kg", "shawarma", "shawarma-meals", "farooj", "broasted", "cold", "salads", "fattah",
  "oven", "seafood", "sandwiches", "grill-sandwiches", "pizza", "sweets",
]);

// Signature picks on the home page: the first name found on the branch menu wins.
export const signaturePicks = [
  { names: ["Mixed Grill", "Mix Grilled", "Mix Grills Plate", "Mix Grill"], cat: "grills", photo: food("grills"), tag: "From the charcoal" },
  { names: ["Chicken Shawarma Plate", "Chicken Shawerma Plate"], photo: food("shawarma"), tag: "Shawarma" },
  { names: ["Half Broasted Chicken", "Half Of Broasted Chicken", "Half Broasted"], photo: food("broasted"), tag: "Crispy" },
  { names: ["Chicken Charcoal Kabsa", "Chicken Kabsa On Charcoal", "Chicken Kabsa On charcoal", "Chicken Kabsa"], photo: food("kabsa"), tag: "House dish" },
  { names: ["Fatteh with Minced Meat", "Fatteh With Meat", "Fatta With Meat", "Fatteh with Meat"], photo: food("fattah"), tag: "Breakfast favourite" },
  { names: ["Al Farooj Al Shami Burger", "Al Farooj Al Shami Chicken Burger Meal", "Al Farooj Al Shami Chicken Burger"], photo: food("sandwiches"), tag: "Sandwich" },
  { names: ["Shrimps Grilled / Fried", "Shrimp (grilled or fried)", "Grilled Shrimp", "Hamur Fish Fillet Grilled"], photo: food("seafood"), tag: "Seafood" },
];

export function picksFor(locationId) {
  const list = items.filter((item) => item.location === locationId);
  return signaturePicks
    .map((pick) => {
      const ok = (item) => !pick.cat || item.category === pick.cat;
      for (const name of pick.names) {
        const found = list.find((item) => item.name.toLowerCase() === name.toLowerCase() && ok(item));
        if (found) return { ...found, photo: pick.photo, tag: pick.tag };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6);
}

export const galleryPhotos = [
  { src: food("grills"), caption: "Mixed grill by the kilo, straight off the charcoal" },
  { src: food("fattah"), caption: "Fatteh and foul, the Damascus breakfast" },
  { src: food("oven"), caption: "Oven trays with bread from the oven" },
  { src: food("seafood"), caption: "Grilled shrimp with fries and garlic" },
  { src: food("appetizers"), caption: "Mixed appetizers to share" },
];

export function locationById(id) {
  return locations.find((location) => location.id === id) || locations[0];
}

export const tableAreas = ["Family section", "Indoor", "Outdoor"];

export function todayInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function aed(value) {
  const number = Number(value);
  const fixed = number.toFixed(2);
  return `AED ${fixed.endsWith("00") ? String(number) : fixed}`;
}

export function whatsappLink(number, text) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function itemsFor(locationId) {
  return menuItems.filter((item) => item.location === locationId);
}

export function offersFor(locationId) {
  return offers.filter((offer) => offer.location === locationId);
}

export function categoriesFor(locationId) {
  const present = new Set(itemsFor(locationId).map((item) => item.category));
  return categories.filter((category) => present.has(category.id));
}

export const times = (() => {
  const list = [];
  for (let hour = 8; hour <= 26; hour += 1) {
    for (const minute of [0, 30]) {
      const displayHour = hour % 24;
      const suffix = displayHour >= 12 ? "PM" : "AM";
      const hour12 = displayHour % 12 || 12;
      list.push(`${hour12}:${minute === 0 ? "00" : "30"} ${suffix}`);
    }
  }
  return list;
})();

export function entryById(id) {
  return menuItems.find((item) => item.id === id) || offers.find((offer) => offer.id === id) || null;
}

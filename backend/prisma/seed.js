import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import { createInventoryRecord } from '../src/services/inventory.service.js';

// ─── Categories (25 grocery categories) ──────────────────────────────────────
const categories = [
  { name: 'Biscuits & Cookies' },
  { name: 'Soft Drinks & Beverages' },
  { name: 'Chocolates & Candies' },
  { name: 'Meat & Poultry' },
  { name: 'Lentils & Pulses' },
  { name: 'Shampoo & Hair Care' },
  { name: 'Face Wash & Skin Care' },
  { name: 'Rice & Grains' },
  { name: 'Cooking Oils & Ghee' },
  { name: 'Tea & Coffee' },
  { name: 'Milk & Dairy' },
  { name: 'Spices & Seasonings' },
  { name: 'Snacks & Chips' },
  { name: 'Soaps & Detergents' },
  { name: 'Toothpaste & Oral Care' },
  { name: 'Bread & Bakery' },
  { name: 'Frozen Foods' },
  { name: 'Sauces & Condiments' },
  { name: 'Pasta & Noodles' },
  { name: 'Juices & Drinks' },
  { name: 'Eggs & Breakfast' },
  { name: 'Dry Fruits & Nuts' },
  { name: 'Cleaning Supplies' },
  { name: 'Baby Care' },
  { name: 'Health & Wellness' },
];

// ─── Sample vendor ────────────────────────────────────────────────────────────
const vendor = {
  name: 'Al-Fatah Wholesale',
  contactName: 'Ahmed Khan',
  phone: '0300-1234567',
  email: 'sales@alfatah.pk',
  address: 'Shah Alam Market, Lahore',
};

// ─── Products data ────────────────────────────────────────────────────────────
// [categoryIndex, name, unit, purchasePrice, purchaseTaxPercent, salePrice, barcode?]
// costPrice = purchasePrice × (1 + purchaseTaxPercent / 100) — computed below

const productsData = [
  // ── Biscuits & Cookies (0) — 22 items ──
  [0, 'Oreo Original 154g', 'PCS', 130, 0, 170, '8964000289123'],
  [0, 'Oreo Vanilla 154g', 'PCS', 130, 0, 170, '8964000289130'],
  [0, 'Oreo Strawberry 154g', 'PCS', 130, 0, 170, '8964000289147'],
  [0, 'Rio Chocolate 132g', 'PCS', 75, 0, 100, '8961000020042'],
  [0, 'Rio Vanilla 132g', 'PCS', 75, 0, 100, '8961000020059'],
  [0, 'Peek Freans Gluco 200g', 'PCS', 100, 0, 130, '8961000010234'],
  [0, 'Peek Freans Marie 200g', 'PCS', 90, 0, 120, '8961000010258'],
  [0, 'Peek Freans Sooper 228g', 'PCS', 75, 0, 100, '8961000010227'],
  [0, 'Peek Freans Zeera 200g', 'PCS', 90, 0, 120, '8961000010241'],
  [0, 'Candi Biscuits 176g', 'PCS', 75, 0, 100, '8961000010302'],
  [0, 'Prince Chocolate 200g', 'PCS', 115, 0, 150, '8964000289208'],
  [0, 'Tuc Cracker 100g', 'PCS', 130, 0, 170, '8961000020035'],
  [0, 'Nan Khatai Classic 200g', 'PCS', 120, 0, 160, '8961000010272'],
  [0, 'Peek Freans Chocolicious 200g', 'PCS', 130, 0, 170, '8961000010289'],
  [0, 'Peek Freans Butter Puff 200g', 'PCS', 100, 0, 130, '8961000010296'],
  [0, 'Slanty Salted 70g', 'PCS', 45, 0, 60, '8961000020066'],
  [0, 'Slanty Masala 70g', 'PCS', 45, 0, 60, '8961000020073'],
  [0, 'Cocomo Chocolate 132g', 'PCS', 75, 0, 100, '8961000010319'],
  [0, 'Jam Hearts 200g', 'PCS', 115, 0, 150, '8961000010333'],
  [0, 'Bisconni Chocolate Chip 200g', 'PCS', 140, 0, 180, '8961000020103'],
  [0, 'Bisconni Classic Butter 200g', 'PCS', 130, 0, 170, '8961000020097'],
  [0, 'Peek Freans Party 200g', 'PCS', 100, 0, 130, '8961000010265'],

  // ── Soft Drinks & Beverages (1) — 20 items ──
  [1, 'Coca Cola 1.5L', 'BOTTLE', 140, 17, 180, '8964000289001'],
  [1, 'Coca Cola 500ml', 'BOTTLE', 65, 17, 90, '8964000289018'],
  [1, 'Coca Cola 250ml', 'BOTTLE', 40, 17, 60, '8964000289025'],
  [1, 'Sprite 1.5L', 'BOTTLE', 140, 17, 180, '8964000289032'],
  [1, 'Sprite 500ml', 'BOTTLE', 65, 17, 90, '8964000289049'],
  [1, 'Fanta 1.5L', 'BOTTLE', 140, 17, 180, '8964000289056'],
  [1, 'Fanta 500ml', 'BOTTLE', 65, 17, 90, '8964000289063'],
  [1, '7Up 1.5L', 'BOTTLE', 140, 17, 180, '8964000289070'],
  [1, 'Pepsi 1.5L', 'BOTTLE', 130, 17, 170, '8964000289087'],
  [1, 'Pepsi 500ml', 'BOTTLE', 60, 17, 85, '8964000289094'],
  [1, 'Mountain Dew 500ml', 'BOTTLE', 65, 17, 90, '8964000289100'],
  [1, 'Sting Berry 500ml', 'BOTTLE', 65, 17, 90, '8964000289117'],
  [1, 'Sting Energy 250ml', 'BOTTLE', 40, 17, 55, '8964000289124'],
  [1, 'Pakola Ice Cream Soda 500ml', 'BOTTLE', 55, 17, 80, '8964000289131'],
  [1, 'Pakola 1.5L', 'BOTTLE', 120, 17, 160, '8964000289155'],
  [1, 'Nestle Pure Life 1.5L', 'BOTTLE', 95, 0, 130, '8964000289162'],
  [1, 'Nestle Pure Life 500ml', 'BOTTLE', 55, 0, 80, '8964000289179'],
  [1, 'Red Bull Energy Drink 250ml', 'BOTTLE', 270, 17, 350, '8964000289186'],
  [1, 'Aquafina Mineral Water 1.5L', 'BOTTLE', 90, 0, 120, '8964000289193'],
  [1, 'Aquafina Mineral Water 500ml', 'BOTTLE', 50, 0, 70, '8964000289209'],

  // ── Chocolates & Candies (2) — 20 items ──
  [2, 'Dairy Milk 52g', 'PCS', 115, 17, 150, '8964000291001'],
  [2, 'Dairy Milk Fruit & Nut 52g', 'PCS', 130, 17, 170, '8964000291018'],
  [2, 'Dairy Milk Bubbly 48g', 'PCS', 115, 17, 150, '8964000291025'],
  [2, 'Dairy Milk Silk 60g', 'PCS', 150, 17, 195, '8964000291032'],
  [2, 'KitKat 36g', 'PCS', 75, 17, 100, '8964000291049'],
  [2, 'KitKat Chunky 50g', 'PCS', 130, 17, 170, '8964000291056'],
  [2, 'Bounty 30g', 'PCS', 75, 17, 100, '8964000291063'],
  [2, 'Mars 35g', 'PCS', 75, 17, 100, '8964000291070'],
  [2, 'Snickers 35g', 'PCS', 75, 17, 100, '8964000291087'],
  [2, 'Twix 35g', 'PCS', 75, 17, 100, '8964000291094'],
  [2, 'Perk 50g', 'PCS', 40, 17, 60, '8964000291100'],
  [2, 'Munch 30g', 'PCS', 25, 17, 40, '8964000291117'],
  [2, 'Now 25g', 'PCS', 20, 17, 30, '8964000291124'],
  [2, 'Galaxy Milk Chocolate 50g', 'PCS', 90, 17, 120, '8964000291131'],
  [2, 'Polo Mint Roll', 'PCS', 12, 17, 20, '8964000291148'],
  [2, 'Doublemint Gum Stick', 'PCS', 5, 17, 10, '8964000291155'],
  [2, 'Eclairs Pack 12pcs', 'PACK', 35, 17, 50, '8964000291162'],
  [2, 'Chupa Chups Lollipop', 'PCS', 35, 17, 50, '8964000291179'],
  [2, 'Alpenliebe Candy', 'PCS', 3, 17, 5, '8964000291186'],
  [2, 'Hilal Candy', 'PCS', 3, 17, 5, '8964000291193'],

  // ── Meat & Poultry (3) — 20 items ──
  [3, 'Chicken Boneless 1kg', 'KG', 650, 0, 800, null],
  [3, 'Chicken with Bone 1kg', 'KG', 470, 0, 580, null],
  [3, 'Chicken Mince 1kg', 'KG', 550, 0, 680, null],
  [3, 'Chicken Wings 1kg', 'KG', 400, 0, 500, null],
  [3, 'Chicken Legs 1kg', 'KG', 530, 0, 650, null],
  [3, 'Chicken Breast Fillet 1kg', 'KG', 690, 0, 850, null],
  [3, 'Chicken Drumsticks 1kg', 'KG', 490, 0, 600, null],
  [3, 'Chicken Liver 1kg', 'KG', 360, 0, 450, null],
  [3, 'Beef Boneless 1kg', 'KG', 900, 0, 1100, null],
  [3, 'Beef with Bone 1kg', 'KG', 640, 0, 800, null],
  [3, 'Beef Mince 1kg', 'KG', 730, 0, 900, null],
  [3, 'Beef Steak Cuts 1kg', 'KG', 1050, 0, 1300, null],
  [3, 'Mutton 1kg', 'KG', 1800, 0, 2200, null],
  [3, 'Mutton Mince 1kg', 'KG', 1950, 0, 2400, null],
  [3, 'Mutton Chops 1kg', 'KG', 2000, 0, 2500, null],
  [3, 'Fish Rahu 1kg', 'KG', 1450, 0, 1800, null],
  [3, 'Fish Tilapia 1kg', 'KG', 1200, 0, 1500, null],
  [3, 'Prawns Large 1kg', 'KG', 1800, 0, 2200, null],
  [3, 'Chicken Whole 1kg', 'KG', 440, 0, 550, null],
  [3, 'Eggs Farm Fresh Dozen', 'PCS', 260, 0, 320, null],

  // ── Lentils & Pulses (4) — 20 items ──
  [4, 'Masoor Dal Brown 1kg', 'KG', 260, 0, 320, '8964000301001'],
  [4, 'Masoor Dal Red 1kg', 'KG', 280, 0, 350, '8964000301018'],
  [4, 'Moong Dal Washed 1kg', 'KG', 225, 0, 280, '8964000301025'],
  [4, 'Moong Dal Chilka 1kg', 'KG', 240, 0, 300, '8964000301032'],
  [4, 'Chana Dal 1kg', 'KG', 275, 0, 340, '8964000301049'],
  [4, 'Mash Dal Washed 1kg', 'KG', 325, 0, 400, '8964000301056'],
  [4, 'Mash Dal Chilka 1kg', 'KG', 305, 0, 380, '8964000301063'],
  [4, 'White Chickpeas Kabuli 1kg', 'KG', 285, 0, 350, '8964000301070'],
  [4, 'Black Chickpeas Kala Chana 1kg', 'KG', 310, 0, 380, '8964000301087'],
  [4, 'Red Kidney Beans 1kg', 'KG', 310, 0, 380, '8964000301094'],
  [4, 'Moth Beans 1kg', 'KG', 245, 0, 300, '8964000301100'],
  [4, 'Green Gram Whole 1kg', 'KG', 245, 0, 300, '8964000301117'],
  [4, 'Split Chickpeas Chana 1kg', 'KG', 285, 0, 350, '8964000301124'],
  [4, 'Split Pigeon Peas Toor Dal 1kg', 'KG', 360, 0, 450, '8964000301131'],
  [4, 'Lobia White 1kg', 'KG', 290, 0, 360, '8964000301148'],
  [4, 'Soybean 1kg', 'KG', 260, 0, 320, '8964000301155'],
  [4, 'Mixed Pulses Combo 1kg', 'KG', 280, 0, 350, '8964000301162'],
  [4, 'Brown Lentils 1kg', 'KG', 260, 0, 320, '8964000301179'],
  [4, 'Dry Green Peas 1kg', 'KG', 220, 0, 270, '8964000301186'],
  [4, 'Chickpea Flour Besan 1kg', 'KG', 285, 0, 350, '8964000301193'],

  // ── Shampoo & Hair Care (5) — 18 items ──
  [5, 'Head & Shoulders Classic 400ml', 'BOTTLE', 760, 17, 950, '8964000302008'],
  [5, 'Head & Shoulders Menthol 400ml', 'BOTTLE', 760, 17, 950, '8964000302015'],
  [5, 'Pantene Pro-V Silky 400ml', 'BOTTLE', 720, 17, 900, '8964000302022'],
  [5, 'Pantene Pro-V Anti-Dandruff 400ml', 'BOTTLE', 720, 17, 900, '8964000302039'],
  [5, 'Sunsilk Black 400ml', 'BOTTLE', 640, 17, 800, '8964000302046'],
  [5, 'Sunsilk Pink Soft Smooth 400ml', 'BOTTLE', 640, 17, 800, '8964000302053'],
  [5, 'Lifebuoy Shampoo 400ml', 'BOTTLE', 520, 17, 650, '8964000302060'],
  [5, 'Clear Anti-Dandruff 400ml', 'BOTTLE', 680, 17, 850, '8964000302077'],
  [5, 'Dove Intense Repair 400ml', 'BOTTLE', 760, 17, 950, '8964000302084'],
  [5, 'Garnier Ultra Doux 400ml', 'BOTTLE', 640, 17, 800, '8964000302091'],
  [5, 'Selsun Blue 120ml', 'BOTTLE', 360, 17, 450, '8964000302114'],
  [5, 'Tresemme Keratin 400ml', 'BOTTLE', 800, 17, 1000, '8964000302121'],
  [5, 'Johnson Baby Shampoo 200ml', 'BOTTLE', 320, 17, 400, '8964000302138'],
  [5, 'Sunsilk Conditioner 200ml', 'BOTTLE', 360, 17, 450, '8964000302145'],
  [5, 'Pantene Conditioner 200ml', 'BOTTLE', 400, 17, 500, '8964000302152'],
  [5, 'Keo Karpin Hair Oil 200ml', 'BOTTLE', 240, 17, 300, '8964000302169'],
  [5, 'Set Wet Hair Gel 150ml', 'PCS', 200, 17, 250, '8964000302176'],
  [5, 'Garnier Color Naturals 1pk', 'PCS', 480, 17, 600, '8964000302183'],

  // ── Face Wash & Skin Care (6) — 18 items ──
  [6, 'Ponds White Beauty Face Wash 100g', 'PCS', 360, 17, 450, '8964000303005'],
  [6, 'Ponds Men Face Wash 100g', 'PCS', 360, 17, 450, '8964000303012'],
  [6, 'Ponds Moisturizing Cream 200ml', 'PCS', 480, 17, 600, '8964000303029'],
  [6, 'Neutrogena Deep Clean 150ml', 'BOTTLE', 680, 17, 850, '8964000303036'],
  [6, 'Garnier Light Face Wash 100g', 'PCS', 360, 17, 450, '8964000303043'],
  [6, 'Garnier Men Acno Fight 100g', 'PCS', 360, 17, 450, '8964000303050'],
  [6, 'Clean & Clear Face Wash 100ml', 'BOTTLE', 320, 17, 400, '8964000303067'],
  [6, 'Clean & Clear Morning Energy 100ml', 'BOTTLE', 320, 17, 400, '8964000303074'],
  [6, 'Loreal Men Face Wash 100ml', 'BOTTLE', 480, 17, 600, '8964000303081'],
  [6, 'Nivea Soft Cream 100ml', 'PCS', 400, 17, 500, '8964000303098'],
  [6, 'Nivea Lip Balm Original', 'PCS', 120, 17, 150, '8964000303104'],
  [6, 'Vaseline Intensive Care Lotion 400ml', 'BOTTLE', 640, 17, 800, '8964000303111'],
  [6, 'Vaseline Petroleum Jelly 250ml', 'PCS', 560, 17, 700, '8964000303128'],
  [6, 'Himalaya Neem Face Wash 100ml', 'BOTTLE', 280, 17, 350, '8964000303135'],
  [6, 'St Ives Apricot Scrub 170g', 'PCS', 600, 17, 750, '8964000303142'],
  [6, 'Sunscreen SPF 60 U-Veil 60ml', 'PCS', 560, 17, 700, '8964000303166'],
  [6, 'Fair & Lovely Cream 25g', 'PCS', 120, 17, 150, '8964000303173'],
  [6, 'Bio Aqua Sheet Mask 1pc', 'PCS', 160, 17, 200, '8964000303180'],

  // ── Rice & Grains (7) — 16 items ──
  [7, 'Super Basmati Rice 1kg', 'KG', 310, 0, 380, '8964000304002'],
  [7, 'Super Basmati Rice 5kg', 'KG', 1500, 0, 1850, '8964000304019'],
  [7, 'Basmati Rice 1kg', 'KG', 285, 0, 350, '8964000304026'],
  [7, 'Sella Rice 1kg', 'KG', 225, 0, 280, '8964000304033'],
  [7, 'Broken Rice 1kg', 'KG', 145, 0, 180, '8964000304040'],
  [7, 'Wheat Flour Atta 5kg', 'KG', 530, 0, 650, '8964000304057'],
  [7, 'Wheat Flour Atta 10kg', 'KG', 1020, 0, 1250, '8964000304064'],
  [7, 'White Flour Maida 1kg', 'KG', 145, 0, 180, '8964000304071'],
  [7, 'Semolina Suji 1kg', 'KG', 130, 0, 160, '8964000304088'],
  [7, 'Gram Flour Besan 1kg', 'KG', 285, 0, 350, '8964000304095'],
  [7, 'Corn Flour 500g', 'PACK', 160, 0, 200, '8964000304101'],
  [7, 'Custard Powder Rafhan 500g', 'PACK', 200, 0, 250, '8964000304118'],
  [7, 'Jelly Mix Rafhan 500g', 'PACK', 175, 0, 220, '8964000304125'],
  [7, 'Brown Rice 1kg', 'KG', 260, 0, 320, '8964000304132'],
  [7, 'Quinoa Seeds 500g', 'PACK', 650, 0, 800, '8964000304149'],
  [7, 'Basmati Rice 5kg', 'KG', 1380, 0, 1700, '8964000304156'],

  // ── Cooking Oils & Ghee (8) — 16 items ──
  [8, 'Dalda Cooking Oil 5L', 'BOTTLE', 2280, 17, 2800, '8964000305009'],
  [8, 'Dalda Cooking Oil 1L', 'BOTTLE', 480, 17, 600, '8964000305016'],
  [8, 'Dalda Banaspati Ghee 1kg', 'KG', 400, 17, 500, '8964000305023'],
  [8, 'Sufi Cooking Oil 5L', 'BOTTLE', 2200, 17, 2700, '8964000305030'],
  [8, 'Sufi Cooking Oil 1L', 'BOTTLE', 460, 17, 580, '8964000305047'],
  [8, 'Habib Cooking Oil 5L', 'BOTTLE', 2150, 17, 2650, '8964000305054'],
  [8, 'Soya Supreme Oil 5L', 'BOTTLE', 2250, 17, 2750, '8964000305061'],
  [8, 'Canola Oil 5L', 'BOTTLE', 2380, 17, 2900, '8964000305078'],
  [8, 'Shan Banaspati Ghee 1kg', 'KG', 420, 17, 520, '8964000305085'],
  [8, 'Olive Oil Extra Virgin 500ml', 'BOTTLE', 980, 17, 1200, '8964000305092'],
  [8, 'Corn Oil 1L', 'BOTTLE', 640, 17, 800, '8964000305108'],
  [8, 'Mustard Oil 1L', 'BOTTLE', 440, 17, 550, '8964000305115'],
  [8, 'Kisan Canola Oil 5L', 'BOTTLE', 2200, 17, 2700, '8964000305122'],
  [8, 'Dalda Ghee 500g', 'PACK', 210, 17, 260, '8964000305139'],
  [8, 'Coconut Oil 500ml', 'BOTTLE', 480, 17, 600, '8964000305146'],
  [8, 'Mezan Cooking Oil 5L', 'BOTTLE', 2180, 17, 2680, '8964000305153'],

  // ── Tea & Coffee (9) — 16 items ──
  [9, 'Tapal Danedar Tea 200g', 'PACK', 365, 17, 450, '8964000306006'],
  [9, 'Tapal Danedar Tea 400g', 'PACK', 690, 17, 850, '8964000306013'],
  [9, 'Tapal Family Mixture 200g', 'PACK', 310, 17, 380, '8964000306020'],
  [9, 'Lipton Yellow Label 200g', 'PACK', 325, 17, 400, '8964000306037'],
  [9, 'Lipton Yellow Label 400g', 'PACK', 610, 17, 750, '8964000306044'],
  [9, 'Brooke Bond Supreme 200g', 'PACK', 310, 17, 380, '8964000306051'],
  [9, 'Vital Tea 200g', 'PACK', 285, 17, 350, '8964000306068'],
  [9, 'Nescafe Classic 200g', 'BOTTLE', 900, 17, 1100, '8964000306075'],
  [9, 'Nescafe Classic 50g', 'BOTTLE', 260, 17, 320, '8964000306082'],
  [9, 'Nescafe Gold 100g', 'BOTTLE', 730, 17, 900, '8964000306099'],
  [9, 'Nestea Lemon Tea Bags 25pcs', 'PACK', 245, 17, 300, '8964000306105'],
  [9, 'Lipton Green Tea 25 Bags', 'PACK', 200, 17, 250, '8964000306112'],
  [9, 'Qarshi Johar Joshanda 1pk', 'PCS', 80, 17, 100, '8964000306129'],
  [9, 'Kashmiri Chai Green Tea 200g', 'PACK', 325, 17, 400, '8964000306136'],
  [9, 'Nescafe 3-in-1 Sachet 1pc', 'PCS', 65, 17, 80, '8964000306143'],
  [9, 'Tapal Mezban 200g', 'PACK', 285, 17, 350, '8964000306150'],

  // ── Milk & Dairy (10) — 18 items ──
  [10, 'Olpers Milk 1L', 'BOTTLE', 200, 0, 250, '8964000307003'],
  [10, 'Olpers Milk 250ml', 'BOTTLE', 48, 0, 65, '8964000307010'],
  [10, 'Milkpak Full Cream 1L', 'BOTTLE', 195, 0, 245, '8964000307027'],
  [10, 'Milkpak Full Cream 250ml', 'BOTTLE', 46, 0, 60, '8964000307034'],
  [10, 'Milkpak Cream 200ml', 'PACK', 96, 0, 120, '8964000307041'],
  [10, 'Nestle Yogurt Plain 400g', 'PACK', 145, 0, 180, '8964000307058'],
  [10, 'Olpers Cream 250ml', 'PACK', 105, 0, 130, '8964000307065'],
  [10, 'Everyday Powder Milk 400g', 'PACK', 480, 0, 600, '8964000307072'],
  [10, 'Nestle Milk Powder 400g', 'PACK', 440, 0, 550, '8964000307089'],
  [10, 'Nurpur Butter 200g', 'PACK', 360, 0, 450, '8964000307096'],
  [10, 'Cheddar Cheese 250g', 'PACK', 440, 0, 550, '8964000307102'],
  [10, 'Cheese Slices 200g', 'PACK', 385, 0, 480, '8964000307119'],
  [10, 'Fresh Cream 500ml', 'BOTTLE', 200, 0, 250, '8964000307126'],
  [10, 'Laban 1L', 'BOTTLE', 160, 0, 200, '8964000307133'],
  [10, 'Flavored Milk Strawberry 250ml', 'BOTTLE', 68, 0, 90, '8964000307140'],
  [10, 'Day Fresh Milk 1L', 'BOTTLE', 190, 0, 240, '8964000307157'],
  [10, 'Fresh Yogurt 1kg', 'KG', 260, 0, 320, '8964000307164'],
  [10, 'Puck Cheese Spread 200g', 'PACK', 320, 0, 400, '8964000307171'],

  // ── Spices & Seasonings (11) — 20 items ──
  [11, 'Red Chilli Powder 200g', 'PACK', 200, 0, 250, '8964000308000'],
  [11, 'Turmeric Powder Haldi 200g', 'PACK', 160, 0, 200, '8964000308017'],
  [11, 'Cumin Seeds Zeera 100g', 'PACK', 120, 0, 150, '8964000308024'],
  [11, 'Coriander Powder 200g', 'PACK', 145, 0, 180, '8964000308031'],
  [11, 'Garam Masala 100g', 'PACK', 160, 0, 200, '8964000308048'],
  [11, 'Salt Refined 1kg', 'PACK', 45, 0, 60, '8964000308055'],
  [11, 'Black Pepper Whole 100g', 'PACK', 325, 0, 400, '8964000308062'],
  [11, 'Black Pepper Powder 100g', 'PACK', 350, 0, 430, '8964000308079'],
  [11, 'Shan Biryani Masala 50g', 'PACK', 96, 0, 120, '8964000308086'],
  [11, 'Shan Chaat Masala 100g', 'PACK', 105, 0, 130, '8964000308093'],
  [11, 'Shan Nihari Masala 50g', 'PACK', 96, 0, 120, '8964000308109'],
  [11, 'Shan Karahi Masala 50g', 'PACK', 96, 0, 120, '8964000308116'],
  [11, 'National Biryani Masala 50g', 'PACK', 88, 0, 110, '8964000308123'],
  [11, 'Cloves Long 50g', 'PACK', 200, 0, 250, '8964000308130'],
  [11, 'Cardamom Elachi 50g', 'PACK', 285, 0, 350, '8964000308147'],
  [11, 'Cinnamon Darchini 100g', 'PACK', 225, 0, 280, '8964000308154'],
  [11, 'Bay Leaves Tez Patta 50g', 'PACK', 120, 0, 150, '8964000308161'],
  [11, 'Nutmeg Jaifal Whole 1pc', 'PCS', 80, 0, 100, '8964000308178'],
  [11, 'Shan Achar Gosht Masala 50g', 'PACK', 96, 0, 120, '8964000308185'],
  [11, 'Fenugreek Seeds Methi 100g', 'PACK', 80, 0, 100, '8964000308192'],

  // ── Snacks & Chips (12) — 18 items ──
  [12, 'Lays Classic 70g', 'PCS', 80, 17, 100, '8964000309007'],
  [12, 'Lays Masala 70g', 'PCS', 80, 17, 100, '8964000309014'],
  [12, 'Lays French Cheese 70g', 'PCS', 80, 17, 100, '8964000309021'],
  [12, 'Lays 35g', 'PCS', 38, 17, 50, '8964000309038'],
  [12, 'Kurkure Original 70g', 'PCS', 55, 17, 70, '8964000309045'],
  [12, 'Kurkure Chilli 70g', 'PCS', 55, 17, 70, '8964000309052'],
  [12, 'Kurkure 35g', 'PCS', 30, 17, 40, '8964000309069'],
  [12, 'Cheetos Cheese 70g', 'PCS', 64, 17, 80, '8964000309076'],
  [12, 'Pringles Original 150g', 'PCS', 480, 17, 600, '8964000309083'],
  [12, 'Nimco Mix 200g', 'PACK', 200, 0, 250, '8964000309090'],
  [12, 'Peanuts Salted 200g', 'PACK', 160, 0, 200, '8964000309106'],
  [12, 'Popcorn Kernels 500g', 'PACK', 200, 0, 250, '8964000309113'],
  [12, 'Khaplai 200g', 'PACK', 145, 0, 180, '8964000309120'],
  [12, 'Super Crisp 70g', 'PCS', 64, 17, 80, '8964000309137'],
  [12, 'Cheese Balls 70g', 'PCS', 64, 17, 80, '8964000309144'],
  [12, 'Corn Puffers 70g', 'PCS', 55, 17, 70, '8964000309151'],
  [12, 'Banana Chips 200g', 'PACK', 200, 0, 250, '8964000309168'],
  [12, 'Papad Lentil 200g', 'PACK', 120, 0, 150, '8964000309175'],

  // ── Soaps & Detergents (13) — 18 items ──
  [13, 'Lifebuoy Soap 115g', 'PCS', 68, 17, 90, '8964000310003'],
  [13, 'Lux Soap 115g', 'PCS', 76, 17, 100, '8964000310010'],
  [13, 'Lux Velvet Soap 115g', 'PCS', 76, 17, 100, '8964000310027'],
  [13, 'Dove Soap Original 100g', 'PCS', 112, 17, 140, '8964000310034'],
  [13, 'Dettol Soap Original 115g', 'PCS', 76, 17, 100, '8964000310041'],
  [13, 'Safeguard Soap 115g', 'PCS', 72, 17, 95, '8964000310058'],
  [13, 'Cinthol Soap 100g', 'PCS', 60, 17, 80, '8964000310065'],
  [13, 'Pears Soap 100g', 'PCS', 105, 17, 130, '8964000310072'],
  [13, 'Palmolive Soap 100g', 'PCS', 76, 17, 100, '8964000310089'],
  [13, 'Ariel Detergent Powder 1kg', 'PACK', 285, 17, 350, '8964000310096'],
  [13, 'Surf Excel Powder 1kg', 'PACK', 285, 17, 350, '8964000310102'],
  [13, 'Brite Total Powder 1kg', 'PACK', 175, 17, 220, '8964000310119'],
  [13, 'Wheel Detergent 1kg', 'PACK', 160, 17, 200, '8964000310126'],
  [13, 'Express Power Liquid 500ml', 'BOTTLE', 285, 17, 350, '8964000310133'],
  [13, 'Vim Dishwash Bar 200g', 'PCS', 60, 17, 80, '8964000310140'],
  [13, 'Vim Dishwash Liquid 500ml', 'BOTTLE', 240, 17, 300, '8964000310157'],
  [13, 'Dettol Handwash 200ml', 'BOTTLE', 240, 17, 300, '8964000310164'],
  [13, 'Lifebuoy Handwash 200ml', 'BOTTLE', 200, 17, 250, '8964000310171'],

  // ── Toothpaste & Oral Care (14) — 16 items ──
  [14, 'Colgate Toothpaste 200g', 'PCS', 285, 17, 350, '8964000311000'],
  [14, 'Colgate Toothpaste 100g', 'PCS', 160, 17, 200, '8964000311017'],
  [14, 'Colgate Max Fresh 150g', 'PCS', 225, 17, 280, '8964000311024'],
  [14, 'Close Up Gel 150g', 'PCS', 225, 17, 280, '8964000311031'],
  [14, 'Close Up Red Hot 150g', 'PCS', 225, 17, 280, '8964000311048'],
  [14, 'Sensodyne 100g', 'PCS', 365, 17, 450, '8964000311055'],
  [14, 'Shield Toothpaste 100g', 'PCS', 145, 17, 180, '8964000311062'],
  [14, 'Forhans Toothpaste 100g', 'PCS', 120, 17, 150, '8964000311079'],
  [14, 'Medicam Toothpaste 100g', 'PCS', 130, 17, 160, '8964000311086'],
  [14, 'Colgate Toothbrush', 'PCS', 145, 17, 180, '8964000311093'],
  [14, 'Colgate Zigzag Toothbrush', 'PCS', 160, 17, 200, '8964000311109'],
  [14, 'Shield Toothbrush', 'PCS', 96, 17, 120, '8964000311116'],
  [14, 'Listerine Mouthwash 250ml', 'BOTTLE', 570, 17, 700, '8964000311123'],
  [14, 'Colgate Plax Mouthwash 250ml', 'BOTTLE', 440, 17, 550, '8964000311130'],
  [14, 'Dental Floss 50m', 'PCS', 200, 17, 250, '8964000311147'],
  [14, 'Miswak Traditional', 'PCS', 45, 0, 60, '8964000311154'],

  // ── Bread & Bakery (15) — 16 items ──
  [15, 'Bread White Large', 'PCS', 130, 0, 170, null],
  [15, 'Bread Brown Large', 'PCS', 150, 0, 190, null],
  [15, 'Milk Bread Large', 'PCS', 160, 0, 200, null],
  [15, 'Cake Slice Plain', 'PCS', 45, 0, 60, null],
  [15, 'Cupcake Vanilla', 'PCS', 60, 0, 80, null],
  [15, 'Rusk 200g', 'PACK', 120, 0, 150, '8964000312007'],
  [15, 'Burger Bun 4pcs', 'PACK', 90, 0, 120, '8964000312014'],
  [15, 'Naan 1pc', 'PCS', 22, 0, 30, null],
  [15, 'Roti Tandoor 1pc', 'PCS', 15, 0, 20, null],
  [15, 'Paratha Frozen 5pcs', 'PACK', 240, 0, 300, '8964000312021'],
  [15, 'Samosa 2pcs', 'PACK', 45, 0, 60, null],
  [15, 'Chicken Patties 1pc', 'PCS', 60, 0, 80, null],
  [15, 'Sandwich Bread White', 'PCS', 150, 0, 190, '8964000312038'],
  [15, 'Garlic Bread Stick', 'PCS', 120, 0, 150, null],
  [15, 'Pizza Base 1pc', 'PCS', 160, 0, 200, null],
  [15, 'Croissant 1pc', 'PCS', 80, 0, 100, null],

  // ── Frozen Foods (16) — 18 items ──
  [16, 'Frozen Paratha 10pcs', 'PACK', 365, 0, 450, '8964000313004'],
  [16, 'Frozen Chappati 10pcs', 'PACK', 280, 0, 350, '8964000313011'],
  [16, 'Chicken Nuggets 500g', 'PACK', 570, 0, 700, '8964000313028'],
  [16, 'Frozen French Fries 1kg', 'PACK', 440, 0, 550, '8964000313035'],
  [16, 'Frozen Samosa 12pcs', 'PACK', 325, 0, 400, '8964000313042'],
  [16, 'Beef Burger Patty 6pcs', 'PACK', 530, 0, 650, '8964000313059'],
  [16, 'Chicken Burger Patty 6pcs', 'PACK', 440, 0, 550, '8964000313066'],
  [16, 'Frozen Spring Rolls 12pcs', 'PACK', 365, 0, 450, '8964000313073'],
  [16, 'Fish Fingers 500g', 'PACK', 570, 0, 700, '8964000313080'],
  [16, 'K&N Chicken Chappal Kabab 6pcs', 'PACK', 480, 0, 600, '8964000313097'],
  [16, 'K&N Chicken Kofta 12pcs', 'PACK', 440, 0, 550, '8964000313103'],
  [16, 'Menu Ice Cream 1L', 'PACK', 400, 0, 500, '8964000313110'],
  [16, 'WALLS Ice Cream Cup 100ml', 'PCS', 52, 17, 70, '8964000313127'],
  [16, 'WALLS Cornetto', 'PCS', 76, 17, 100, '8964000313134'],
  [16, 'WALLS Feast', 'PCS', 60, 17, 80, '8964000313141'],
  [16, 'Frozen Mixed Vegetables 500g', 'PACK', 240, 0, 300, '8964000313158'],
  [16, 'Frozen Chicken Seekh Kabab 6pcs', 'PACK', 440, 0, 550, '8964000313165'],
  [16, 'Frozen Pizza 1pc', 'PCS', 480, 0, 600, '8964000313172'],

  // ── Sauces & Condiments (17) — 18 items ──
  [17, 'National Tomato Ketchup 500g', 'BOTTLE', 200, 17, 250, '8964000314001'],
  [17, 'National Ketchup 1kg', 'BOTTLE', 360, 17, 450, '8964000314018'],
  [17, 'Shangrila Ketchup 500g', 'BOTTLE', 225, 17, 280, '8964000314025'],
  [17, 'National Mayonnaise 500g', 'BOTTLE', 240, 17, 300, '8964000314032'],
  [17, 'Shangrila Mayonnaise 500g', 'BOTTLE', 255, 17, 320, '8964000314049'],
  [17, 'Chilli Garlic Sauce 300g', 'BOTTLE', 185, 17, 230, '8964000314056'],
  [17, 'Soy Sauce 300ml', 'BOTTLE', 160, 17, 200, '8964000314063'],
  [17, 'White Vinegar 500ml', 'BOTTLE', 120, 17, 150, '8964000314070'],
  [17, 'Tabasco Sauce 150ml', 'BOTTLE', 400, 17, 500, '8964000314087'],
  [17, 'Chilli Sauce 300g', 'BOTTLE', 145, 17, 180, '8964000314094'],
  [17, 'Tomato Paste 500g', 'BOTTLE', 160, 17, 200, '8964000314100'],
  [17, 'Mixed Fruit Jam 500g', 'BOTTLE', 285, 17, 350, '8964000314117'],
  [17, 'Pure Honey 500g', 'BOTTLE', 730, 0, 900, '8964000314124'],
  [17, 'Mango Pickle 500g', 'BOTTLE', 200, 0, 250, '8964000314131'],
  [17, 'Mixed Pickle 500g', 'BOTTLE', 200, 0, 250, '8964000314148'],
  [17, 'Garlic Paste 300g', 'BOTTLE', 130, 17, 160, '8964000314155'],
  [17, 'Ginger Paste 300g', 'BOTTLE', 130, 17, 160, '8964000314162'],
  [17, 'Schezwan Sauce 300g', 'BOTTLE', 200, 17, 250, '8964000314179'],

  // ── Pasta & Noodles (18) — 16 items ──
  [18, 'Spaghetti 500g', 'PACK', 240, 0, 300, '8964000315008'],
  [18, 'Macaroni 500g', 'PACK', 225, 0, 280, '8964000315015'],
  [18, 'Penne Pasta 500g', 'PACK', 255, 0, 320, '8964000315022'],
  [18, 'Fusilli Pasta 500g', 'PACK', 250, 0, 310, '8964000315039'],
  [18, 'Knorr Instant Noodles 72g', 'PCS', 45, 17, 60, '8964000315046'],
  [18, 'Knorr Chatpata Noodles 72g', 'PCS', 45, 17, 60, '8964000315053'],
  [18, 'Maggi Instant Noodles 72g', 'PCS', 45, 17, 60, '8964000315060'],
  [18, 'Knorr Noodles Pack 5pcs', 'PACK', 210, 17, 260, '8964000315077'],
  [18, 'Pasta Sauce Tomato 400g', 'BOTTLE', 285, 17, 350, '8964000315084'],
  [18, 'Pasta Sauce Italian 400g', 'BOTTLE', 310, 17, 380, '8964000315091'],
  [18, 'Shan Spaghetti Masala 50g', 'PACK', 72, 0, 90, '8964000315107'],
  [18, 'Lasagna Sheets 500g', 'PACK', 320, 0, 400, '8964000315114'],
  [18, 'Instant Chow Mein 70g', 'PCS', 45, 17, 60, '8964000315121'],
  [18, 'Vermicelli 500g', 'PACK', 160, 0, 200, '8964000315138'],
  [18, 'Chinese Egg Noodles 500g', 'PACK', 280, 0, 350, '8964000315145'],
  [18, 'Alfredo Pasta Sauce 400g', 'BOTTLE', 320, 17, 400, '8964000315152'],

  // ── Juices & Drinks (19) — 18 items ──
  [19, 'Nestle Orange Juice 1L', 'BOTTLE', 285, 17, 350, '8964000316005'],
  [19, 'Slice Mango Juice 1L', 'BOTTLE', 240, 17, 300, '8964000316012'],
  [19, 'Minute Maid Orange 1L', 'BOTTLE', 255, 17, 320, '8964000316029'],
  [19, 'Shezan Mango Juice 1L', 'BOTTLE', 240, 17, 300, '8964000316036'],
  [19, 'Tropicana Orange 1L', 'BOTTLE', 325, 17, 400, '8964000316043'],
  [19, 'Apple Juice 200ml', 'BOTTLE', 60, 17, 80, '8964000316050'],
  [19, 'Mango Shake 250ml', 'BOTTLE', 68, 17, 90, '8964000316067'],
  [19, 'Nestle Milo 180ml', 'BOTTLE', 60, 17, 80, '8964000316074'],
  [19, 'Rooh Afza Syrup 800ml', 'BOTTLE', 325, 17, 400, '8964000316081'],
  [19, 'Tang Orange 500g', 'PACK', 365, 17, 450, '8964000316098'],
  [19, 'Tang Mango 500g', 'PACK', 365, 17, 450, '8964000316104'],
  [19, 'Jam-e-Shirin 800ml', 'BOTTLE', 285, 17, 350, '8964000316111'],
  [19, 'Ribena Blackcurrant 500ml', 'BOTTLE', 400, 17, 500, '8964000316128'],
  [19, 'Mango Nectar 1L', 'BOTTLE', 240, 17, 300, '8964000316135'],
  [19, 'Peach Juice 1L', 'BOTTLE', 260, 17, 320, '8964000316142'],
  [19, 'Pineapple Juice 1L', 'BOTTLE', 260, 17, 320, '8964000316159'],
  [19, 'Guava Juice 1L', 'BOTTLE', 240, 17, 300, '8964000316166'],
  [19, 'Coconut Water 500ml', 'BOTTLE', 160, 17, 200, '8964000316173'],

  // ── Eggs & Breakfast (20) — 14 items ──
  [20, 'Eggs Farm Fresh 30pc Tray', 'PACK', 780, 0, 960, '8964000317002'],
  [20, 'Corn Flakes 250g', 'PACK', 325, 17, 400, '8964000317019'],
  [20, 'Oats Porridge 500g', 'PACK', 285, 0, 350, '8964000317026'],
  [20, 'Chocos 250g', 'PACK', 240, 17, 300, '8964000317033'],
  [20, 'Muesli 500g', 'PACK', 530, 17, 650, '8964000317040'],
  [20, 'Pancake Mix 500g', 'PACK', 285, 0, 350, '8964000317057'],
  [20, 'Mixed Fruit Jam 250g', 'BOTTLE', 160, 17, 200, '8964000317064'],
  [20, 'Peanut Butter 350g', 'BOTTLE', 480, 17, 600, '8964000317071'],
  [20, 'Nutella 350g', 'BOTTLE', 980, 17, 1200, '8964000317088'],
  [20, 'Baking Powder 100g', 'PACK', 80, 0, 100, '8964000317095'],
  [20, 'Vanilla Essence 28ml', 'BOTTLE', 45, 17, 60, '8964000317101'],
  [20, 'Cocoa Powder 250g', 'PACK', 325, 17, 400, '8964000317118'],
  [20, 'Chocolate Chips 200g', 'PACK', 285, 17, 350, '8964000317125'],
  [20, 'Instant Yeast 11g', 'PCS', 38, 0, 50, '8964000317132'],

  // ── Dry Fruits & Nuts (21) — 20 items ──
  [21, 'Almonds 250g', 'PACK', 520, 0, 650, '8964000318009'],
  [21, 'Almonds 500g', 'PACK', 1000, 0, 1250, '8964000318016'],
  [21, 'Cashew Nuts 250g', 'PACK', 560, 0, 700, '8964000318023'],
  [21, 'Cashew Nuts 500g', 'PACK', 1080, 0, 1350, '8964000318030'],
  [21, 'Pistachio 250g', 'PACK', 640, 0, 800, '8964000318047'],
  [21, 'Walnuts Akhrot 250g', 'PACK', 440, 0, 550, '8964000318054'],
  [21, 'Raisins Kishmish 250g', 'PACK', 240, 0, 300, '8964000318061'],
  [21, 'Dried Dates 500g', 'PACK', 320, 0, 400, '8964000318078'],
  [21, 'Dried Apricot 250g', 'PACK', 400, 0, 500, '8964000318085'],
  [21, 'Mixed Dry Fruits 500g', 'PACK', 960, 0, 1200, '8964000318092'],
  [21, 'Pine Nuts Chilgoza 100g', 'PACK', 400, 0, 500, '8964000318108'],
  [21, 'Chia Seeds 250g', 'PACK', 320, 0, 400, '8964000318115'],
  [21, 'Flax Seeds 250g', 'PACK', 200, 0, 250, '8964000318122'],
  [21, 'Sunflower Seeds 200g', 'PACK', 160, 0, 200, '8964000318139'],
  [21, 'Pumpkin Seeds 200g', 'PACK', 280, 0, 350, '8964000318146'],
  [21, 'Coconut Desiccated 200g', 'PACK', 200, 0, 250, '8964000318153'],
  [21, 'Figs Dry 250g', 'PACK', 440, 0, 550, '8964000318160'],
  [21, 'Peanuts Raw 500g', 'PACK', 280, 0, 350, '8964000318177'],
  [21, 'Sesame Seeds Til 250g', 'PACK', 160, 0, 200, '8964000318184'],
  [21, 'Cranberries Dried 200g', 'PACK', 480, 0, 600, '8964000318191'],

  // ── Cleaning Supplies (22) — 18 items ──
  [22, 'Harpic Toilet Cleaner 500ml', 'BOTTLE', 240, 17, 300, '8964000319006'],
  [22, 'Dettol Surface Cleaner 500ml', 'BOTTLE', 320, 17, 400, '8964000319013'],
  [22, 'Dettol Antiseptic Liquid 250ml', 'BOTTLE', 400, 17, 500, '8964000319020'],
  [22, 'Phenyl Floor Cleaner 1L', 'BOTTLE', 200, 17, 250, '8964000319037'],
  [22, 'Glass Cleaner Spray 500ml', 'BOTTLE', 240, 17, 300, '8964000319044'],
  [22, 'Bleach Liquid 1L', 'BOTTLE', 160, 17, 200, '8964000319051'],
  [22, 'Scrub Pad Pack 3pcs', 'PACK', 72, 17, 90, '8964000319068'],
  [22, 'Dish Sponge 3pcs', 'PACK', 96, 17, 120, '8964000319075'],
  [22, 'Mop Cloth', 'PCS', 160, 17, 200, '8964000319082'],
  [22, 'Dust Pan Set', 'SET', 240, 17, 300, '8964000319099'],
  [22, 'Broom Soft', 'PCS', 280, 17, 350, '8964000319105'],
  [22, 'Mosquito Repellent Spray 400ml', 'BOTTLE', 400, 17, 500, '8964000319112'],
  [22, 'Air Freshener Spray 300ml', 'BOTTLE', 360, 17, 450, '8964000319129'],
  [22, 'Tissue Paper Box 200pcs', 'PACK', 240, 17, 300, '8964000319136'],
  [22, 'Garbage Bags 20pcs', 'PACK', 200, 17, 250, '8964000319143'],
  [22, 'Hand Sanitizer 500ml', 'BOTTLE', 280, 17, 350, '8964000319150'],
  [22, 'Cotton Buds 200pcs', 'PACK', 80, 17, 100, '8964000319167'],
  [22, 'Cleaning Bucket Large', 'PCS', 320, 17, 400, '8964000319174'],

  // ── Baby Care (23) — 14 items ──
  [23, 'Pampers Diapers Medium 72pcs', 'PACK', 1600, 17, 2000, '8964000320002'],
  [23, 'Pampers Diapers Large 60pcs', 'PACK', 1520, 17, 1900, '8964000320019'],
  [23, 'Baby Wipes 100pcs', 'PACK', 320, 17, 400, '8964000320026'],
  [23, 'Johnson Baby Powder 200g', 'PCS', 240, 17, 300, '8964000320033'],
  [23, 'Johnson Baby Oil 200ml', 'BOTTLE', 280, 17, 350, '8964000320040'],
  [23, 'Johnson Baby Lotion 200ml', 'BOTTLE', 280, 17, 350, '8964000320057'],
  [23, 'Baby Soap Johnson 100g', 'PCS', 80, 17, 100, '8964000320064'],
  [23, 'Baby Feeding Bottle', 'PCS', 440, 17, 550, '8964000320071'],
  [23, 'Cerelac Wheat 400g', 'PACK', 560, 0, 700, '8964000320088'],
  [23, 'Lactogen 1 400g', 'PACK', 880, 0, 1100, '8964000320095'],
  [23, 'Baby Diaper Rash Cream 50g', 'PCS', 320, 17, 400, '8964000320101'],
  [23, 'Nestle Nido 400g', 'PACK', 640, 0, 800, '8964000320118'],
  [23, 'Baby Pacifier 2pcs', 'PACK', 160, 17, 200, '8964000320125'],
  [23, 'Baby Teething Toy', 'PCS', 240, 17, 300, '8964000320132'],

  // ── Health & Wellness (24) — 12 items ──
  [24, 'Panadol Tablets 10pcs', 'STRIP', 45, 0, 60, '8964000321009'],
  [24, 'Panadol Extra 10pcs', 'STRIP', 60, 0, 80, '8964000321016'],
  [24, 'Disprin Tablets 10pcs', 'STRIP', 45, 0, 60, '8964000321023'],
  [24, 'Brufen 400mg 10pcs', 'STRIP', 68, 0, 85, '8964000321030'],
  [24, 'ORS Pack', 'PCS', 28, 0, 35, '8964000321047'],
  [24, 'Band Aid Strip 10pcs', 'PACK', 40, 0, 50, '8964000321054'],
  [24, 'Cotton Roll 100g', 'PCS', 120, 0, 150, '8964000321061'],
  [24, 'Cough Syrup 120ml', 'BOTTLE', 160, 0, 200, '8964000321078'],
  [24, 'Multivitamin Tablets 30pcs', 'BOTTLE', 320, 0, 400, '8964000321085'],
  [24, 'Vitamin C Tablets 30pcs', 'BOTTLE', 200, 0, 250, '8964000321092'],
  [24, 'Calcium Tablets 30pcs', 'BOTTLE', 280, 0, 350, '8964000321108'],
  [24, 'Antiseptic Cream 30g', 'PCS', 96, 0, 120, '8964000321115'],
];

// ─── Main seed function ───────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Seed Counters ──────────────────────────────────────────────────────────
  await prisma.counter.upsert({
    where: { name: 'invoice' },
    create: { name: 'invoice', value: 0 },
    update: {},
  });
  await prisma.counter.upsert({
    where: { name: 'po' },
    create: { name: 'po', value: 0 },
    update: {},
  });
  console.log('✓ Counters seeded');

  // ── Seed AppSettings for grocery shop ──────────────────────────────────────
  await prisma.appSettings.upsert({
    where: { id: 'settings' },
    create: {
      id: 'settings',
      shopName: 'Mart Grocery Store',
      shopType: 'GROCERY',
      address: 'Main Market, Lahore',
      phone: '0300-8765432',
      email: 'info@martgrocery.pk',
      receiptHeader: 'Quality Products, Best Prices',
      receiptFooter: 'Thank you for shopping with us!',
      currencySymbol: 'Rs.',
      taxLabel: 'GST',
      defaultTaxPercent: 17,
      enableExpiryTracking: true,
      enablePrescriptionField: false,
      enableServiceItems: false,
    },
    update: {},
  });
  console.log('✓ AppSettings seeded (shop type: GROCERY)');

  // ── Seed admin user ────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { fullName: 'Administrator', username: 'admin', passwordHash, role: 'ADMIN' },
    });
    console.log('✓ Default admin created (admin / admin123)');
  } else {
    console.log('• Admin user already exists — skipping');
  }

  // ── Seed vendor ────────────────────────────────────────────────────────────
  const existingVendor = await prisma.vendor.findFirst({ where: { name: vendor.name } });
  let vendorId;
  if (!existingVendor) {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const v = await prisma.vendor.create({
      data: { ...vendor, createdById: admin.id },
    });
    vendorId = v.id;
    console.log('✓ Vendor seeded: Al-Fatah Wholesale');
  } else {
    vendorId = existingVendor.id;
    console.log('• Vendor already exists — skipping');
  }

  // ── Seed categories ────────────────────────────────────────────────────────
  const categoryIds = [];
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      categoryIds.push(existing.id);
    } else {
      const created = await prisma.category.create({ data: { name: cat.name } });
      categoryIds.push(created.id);
    }
  }
  console.log(`✓ Categories seeded (${categories.length} total)`);

  // ── Seed products ──────────────────────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  let created = 0;
  let skipped = 0;

  for (const [catIdx, name, unit, purchasePrice, purchaseTaxPercent, salePrice, barcode] of productsData) {
    const sku = name
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .toUpperCase()
      .substring(0, 40);

    const existing = await prisma.product.findFirst({ where: { sku } });
    if (existing) {
      skipped++;
      continue;
    }

    const costPrice = Math.round(purchasePrice * (1 + purchaseTaxPercent / 100) * 100) / 100;
    const categoryId = categoryIds[catIdx];

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode: barcode || null,
        unit,
        purchasePrice,
        purchaseTaxPercent,
        costPrice,
        salePrice,
        isActive: true,
        categoryId,
        vendorId: catIdx <= 2 ? vendorId : null, // biscuits, drinks, chocolates linked to vendor
        createdById: admin.id,
      },
    });

    // Create inventory record for non-service items
    if (unit !== 'SERVICE') {
      const inventory = await createInventoryRecord(prisma, product.id, 10);
      const qty = Math.floor(Math.random() * 100) + 20;

      // Set opening stock via inventory update + stock movement
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantityOnHand: qty },
      });

      await prisma.stockMovement.create({
        data: {
          movementType: 'OPENING_STOCK',
          quantity: qty,
          quantityBefore: 0,
          quantityAfter: qty,
          productId: product.id,
          performedById: admin.id,
        },
      });
    }

    created++;
  }

  console.log(`✓ Products seeded: ${created} created, ${skipped} skipped (${created + skipped} total)`);

  // ── Seed a cashier user for shift testing ──────────────────────────────────
  const existingCashier = await prisma.user.findUnique({ where: { username: 'cashier' } });
  if (!existingCashier) {
    const passwordHash = await bcrypt.hash('cashier123', 10);
    await prisma.user.create({
      data: {
        fullName: 'Ali Hassan',
        username: 'cashier',
        passwordHash,
        role: 'CASHIER',
        createdById: admin.id,
      },
    });
    console.log('✓ Cashier user created (cashier / cashier123)');
  } else {
    console.log('• Cashier user already exists — skipping');
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

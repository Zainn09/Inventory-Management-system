const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jewellerypos.com' },
        update: {},
        create: {
            email: 'admin@jewellerypos.com',
            passwordHash: adminHash,
            fullName: 'Admin User',
            role: 'admin'
        }
    });
    console.log('  ✅ Admin user created:', admin.email);

    // Create cashier user
    const cashierHash = await bcrypt.hash('cashier123', 12);
    const cashier = await prisma.user.upsert({
        where: { email: 'cashier@jewellerypos.com' },
        update: {},
        create: {
            email: 'cashier@jewellerypos.com',
            passwordHash: cashierHash,
            fullName: 'Sarah Cashier',
            role: 'cashier'
        }
    });
    console.log('  ✅ Cashier user created:', cashier.email);

    // Create manager user
    const managerHash = await bcrypt.hash('manager123', 12);
    const manager = await prisma.user.upsert({
        where: { email: 'manager@jewellerypos.com' },
        update: {},
        create: {
            email: 'manager@jewellerypos.com',
            passwordHash: managerHash,
            fullName: 'John Manager',
            role: 'manager'
        }
    });
    console.log('  ✅ Manager user created:', manager.email);

    // Create categories
    const categories = [
        { name: 'Rings', slug: 'rings', description: 'All types of rings', sortOrder: 1 },
        { name: 'Necklaces', slug: 'necklaces', description: 'Necklaces and chains', sortOrder: 2 },
        { name: 'Bracelets', slug: 'bracelets', description: 'Bracelets and bangles', sortOrder: 3 },
        { name: 'Earrings', slug: 'earrings', description: 'Earrings and studs', sortOrder: 4 },
        { name: 'Pendants', slug: 'pendants', description: 'Pendants and charms', sortOrder: 5 },
        { name: 'Anklets', slug: 'anklets', description: 'Anklets and toe rings', sortOrder: 6 },
        { name: 'Sets', slug: 'sets', description: 'Jewellery sets', sortOrder: 7 },
        { name: 'Other', slug: 'other', description: 'Other items', sortOrder: 8 }
    ];

    const createdCategories = {};
    for (const cat of categories) {
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat
        });
        createdCategories[cat.slug] = created;
    }
    console.log('  ✅ Categories created:', Object.keys(createdCategories).length);

    // Create sample products with barcodes
    const products = [
        { name: 'Gold Solitaire Ring', category: 'rings', metalType: 'gold', purity: 91.6, weight: 4.5, making: 3500, cost: 22000, sell: 28500, qty: 12 },
        { name: 'Diamond Studded Ring', category: 'rings', metalType: 'diamond', purity: 75.0, weight: 3.8, making: 8000, cost: 45000, sell: 62000, qty: 5 },
        { name: 'Silver Band Ring', category: 'rings', metalType: 'silver', purity: 92.5, weight: 6.0, making: 800, cost: 1200, sell: 2800, qty: 25 },
        { name: 'Gold Chain Necklace 22K', category: 'necklaces', metalType: 'gold', purity: 91.6, weight: 15.0, making: 5000, cost: 72000, sell: 89000, qty: 8 },
        { name: 'Pearl Necklace', category: 'necklaces', metalType: 'other', purity: 0, weight: 25.0, making: 2000, cost: 8000, sell: 15000, qty: 10 },
        { name: 'Diamond Tennis Bracelet', category: 'bracelets', metalType: 'diamond', purity: 75.0, weight: 12.0, making: 15000, cost: 120000, sell: 175000, qty: 3 },
        { name: 'Gold Bangle 22K', category: 'bracelets', metalType: 'gold', purity: 91.6, weight: 18.0, making: 4000, cost: 85000, sell: 105000, qty: 15 },
        { name: 'Diamond Stud Earrings', category: 'earrings', metalType: 'diamond', purity: 75.0, weight: 2.0, making: 5000, cost: 35000, sell: 48000, qty: 7 },
        { name: 'Gold Jhumka Earrings', category: 'earrings', metalType: 'gold', purity: 91.6, weight: 8.0, making: 3000, cost: 38000, sell: 48000, qty: 10 },
        { name: 'Heart Pendant Gold', category: 'pendants', metalType: 'gold', purity: 91.6, weight: 3.0, making: 2000, cost: 15000, sell: 22000, qty: 20 },
        { name: 'Platinum Engagement Ring', category: 'rings', metalType: 'platinum', purity: 95.0, weight: 5.5, making: 12000, cost: 55000, sell: 78000, qty: 4 },
        { name: 'Silver Anklet Pair', category: 'anklets', metalType: 'silver', purity: 92.5, weight: 20.0, making: 1500, cost: 3500, sell: 6500, qty: 18 },
        { name: 'Bridal Jewellery Set', category: 'sets', metalType: 'gold', purity: 91.6, weight: 65.0, making: 25000, cost: 310000, sell: 395000, qty: 2 },
        { name: 'Ruby Gold Ring', category: 'rings', metalType: 'gold', purity: 91.6, weight: 5.2, making: 6000, cost: 32000, sell: 45000, qty: 6 },
        { name: 'Emerald Pendant', category: 'pendants', metalType: 'gold', purity: 75.0, weight: 4.0, making: 7000, cost: 28000, sell: 42000, qty: 8 }
    ];

    let barcodeNum = 1;
    for (const p of products) {
        const sku = `${p.category.substring(0, 3).toUpperCase()}-${String(barcodeNum).padStart(4, '0')}`;
        const barcodeValue = `JWL-${String(barcodeNum).padStart(8, '0')}`;

        await prisma.product.upsert({
            where: { sku },
            update: {},
            create: {
                sku,
                name: p.name,
                categoryId: createdCategories[p.category].id,
                metalType: p.metalType,
                purity: p.purity,
                weightGrams: p.weight,
                makingCharges: p.making,
                costPrice: p.cost,
                sellingPrice: p.sell,
                quantity: p.qty,
                lowStockThreshold: 5,
                barcode: {
                    create: {
                        barcodeValue,
                        barcodeType: 'CODE128',
                        barcodeImageUrl: null // Will be generated by the app
                    }
                }
            }
        });
        barcodeNum++;
    }
    console.log('  ✅ Products created:', products.length);

    // Create sample customers
    const customers = [
        { fullName: 'Aisha Khan', phone: '+923001234567', email: 'aisha@example.com', address: '123 Main St, Lahore' },
        { fullName: 'Fatima Ali', phone: '+923007654321', email: 'fatima@example.com', address: '456 Garden Town, Karachi' },
        { fullName: 'Zainab Ahmed', phone: '+923001112233', email: 'zainab@example.com', address: '789 Model Town, Islamabad' },
        { fullName: 'Usman Sheikh', phone: '+923004455667', email: 'usman@example.com', address: '321 DHA Phase 5, Lahore' },
        { fullName: 'Maria Bukhari', phone: '+923009988776', email: 'maria@example.com', address: '654 Gulberg, Lahore' }
    ];

    for (const c of customers) {
        await prisma.customer.upsert({
            where: { phone: c.phone },
            update: {},
            create: c
        });
    }
    console.log('  ✅ Customers created:', customers.length);

    // Create sample gold rates
    const goldRates = [
        { metalType: 'gold_24k', ratePerGram: 21500, source: 'Manual' },
        { metalType: 'gold_22k', ratePerGram: 19700, source: 'Manual' },
        { metalType: 'gold_18k', ratePerGram: 16125, source: 'Manual' },
        { metalType: 'silver', ratePerGram: 250, source: 'Manual' },
        { metalType: 'platinum', ratePerGram: 32000, source: 'Manual' }
    ];

    for (const rate of goldRates) {
        await prisma.goldRate.create({ data: rate });
    }
    console.log('  ✅ Gold rates created:', goldRates.length);

    // Create default settings
    const settings = [
        { key: 'store_name', value: '"Jewellery Palace"', group: 'general' },
        { key: 'store_address', value: '"123 Gold Market, Lahore, Pakistan"', group: 'general' },
        { key: 'store_phone', value: '"+92-300-1234567"', group: 'general' },
        { key: 'store_gst', value: '"12345678"', group: 'general' },
        { key: 'tax_rate', value: '3', group: 'tax' },
        { key: 'currency', value: '"PKR"', group: 'billing' },
        { key: 'currency_symbol', value: '"₨"', group: 'billing' },
        { key: 'barcode_prefix', value: '"JWL"', group: 'barcode' },
        { key: 'barcode_type', value: '"CODE128"', group: 'barcode' },
        { key: 'loyalty_points_per_100', value: '1', group: 'billing' }
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s
        });
    }
    console.log('  ✅ Settings created:', settings.length);

    console.log('\n🎉 Seed complete!\n');
    console.log('  Login credentials:');
    console.log('  ──────────────────────────────');
    console.log('  Admin:   admin@jewellerypos.com / admin123');
    console.log('  Manager: manager@jewellerypos.com / manager123');
    console.log('  Cashier: cashier@jewellerypos.com / cashier123');
    console.log('  ──────────────────────────────\n');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

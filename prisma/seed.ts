import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { menuItems } from '../src/data/menu';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 828 Grill database with new menu data...');

  // Create / update demo user
  const hashed = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@828grill.com' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'demo@828grill.com',
      password: hashed,
      phone: '+1 (555) 282-8282',
      address: '742 Evergreen Terrace, Springfield, IL 62704',
    },
  });
  console.log(`Demo user: ${demoUser.email} (pw: password123)`);

  // Mark old items not in the new menu as unavailable (keeps order history intact)
  const oldItems = await prisma.menuItem.findMany();
  const newIds = new Set(menuItems.map((m) => m.id));
  for (const old of oldItems) {
    if (!newIds.has(old.id)) {
      // Try to delete; if referenced by orders, mark unavailable instead
      try {
        await prisma.menuItem.delete({ where: { id: old.id } });
      } catch {
        await prisma.menuItem.update({
          where: { id: old.id },
          data: { available: false },
        });
      }
    }
  }
  console.log(`Cleared/retired old menu items.`);

  // Upsert new menu items
  for (const item of menuItems) {
    const data = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      featured: item.popular ?? false,
      available: item.available,
    };
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: data,
      create: data,
    });
    console.log(`  ${item.popular ? '★ ' : '  '}${item.name} — $${item.price}`);
  }

  const count = await prisma.menuItem.count();
  console.log(`\nSeeding complete. ${count} menu items in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

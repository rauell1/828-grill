export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Burgers' | 'Sides' | 'Drinks' | 'Combos';
  imageUrl: string;
  available: boolean;
  popular?: boolean;
}

export const menuItems: MenuItem[] = [
  { id: 'burger-1', name: 'Classic Smash Burger', description: 'Double smash patties, American cheese, pickles, grilled onions, 828 secret sauce on a toasted brioche bun.', price: 12.99, category: 'Burgers', imageUrl: '/menu/burger-classic.jpg', available: true, popular: true },
  { id: 'burger-2', name: 'Smoked Brisket Burger', description: '12-hour smoked brisket patty, pepper jack cheese, crispy bacon, smoked gremolata, charcoal bun.', price: 15.99, category: 'Burgers', imageUrl: '/menu/burger-brisket.jpg', available: true, popular: true },
  { id: 'burger-3', name: 'Truffle Mushroom Burger', description: 'Wagyu blend patty, sautéed wild mushrooms, truffle aioli, aged gruyère, arugula.', price: 17.99, category: 'Burgers', imageUrl: '/menu/burger-truffle.jpg', available: true },
  { id: 'burger-4', name: 'Spicy Jalapeño Inferno', description: 'Ghost pepper patty, habanero cheese, pickled jalapeños, chipotle mayo, fire-grilled bun.', price: 14.99, category: 'Burgers', imageUrl: '/menu/burger-inferno.jpg', available: true },
  { id: 'burger-5', name: 'BBQ Bacon Deluxe', description: 'Smoked beef patty, thick-cut bacon, cheddar, crispy onion strings, Texas-style BBQ sauce.', price: 14.49, category: 'Burgers', imageUrl: '/menu/burger-bbq-bacon.jpg', available: true, popular: true },
  { id: 'side-1', name: 'Crispy Smoke Fries', description: 'Hand-cut fries tossed in smoked paprika and sea salt. Crispy outside, fluffy inside.', price: 5.99, category: 'Sides', imageUrl: '/menu/side-smoke-fries.jpg', available: true, popular: true },
  { id: 'side-2', name: 'Loaded Cheese Fries', description: 'Golden fries topped with melted cheddar, bacon bits, jalapeños, and sour cream drizzle.', price: 8.99, category: 'Sides', imageUrl: '/menu/side-loaded-fries.jpg', available: true },
  { id: 'side-3', name: 'Grilled Corn Elote', description: 'Char-grilled corn on the cob with cotija cheese, chili powder, lime, and crema.', price: 6.49, category: 'Sides', imageUrl: '/menu/side-elote.jpg', available: true },
  { id: 'drink-1', name: 'Vanilla Ember Shake', description: 'Thick vanilla bean milkshake with a hint of smoked cinnamon, topped with whipped cream.', price: 7.99, category: 'Drinks', imageUrl: '/menu/drink-vanilla-shake.jpg', available: true, popular: true },
  { id: 'drink-2', name: 'Bourbon Cherry Shake', description: 'Rich cherry shake with a splash of bourbon, cherry garnish, dark chocolate drizzle.', price: 9.49, category: 'Drinks', imageUrl: '/menu/drink-bourbon-shake.jpg', available: true },
  { id: 'drink-3', name: 'Craft Root Beer', description: 'House-brewed root beer served over hand-cut ice. Classic, refreshing, and bold.', price: 4.49, category: 'Drinks', imageUrl: '/menu/drink-root-beer.jpg', available: true },
  { id: 'drink-4', name: 'Smoked Lemonade', description: 'Fresh-squeezed lemonade with applewood smoke infusion, honey, and mint.', price: 5.99, category: 'Drinks', imageUrl: '/menu/drink-smoked-lemonade.jpg', available: true },
  { id: 'combo-1', name: 'Mega Grill Combo', description: 'Classic Smash Burger + Smoke Fries + Vanilla Ember Shake. The ultimate 828 experience.', price: 22.99, category: 'Combos', imageUrl: '/menu/combo-mega.jpg', available: true, popular: true },
  { id: 'combo-2', name: 'Brisket Feast', description: 'Smoked Brisket Burger + Loaded Cheese Fries + Bourbon Cherry Shake.', price: 29.99, category: 'Combos', imageUrl: '/menu/combo-brisket-feast.jpg', available: true },
  { id: 'combo-3', name: 'Family Fire Pack', description: '4 Classic Smash Burgers + 2 Large Smoke Fries + 4 Craft Root Beers. Feed the whole crew.', price: 59.99, category: 'Combos', imageUrl: '/menu/combo-family-pack.jpg', available: true },
  { id: 'combo-4', name: 'Date Night Duo', description: '2 Truffle Mushroom Burgers + Grilled Corn Elote + 2 Smoked Lemonades.', price: 44.99, category: 'Combos', imageUrl: '/menu/combo-date-night.jpg', available: true },
];

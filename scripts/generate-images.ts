import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/menu';

interface ImgJob {
  file: string;
  prompt: string;
  size: string;
}

const jobs: ImgJob[] = [
  {
    file: 'hero.jpg',
    prompt:
      'Dark moody cinematic food photography of a charcoal grill with bright orange flames and glowing embers, juicy smash burgers and steak cooking on grates, smoke rising, dramatic ember-orange lighting, black background, professional restaurant photography, ultra detailed, high contrast',
    size: '1344x768',
  },
  {
    file: 'about.jpg',
    prompt:
      'Professional photography of a grill master chef tending a charcoal grill with flames and embers at night, dark moody atmosphere, orange ember glow on face, smoke, cinematic, high detail',
    size: '1152x864',
  },
  // Burgers
  {
    file: 'burger-signature.jpg',
    prompt:
      'Professional food photography, top-down 45 degree angle, gourmet double smash burger with melted cheddar, crispy bacon, caramelized onions, toasted brioche bun, on a black slate plate, dark moody background, dramatic side lighting, steam rising, ultra detailed, appetizing',
    size: '1024x1024',
  },
  {
    file: 'burger-bbq.jpg',
    prompt:
      'Professional food photography of a BBQ smokehouse burger with pulled pork, crispy onion rings, smoky bbq sauce, toasted bun, on dark slate, dark background, dramatic lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
  {
    file: 'burger-inferno.jpg',
    prompt:
      'Professional food photography of a spicy inferno burger with jalapeños, melted pepper jack cheese, hot sauce drizzle, red chili flakes, toasted bun, dark moody background, dramatic lighting, appetizing',
    size: '1024x1024',
  },
  {
    file: 'burger-classic.jpg',
    prompt:
      'Professional food photography of a classic cheeseburger with melted American cheese, crisp lettuce, tomato, onion, sesame bun, on dark slate, dark background, studio lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
  {
    file: 'burger-chicken.jpg',
    prompt:
      'Professional food photography of a grilled chicken burger with char marks, avocado, lettuce, tomato, whole wheat bun, on dark slate, dark background, dramatic lighting, appetizing',
    size: '1024x1024',
  },
  // Sides
  {
    file: 'side-loaded-fries.jpg',
    prompt:
      'Professional food photography of loaded fries with melted cheese, crispy bacon bits, scallions, in a black bowl, dark moody background, dramatic lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
  {
    file: 'side-wings.jpg',
    prompt:
      'Professional food photography of smoked chicken wings with dry rub seasoning, golden brown, in a black bowl, dark moody background, dramatic lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
  {
    file: 'side-corn.jpg',
    prompt:
      'Professional food photography of grilled corn on the cob with char marks, butter, lime wedge, chili powder, on dark slate, dark background, dramatic lighting, appetizing',
    size: '1024x1024',
  },
  {
    file: 'side-onion-rings.jpg',
    prompt:
      'Professional food photography of golden crispy beer-battered onion rings stacked, on dark slate, dark background, studio lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
  {
    file: 'side-mac-bites.jpg',
    prompt:
      'Professional food photography of golden crispy mac and cheese bites, melted cheese pull, on dark slate, dark moody background, dramatic lighting, appetizing',
    size: '1024x1024',
  },
  // Drinks
  {
    file: 'drink-ember-lemonade.jpg',
    prompt:
      'Professional beverage photography of charred grilled lemonade in a glass with ice, mint leaves, smoky charred lemon garnish, dark background, dramatic lighting, condensation, appetizing',
    size: '1024x1024',
  },
  {
    file: 'drink-cola-float.jpg',
    prompt:
      'Professional beverage photography of a cola float with vanilla ice cream scoop in a glass, fizz, dark background, dramatic lighting, condensation, appetizing',
    size: '1024x1024',
  },
  {
    file: 'drink-iced-tea.jpg',
    prompt:
      'Professional beverage photography of fresh iced tea in a tall glass with ice cubes, lemon slice, mint, dark background, dramatic lighting, condensation, appetizing',
    size: '1024x1024',
  },
  // Combos
  {
    file: 'combo-pitmaster.jpg',
    prompt:
      'Professional food photography of a combo meal tray with signature burger, loaded fries, and a drink, dark slate, dark moody background, dramatic lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
  {
    file: 'combo-family.jpg',
    prompt:
      'Professional food photography of a family feast spread with multiple burgers, sides of fries and wings, and drinks on a dark table, top down, dramatic lighting, appetizing',
    size: '1024x1024',
  },
  {
    file: 'combo-solo.jpg',
    prompt:
      'Professional food photography of a solo combo meal with a cheeseburger, fries, and a drink, on dark slate, dark background, dramatic lighting, appetizing, ultra detailed',
    size: '1024x1024',
  },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();
  const results: { file: string; ok: boolean; error?: string }[] = [];

  for (const job of jobs) {
    const outPath = path.join(OUT_DIR, job.file);
    // Skip if already exists
    if (fs.existsSync(outPath)) {
      console.log(`[skip] ${job.file} already exists`);
      results.push({ file: job.file, ok: true });
      continue;
    }
    try {
      console.log(`[gen] ${job.file} ...`);
      const res = await zai.images.generations.create({
        prompt: job.prompt,
        size: job.size as any,
      });
      const b64 = res.data[0].base64;
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(outPath, buf);
      console.log(`[ok]  ${job.file} (${buf.length} bytes)`);
      results.push({ file: job.file, ok: true });
    } catch (e: any) {
      console.error(`[err] ${job.file}: ${e?.message || e}`);
      results.push({ file: job.file, ok: false, error: e?.message });
    }
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\nDONE: ${ok}/${results.length} images generated.`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.file).join(', '));
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

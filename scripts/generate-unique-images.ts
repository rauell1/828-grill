import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/menu';

interface ImgJob {
  file: string;
  prompt: string;
}

const STYLE =
  'dark moody professional food photography, dramatic side lighting, black slate background, steam rising, appetizing, ultra detailed, high contrast, restaurant quality';

const jobs: ImgJob[] = [
  {
    file: 'burger-brisket.jpg',
    prompt: `Smoked brisket burger — thick smoked beef patty with visible smoke ring, melted pepper jack cheese, crispy bacon strips, green herb gremolata, dark charcoal bun. ${STYLE}`,
  },
  {
    file: 'burger-truffle.jpg',
    prompt: `Truffle mushroom burger — wagyu patty topped with sautéed wild mushrooms, truffle aioli drizzle, aged gruyère cheese, fresh arugula, glossy bun. ${STYLE}`,
  },
  {
    file: 'burger-inferno.jpg',
    prompt: `Spicy jalapeño inferno burger — beef patty with pickled jalapeños slices, melted habanero orange cheese, chipotle mayo drizzle, red chili flakes, fire-grilled dark bun. ${STYLE}`,
  },
  {
    file: 'burger-bbq-bacon.jpg',
    prompt: `BBQ bacon deluxe burger — beef patty with thick-cut crispy bacon, melted cheddar, golden crispy onion strings, glossy dark BBQ sauce drizzle, sesame bun. ${STYLE}`,
  },
  {
    file: 'side-smoke-fries.jpg',
    prompt: `Crispy smoke fries — hand-cut golden french fries with smoked paprika dusting and flaky sea salt, served in a black bowl, smoky atmosphere. ${STYLE}`,
  },
  {
    file: 'side-loaded-fries.jpg',
    prompt: `Loaded cheese fries — golden fries topped with melted yellow cheddar cheese sauce, crispy bacon bits, sliced jalapeños, sour cream drizzle, in a black bowl. ${STYLE}`,
  },
  {
    file: 'side-elote.jpg',
    prompt: `Grilled corn elote — char-grilled corn on the cob with visible char marks, crumbled white cotija cheese, chili powder, lime wedge, on a dark plate. ${STYLE}`,
  },
  {
    file: 'drink-vanilla-shake.jpg',
    prompt: `Vanilla ember shake — tall glass of thick creamy vanilla milkshake with whipped cream, dusted with cinnamon, smoky garnish, condensation on glass, dark background. ${STYLE}`,
  },
  {
    file: 'drink-bourbon-shake.jpg',
    prompt: `Bourbon cherry shake — dark cherry milkshake in a tall glass with whipped cream, fresh cherries on top, dark chocolate drizzle, condensation, dark moody background. ${STYLE}`,
  },
  {
    file: 'drink-root-beer.jpg',
    prompt: `Craft root beer — frosty glass mug of dark root beer with thick foamy head, ice cubes, condensation droplets, dark background, dramatic lighting. ${STYLE}`,
  },
  {
    file: 'drink-smoked-lemonade.jpg',
    prompt: `Smoked lemonade — tall glass of fresh yellow lemonade with visible smoke wisps rising, ice cubes, lemon slice garnish, mint sprig, honey drizzle, dark background. ${STYLE}`,
  },
  {
    file: 'combo-mega.jpg',
    prompt: `Mega grill combo meal — a classic smash burger, a side of crispy fries, and a vanilla milkshake arranged together on a dark slate tray, dramatic lighting. ${STYLE}`,
  },
  {
    file: 'combo-brisket-feast.jpg',
    prompt: `Brisket feast combo — smoked brisket burger, loaded cheese fries with bacon and jalapeños, and a dark cherry shake arranged on dark slate, moody lighting. ${STYLE}`,
  },
  {
    file: 'combo-family-pack.jpg',
    prompt: `Family fire pack — four classic smash burgers, two large baskets of fries, and four frosty mugs of root beer spread on a dark table, top down view. ${STYLE}`,
  },
  {
    file: 'combo-date-night.jpg',
    prompt: `Date night duo — two truffle mushroom burgers, grilled corn elote on a plate, and two glasses of smoked lemonade, romantic dark moody lighting on dark table. ${STYLE}`,
  },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();
  const results: { file: string; ok: boolean; error?: string }[] = [];

  for (const job of jobs) {
    const outPath = path.join(OUT_DIR, job.file);
    if (fs.existsSync(outPath)) {
      console.log(`[skip] ${job.file} already exists`);
      results.push({ file: job.file, ok: true });
      continue;
    }
    try {
      console.log(`[gen] ${job.file} ...`);
      const res = await zai.images.generations.create({
        prompt: job.prompt,
        size: '1024x1024' as any,
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

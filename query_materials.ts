import { db } from './db/index';
import { materials } from './db/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
  const result = await db.select().from(materials).where(ilike(materials.name, '%Arena - Tajo Romero%'));
  console.log(result);
  process.exit(0);
}
main();

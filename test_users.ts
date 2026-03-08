import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './db/index';
import * as schema from './db/schema';

async function run() {
  try {
    const users = await db.query.users.findMany({
      with: { userRoles: { with: { role: true } } }
    });
    console.log('Users in DB:');
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error fetching users:', e);
  } finally {
    process.exit(0);
  }
}
run();

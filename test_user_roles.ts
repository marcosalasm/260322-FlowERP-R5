import { db } from "./db/index";
import { users, roles, userRoles } from "./db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const allUsers = await db.select().from(users);
    console.log("ALL USERS:", allUsers.map(u => u.email).join(', '));
    
    const userList = await db.query.users.findMany({
        where: eq(users.email, "MSALAS@MS-INGENIERIA.NET"),
        with: {
            userRoles: {
                with: {
                    role: true
                }
            }
        }
    });

    console.log("USER DATA:", JSON.stringify(userList, null, 2));
    process.exit(0);
}

main().catch(console.error);

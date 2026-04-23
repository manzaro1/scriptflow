import { Database } from 'bun:sqlite';

const db = new Database('./scriptflow.db');

// Get all users with their admin status
const users = db.query('SELECT id, email, is_admin FROM users').all();
console.log('Users:', users);

// Get telegram links
const links = db.query('SELECT * FROM telegram_links').all();
console.log('Telegram links:', links);

// Find Charles's account (charleslevison@gmail.com) and set as admin
const charlesUser = db.query("SELECT id FROM users WHERE email LIKE '%charles%' OR email LIKE '%levison%'").get() as any;
console.log('Charles user:', charlesUser);

if (charlesUser) {
  // Set as admin
  db.query('UPDATE users SET is_admin = 1 WHERE id = ?').run(charlesUser.id);
  console.log('✅ Set user as admin:', charlesUser.id);
  
  // Verify
  const updated = db.query('SELECT id, email, is_admin FROM users WHERE id = ?').get(charlesUser.id) as any;
  console.log('Updated user:', updated);
}

db.close();
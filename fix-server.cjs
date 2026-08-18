const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replace(
  `  try {
    console.log('Running database migrations...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('Database migrations completed.');
  } catch (err) {
    console.error('Failed to run database migrations:', err);
  }`,
  `  // Migrations are handled manually or via cloudsql-update-schema
  console.log('Skipping auto-migrations to avoid TTY prompt issues.');`
);
fs.writeFileSync('server.ts', content);

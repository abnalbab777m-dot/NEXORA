import re
content = open("server.ts").read()
import_child = "import { execSync } from 'child_process';\n"
content = import_child + content

startup_logic = """async function startServer() {
  // Auto-migrate database on startup
  try {
    console.log('Running database migrations...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('Database migrations completed.');
  } catch (err) {
    console.error('Failed to run database migrations:', err);
  }

  const app = express();"""

content = content.replace("async function startServer() {\n  const app = express();", startup_logic)
open("server.ts", "w").write(content)

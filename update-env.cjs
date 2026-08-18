const fs = require('fs');
const crypto = require('crypto');

let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
} catch (e) {}

const setEnv = (key, value) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
};

setEnv('JWT_SECRET', crypto.randomBytes(48).toString('hex'));
setEnv('SESSION_SECRET', crypto.randomBytes(48).toString('hex'));

fs.writeFileSync('.env', envContent.trim() + '\n');
const hasDb = envContent.includes('DATABASE_URL=') || envContent.includes('SQL_HOST=');
console.log("DB_CONFIGURED=" + hasDb);
console.log("ENV_UPDATED=true");

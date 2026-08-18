const fs = require('fs');

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

const user = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;
const host = process.env.SQL_HOST; // socket path
const dbName = process.env.SQL_DB_NAME;

const encodedPassword = encodeURIComponent(password);
const encodedHost = encodeURIComponent(host);

const dbUrl = `postgresql://${user}:${encodedPassword}@localhost/${dbName}?host=${encodedHost}`;
setEnv('DATABASE_URL', dbUrl);

fs.writeFileSync('.env', envContent.trim() + '\n');

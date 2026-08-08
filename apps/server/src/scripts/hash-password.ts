import { hashPasswordScrypt } from '../auth/password';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node dist/scripts/hash-password.js <password>');
  process.exit(1);
}

hashPasswordScrypt(password)
  .then((hash) => {
    console.log(hash);
    console.error('Set ADMIN_PASSWORD_HASH to the value above.');
  })
  .catch((error) => {
    console.error('Failed to hash password:', error);
    process.exit(1);
  });

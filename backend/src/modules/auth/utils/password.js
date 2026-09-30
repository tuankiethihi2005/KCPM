const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = (password, passwordHash) =>
  bcrypt.compare(password, passwordHash);

module.exports = {
  comparePassword,
  hashPassword,
};

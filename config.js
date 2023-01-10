"use strict";

/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

// DB_URI definition for arlaine
const DB_URI = process.env.NODE_ENV === "test"
    ? "postgresql:///messagely_test"
    : "postgresql:///messagely";

// DB_URI definition for nico
// const DB_URI = process.env.NODE_ENV === "test"
//   ? "postgresql://nicom:nicom@localhost/messagely_test"
//   : "postgresql://nicom:nicom@localhost/messagely"

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
};

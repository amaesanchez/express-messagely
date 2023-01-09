"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING username, password, first_name, last_name, phone
      `,
      [username, hashedPw, first_name, last_name, phone, Date.now()]
    );

    return results.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    );

    const password = results.rows[0].password;

    return (await bcrypt.compare(hashedPw, password)) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
        SET last_login_at = ${Date.now()}
        WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
        FROM users
      `
    );

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1
      `,
      [username]
    );

    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
        FROM messages
        WHERE from_username = $1
      `,
      [username]
    );
    const messages = messageResults.rows;
    const toUsers = messages.map((message) => message.to_user);

    const userResults = await db.query(
      `SELECT username, first_name, last_name, phone
        FROM users
        WHERE username IN $1
      `,
      [toUsers]
    );
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {}
}

module.exports = User;

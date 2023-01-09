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
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone
      `,
      [username, hashedPw, first_name, last_name, phone]
    );

    return results.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    );

    const testPw = results.rows[0].password;

    // pass in (IN ORDER) raw text password, THEN hashed password
    return (await bcrypt.compare(password, testPw)) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
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
      `SELECT id, to_username AS to_user, body, sent_at, read_at
        FROM messages
        WHERE from_username = $1
      `,
      [username]
    );
    const messages = messageResults.rows;

    for (let msg of messages) {
      let userResults = await db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          WHERE username = $1
        `,
        [msg.to_user]
      );

      msg.to_user = userResults.rows[0];
    }

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = await db.query(
      `SELECT id, from_username AS from_user, body, sent_at, read_at
        FROM messages
        WHERE to_username = $1
      `,
      [username]
    );
    const messages = messageResults.rows;

    for (let msg of messages) {
      let userResults = await db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          WHERE username = $1
        `,
        [msg.from_user]
      );

      msg.from_user = userResults.rows[0];
    }

    return messages;
  }
}

module.exports = User;

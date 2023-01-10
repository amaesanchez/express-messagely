"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // separate columns
    const results = await db.query(
      `INSERT INTO users (
          username,
          password,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username,
            first_name,
            last_name,
            phone
      `,
      [username, hashedPw, first_name, last_name, phone]
    );

    return results.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate({ username, password }) {
    const results = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    );

    const user = results.rows[0];

    // pass in (IN ORDER) raw text password, THEN hashed password
    return user && await bcrypt.compare(password, user.password) === true;
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
          first_name,
          last_name
        FROM users
        ORDER BY username
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
      `SELECT username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
        FROM users
        WHERE username = $1
      `,
      [username]
    );

    if (!results.rows[0]) throw new NotFoundError(`${username} not found.`)

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
      `SELECT m.id,
          m.to_username,
          u.first_name,
          u.last_name,
          u.phone,
          m.body,
          m.sent_at,
          m.read_at
        FROM messages AS m
          JOIN users AS u
            ON u.username = m.to_username
        WHERE from_username = $1
      `,
      [username]
    );

    if (!messageResults.rows[0]) throw new NotFoundError(
      `No messages found to ${username}.`)

    const messages = messageResults.rows.map(m => {
      return {
        id : m.id,
        to_user : {
          username : m.to_username,
          first_name : m.first_name,
          last_name : m.last_name,
          phone : m.phone
        },
        body : m.body,
        sent_at : m.sent_at,
        read_at : m.read_at
      }
    });

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
      `SELECT m.id,
          m.from_username,
          u.first_name,
          u.last_name,
          u.phone,
          m.body,
          m.sent_at,
          m.read_at
        FROM messages AS m
          JOIN users AS u
            ON u.username = m.from_username
        WHERE to_username = $1
      `,
      [username]
    );

    if (!messageResults.rows[0]) throw new NotFoundError(
      `No messages found to ${username}.`)

    const messages = messageResults.rows.map(m => {
      return {
        id : m.id,
        from_user : {
          username : m.from_username,
          first_name : m.first_name,
          last_name : m.last_name,
          phone : m.phone
        },
        body : m.body,
        sent_at : m.sent_at,
        read_at : m.read_at
      }
    });

    return messages;
  }
}

module.exports = User;

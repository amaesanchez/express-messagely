"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const Message = require("../models/message");

describe("Messages routes test", function () {
  let token;
  let u1;
  let msg1;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550001",
    });

    token = jwt.sign({ username: u1.username }, SECRET_KEY);

    let { id } = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "test message from test1 to test2",
    });

    msg1 = id;

    await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "test message from test2 to test1",
    });
  });

  test("GET /messages/:id - get message details -- authorized user", async function () {
    let response = await request(app)
      .get(`/messages/${msg1}`)
      .query({ _token: token });

    expect(response.body).toEqual({
      message: {
        id: expect.any(Number),
        body: "test message from test1 to test2",
        sent_at: expect.any(String),
        read_at: null,
        from_user: {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
        },
        to_user: {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155550001",
        },
      },
    });
  });
});

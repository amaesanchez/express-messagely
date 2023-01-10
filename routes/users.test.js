"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const Message = require("../models/message");

describe("Users routes test", function () {

    let token;
    let u1;

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

        await Message.create({
            from_username: "test1",
            to_username: "test2",
            body: "test message from test1 to test2"
        })
        
        await Message.create({
            from_username: "test2",
            to_username: "test1",
            body: "test message from test2 to test1"
        })
    });

    test("GET /users - get all users", async function () {
        let response = await request(app)
            .get("/users")
            .query({ _token: token });

        expect(response.body).toEqual({
            users: [
                {
                    username: "test1",
                    first_name: "Test1",
                    last_name: "Testy1"
                },
                {
                    username: "test2",
                    first_name: "Test2",
                    last_name: "Testy2"
                }
            ]
        })
    });

    test("GET /users/:username - authorized user", async function () {
        let response = await request(app)
            .get("/users/test1")
            .query({ _token: token });

        expect(response.body).toEqual({
            user: {
                username: "test1",
                first_name: "Test1",
                last_name: "Testy1",
                phone: "+14155550000",
                join_at: expect.any(String),
                last_login_at: expect.any(String)
            }
        })
    });

    test("GET /users/:username - UNauthorized user", async function () {
        let response = await request(app)
            .get("/users/test2")
            .query({ _token: token });

        expect(response.body).toEqual({
            error: {
                message: "Unauthorized",
                status: 401
            }
        })
    })

    test("GET /users/:username/to - authorized user", async function () {
        let response = await request(app)
            .get("/users/test1/to")
            .query({ _token: token });

        expect(response.body).toEqual({
            messages: [
                {
                    id: expect.any(Number),
                    body: "test message from test2 to test1",
                    sent_at: expect.any(String),
                    read_at: null,
                    from_user: {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155550001"
                    }
                }
            ]
        })
    });

    test("GET /users/:username/to - UNauthorized user", async function () {
        let response = await request(app)
            .get("/users/test2/to")
            .query({ _token: token });

        expect(response.body).toEqual({
            error: {
                message: "Unauthorized",
                status: 401
            }
        })
    });

    test("GET /users/:username/from", async function () {
        let response = await request(app)
            .get("/users/test1/from")
            .query({ _token: token });

        expect(response.body).toEqual({
            messages: [
                {
                    id: expect.any(Number),
                    body: "test message from test1 to test2",
                    sent_at: expect.any(String),
                    read_at: null,
                    to_user: {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155550001"
                    }
                }
            ]
        })
    });

    test("GET /users/:username/from - UNauthorized user", async function () {
        let response = await request(app)
            .get("/users/test2/from")
            .query({ _token: token });

        expect(response.body).toEqual({
            error: {
                message: "Unauthorized",
                status: 401
            }
        })
    });
});
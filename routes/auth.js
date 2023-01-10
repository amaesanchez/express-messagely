"use strict";


const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, BadRequestError } = require("../expressError")


/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
  if (!req.body || !req.body?.username || !req.body?.password) {
    throw new BadRequestError("missing information - username/password required.")
  }
  
  if (await User.authenticate(req.body)) {
    const token = jwt.sign({ username: req.body.username }, SECRET_KEY);
    return res.json({ token });
  }

  throw new UnauthorizedError("invalid credentials.");
})


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
  // const { username, password, first_name, last_name, phone } = req.body;
  const user = await User.register(req.body);
  const token = jwt.sign({ username: user.username }, SECRET_KEY);

  return res.json({ token });
});

module.exports = router;

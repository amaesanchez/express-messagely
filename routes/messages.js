"use strict";

const Router = require("express").Router;
const Message = require("../models/message");
const { ensureSenderOrRecipient, ensureLoggedIn, ensureRecipient } =
  require("../middleware/auth")
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  const id = req.params.id;
  const message = await Message.get(id);

  res.locals.message = message;
  ensureSenderOrRecipient(req, res);

  return res.json({ message: message });
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
  const { to_username, body } = req.body
  const message = await Message.create({
    from_username : res.locals.user.username,
    to_username,
    body
  });

  return res.json({ message })
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  const id = req.params.id;

  const message = await Message.get(id);
  res.locals.message = message;
  ensureRecipient(req, res);

  const messageRead = await Message.markRead(id);

  return res.json({ message: messageRead })
})


module.exports = router;

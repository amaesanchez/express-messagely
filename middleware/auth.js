"use strict";

/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    const tokenFromRequest = req.query._token || req.body._token;
    const payload = jwt.verify(tokenFromRequest, SECRET_KEY);
    res.locals.user = payload;
    return next();
  } catch (err) {
    // error in this middleware isn't error -- continue on
    return next();
  }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/** Middleware: Requires user is user for route. */

function ensureCorrectUser(req, res, next) {
  try {
    if (!res.locals.user ||
        res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/** Middleware: Requires user to be equal to
 * from_username/to_username of a message */
function ensureSenderOrRecipient(req, res) {
  if (res.locals.user.username === res.locals.message.from_user.username ||
    res.locals.user.username === res.locals.message.to_user.username) {
    return;
  } else {
    throw new UnauthorizedError();
  }
}

/** Middleware: Requires user to be the recipient of the message */
function ensureRecipient(req, res) {
  if (res.locals.user.username === res.locals.message.to_user.username) {
    return;
  } else {
    throw new UnauthorizedError();
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensureSenderOrRecipient,
  ensureRecipient
};

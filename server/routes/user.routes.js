const exp = require('express');
const userApp = exp.Router();
const User = require('../models/user.model');

const expressAsyncHandler = require("express-async-handler");
const createUser = require("../utils/createUserApi")

//creating user
userApp.post("/create", expressAsyncHandler(createUser));

module.exports = userApp;
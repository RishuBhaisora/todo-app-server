const { UserModel, TodoModel } = require("./db");
const jwt = require("jsonwebtoken");
const { auth, JWT_SECRET } = require("./auth");
const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcrypt");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI);

const app = express();
app.use(express.json());

app.get("/", async function (req, res) {
  res.json("You are connected");
});

app.post("/signup", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.create({
    email: email,
    password: hashedPassword,
    name: name,
  });

  res.json({
    message: "You are signed up",
  });
});

app.post("/signin", async function (req, res) {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(403).json({ message: "User not found" });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(403).json({ message: "Incorrect password" });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET);

  res.json({ token });
});

app.post("/addTodo", auth, async function (req, res) {
  const { title } = req.body;
  const userId = req.userId;

  await TodoModel.create({
    userId: userId,
    title: title,
    done: false,
  });

  res.json({
    message: "Todo added",
  });
});

app.get("/getTodos", auth, async function (req, res) {
  const userId = req.userId;

  const todos = await TodoModel.find({ userId: userId });

  res.json(todos);
});

app.put("/updateTodo", auth, async function (req, res) {
  const { id, done } = req.body;

  await TodoModel.findByIdAndUpdate(id, { done: done });

  res.json({
    message: "Todo updated",
  });
});

app.delete("/deleteTodo", auth, async function (req, res) {
  const { id } = req.body;

  await TodoModel.findByIdAndDelete(id);

  res.json({
    message: "Todo deleted",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

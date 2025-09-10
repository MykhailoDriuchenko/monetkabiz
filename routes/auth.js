const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// Регистрация
router.get("/register", (req, res) => res.render("register"));
router.post("/register", async(req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await User.create({ username, password: hash });
        res.redirect("/login");
    } catch {
        res.send("Имя пользователя занято");
    }
});

// Вход
router.get("/login", (req, res) => res.render("login"));
router.post("/login", async(req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        req.session.role = user.role;
        res.redirect("/");
    } else {
        res.send("Неверные данные");
    }
});

// Выход
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

module.exports = router;
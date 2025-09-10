const express = require("express");
const multer = require("multer");
const path = require("path");
const Ad = require("../models/Ad");
const router = express.Router();

const upload = multer({ dest: path.join(__dirname, "../uploads/") });

// Middleware проверки admin
function isAdmin(req, res, next) {
    if (req.session.role === "admin") return next();
    res.send("Только админ");
}

// Добавление объявления
router.post("/add", isAdmin, upload.single("image"), async(req, res) => {
    const { title, description, price } = req.body;
    const image = req.file ? req.file.filename : null;
    await Ad.create({ userId: req.session.userId, title, description, price, image });
    res.redirect("/");
});

// Редактирование объявления
router.post("/edit/:id", isAdmin, upload.single("image"), async(req, res) => {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.send("Объявление не найдено");
    const { title, description, price } = req.body;
    ad.title = title;
    ad.description = description;
    ad.price = price;
    if (req.file) ad.image = req.file.filename;
    await ad.save();
    res.redirect("/");
});

// Удаление объявления
router.post("/delete/:id", isAdmin, async(req, res) => {
    await Ad.findByIdAndDelete(req.params.id);
    res.redirect("/");
});

// Просмотр объявления
router.get("/ad/:id", async(req, res) => {
    const ad = await Ad.findById(req.params.id).populate("userId", "username");
    if (!ad) return res.send("Объявление не найдено");
    res.render("ad", { ad, userId: req.session.userId });
});

module.exports = router;
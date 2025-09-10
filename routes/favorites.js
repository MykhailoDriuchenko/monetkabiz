const express = require("express");
const Favorite = require("../models/Favorite");
const router = express.Router();

// Добавление/удаление избранного
router.post("/favorite/:adId", async(req, res) => {
    if (!req.session.userId) return res.redirect("/login");

    const fav = await Favorite.findOne({ userId: req.session.userId, adId: req.params.adId });
    if (fav) {
        await fav.remove();
    } else {
        await Favorite.create({ userId: req.session.userId, adId: req.params.adId });
    }
    res.redirect(req.headers.referer || "/");
});

// Страница избранного
router.get("/favorites", async(req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    const favs = await Favorite.find({ userId: req.session.userId }).populate("adId");
    const ads = favs.map(f => f.adId);
    res.render("favorites", { ads, userId: req.session.userId });
});

module.exports = router;
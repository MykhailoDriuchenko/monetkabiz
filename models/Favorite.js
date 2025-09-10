const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adId: { type: mongoose.Schema.Types.ObjectId, ref: "Ad" }
});

module.exports = mongoose.model("Favorite", favoriteSchema);
"use strict";
require("dotenv").config();

const fetch = require("node-fetch");
const { Pool } = require("pg");

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;

    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
    const fetchResponse = await fetch(url);
    const stockPrice = await fetchResponse.json();
    console.log("stockPrice => ", stockPrice);

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM stock");
    // client.release();
    console.log("Result : ", result.rows);

    if (typeof stock === "string") {
      const lowercasedStock = (stock || "").toLowerCase();
      const foundStock = await client.query(`SELECT * FROM stock WHERE name = '${stock}'`);
      console.log("foundStock : ", foundStock.rows);
    }

    return null;
  });
};

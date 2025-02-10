"use strict";
require("dotenv").config();

const fetch = require("node-fetch");
const { Pool } = require("pg");

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;
    const ip = req.clientIp;

    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
    const fetchResponse = await fetch(url);
    const stockPrice = await fetchResponse.json();

    if (stockPrice === "Unknown symbol") {
      console.error(`>> No stock price found for ${stock} <<`);
      return null;
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const client = await pool.connect();

    if (typeof stock === "string") {
      const uppercasedStock = (stock || "").toUpperCase();
      const foundStock = await client.query(
        `SELECT * FROM stock WHERE name = '${uppercasedStock}' LIMIT 1`
      );
      console.log("foundStock : ", foundStock.rows);

      if (foundStock.rows.length > 0) {
        const foundUserStock = foundStock.rows[0]
          ? foundStock.rows[0].users_liked.some((ipStr) => ipStr === ip)
          : false;

        if (!foundUserStock) {
          const stockName = foundStock.rows[0].name;
          const updatedStock = await client.query(
            `UPDATE stock SET users_liked = users_liked || '["${ip}"]'::jsonb WHERE name = ${stockName}`
          );
          console.log("updatedStock : ", updatedStock);
        }
      } else {
        const createdStock = await client.query(
          `INSERT INTO stock (name, users_liked) VALUES ('${uppercasedStock}', '[ "${ip}" ]')`
        );
        console.log("createdStock : ", createdStock);
      }
    }

    client.release();

    return null;
  });
};

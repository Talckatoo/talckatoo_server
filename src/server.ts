const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app.ts");

dotenv.config({ path: "./config.env" });

const DB = process?.env?.DATABASE?.replace(
  "<password>",
  `${process.env.DATABASE_PASSWORD}`
);

mongoose.set("strictQuery", true);

const listener = async () => {
  await mongoose
    .connect(DB, {
      useNewUrlParser: true,
    })
    .then(() => console.log("database connection successful"));
  console.log(`Listening on Port ${PORT}!`);
};
const { PORT = 8000 } = process.env;
app.listen(PORT, listener);

const exp = require("express");
const app = exp();
require("dotenv").config(); //process.env
const mongoose = require("mongoose");

const userApp = require("./routes/user.routes");
const murfApp = require("./routes/murf.routes");
const storyApp = require("./routes/story.routes");

const cors = require("cors");
app.use(cors());
app.set("trust proxy", true);

const port = process.env.PORT || 4000;

// Basic route to test if server is running
app.get("/", (req, res) => {
  res.send("Nihesh's Storyboard API is running");
});

//db connnection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, "0.0.0.0", () =>
      console.log(`Server listening on port: ${port}`)
    );
    console.log("DB Connection Success");
  })
  .catch((err) => console.log("Error in DB Connection ", err));

//body parser middleware
app.use(exp.json());

app.use("/api/murf", murfApp);
app.use("/api/user", userApp);
app.use("/api/story", storyApp);

//error handler
app.use((err, req, res, next) => {
  console.log("Error object in express error handler : ", err);
  res.send({ message: err.message });
});

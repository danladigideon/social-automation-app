const express = require("express");

const app = express();
const PORT = 5000;

app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

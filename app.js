const express = require("express");
const multer = require("multer");
const PDFParser = require("pdf-parse");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const PdfParse = require("pdf-parse");

const app = express();
const PORT = 8000;

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/pdf_reader", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// View Engine Declaration
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// MiddleWares
app.use(express.json()); //parse json data middleware
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Define a schema and model for your data
const resultSchema = new mongoose.Schema({
  keyword: String,
  extractedData: String,
});

const Result = mongoose.model("Result", resultSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()} - ${file.originalname}`);
  },
});

// Upload function
const upload = multer({ storage });

//Routes
app.get("/", (req, res) => {
  const defaultPdfText = "";
  res.render("index", { data: null, pdfText: defaultPdfText });
});

app.post("/upload", upload.single("pdfFile"), (req, res) => {
  if (!req.file) {
    // Handle the case where no file was uploaded
    res.render("index", { data: null, error: "No file uploaded", pdfText: "" });
    return;
  }

  const pdffile = fs.readFileSync(req.file.path);

  PdfParse(pdffile).then(function (data) {
    const pdfText = data.text;
    const lines = pdfText.split("\n"); // Split the text into an array of lines

    res.render("index", { data: lines, pdfText: pdfText });
  });
});

app.post("/search", (req, res) => {
  const keywords = req.body.keywords.split(",");
  const pdfText = req.body.pdfText;

  if (!pdfText) {
    // Handle the case where pdfText is undefined
    res.render("index", {
      data: null,
      error: "PDF text not found",
      pdfText: "",
    });
    return;
  }

  const lines = pdfText.split("\n");

  // // Convert both keywords and lines to lowercase for case-insensitive search
  // const lowercaseKeywords = keywords.map((keyword) => keyword.toLowerCase());
  // const lowercaseLines = lines.map((line) => line.toLowerCase());

  // // Perform keyword search on the array of lines
  // const results = lowercaseLines.filter((line) =>
  //   lowercaseKeywords.some((keyword) => line.includes(keyword))
  // );

  // res.render("index", { data: results, pdfText: pdfText });

  // Create a new array to store the matched lines exactly as they appear in the PDF
  const results = [];

  // Perform case-insensitive keyword search on the array of lines
  lines.forEach((line) => {
    const lowerCaseLine = line.toLowerCase();
    if (
      keywords.some((keyword) => lowerCaseLine.includes(keyword.toLowerCase()))
    ) {
      results.push(line);
    }
  });

  res.render("index", { data: results, pdfText: pdfText });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

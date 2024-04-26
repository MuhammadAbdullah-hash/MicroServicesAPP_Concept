require("dotenv").config();

const express = require('express');
const cors = require("cors");
// const ejs = require('ejs');


// Set the view engine to EJS
const app = express();
// You can choose any port you prefer
const port = process.env.PORT; 
// Serve static files from the "public" directory
app.use(express.static('public'));
// Enable Json middleware
app.use(express.json());
// Enable Cors
app.use(cors());


// enable html render engine
app.set("view engine", "ejs");



const Router = require("./routes");
const { queueListnerJob , sendZipFileJob } = require("./cronJobs");


app.use("/", Router.userInterfaceRoutes);
app.use("/api", Router.apiRoutes);

// Start Cron Job For Queue Pooling
queueListnerJob.queueListnerJob( );

// sending zipfile of today's data from S3
sendZipFileJob.sendZipFileJob();



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
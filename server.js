// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var parse = require('csv-parse');
var fs = require('fs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var db;
var db = mongoose.connect(process.env.MONGOLAB_URI);

var Schema = mongoose.Schema;

var RescueSchema = new Schema({
  recordStatus: String,
  incidentNumber: String,
  timeCreated: Date,
  names: String,
  streetAddress: String,
  streetNumber: String,
  streetName: String,
  streetSuffix: String,
  apartment: String,
  city: String,
  zipCode: String,
  latCoord: Number,
  longCoord: Number,
  latDMS: String,
  longDMS: String,
  phoneNumber: String,
  twitterHandle: String,
  facebookPost: String,
  locationComments: String,
  numberOfPeopleCSV: String,
  numberOfPeople: Number,
  morePeople: Boolean,
  specialConsiderations: String,
  petsNumber: Number,
  petsType: String,
  otherComments: String,
  linkSource: String,
  priority: String,
  status: String,
  statusUpdated: Date,
  incidentURL: String
});

var Rescue = mongoose.model("Rescue", RescueSchema, "Rescues");



app.use(express.static('public'));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/sync", function (req, res) {
  var input = fs.readFileSync("public/rescues.csv", "utf8");
  //console.log(input);
  parse(input, {}, function(err, output){
    if (err) {
      console.log("Error: ");
      console.log(err);
    } else {
      var dbError = false;
      var count = 0;
      console.log("Syncing " + output.length + " rows.");
      for (var i = 1; i < output.length; i++) {

        var r = output[i];

        // Remove leading space in incident number:
        if (r[0][0] === " ") {
          r[0] = r[0].substring(1, r[0].length);
        }

        var csvRescue = {
          recordStatus: "none",
          incidentNumber: r[0],
          timeCreated: r[1],
          names: r[2],
          streetAddress: r[3],
          apartment: r[4],
          city: r[5],
          zipCode: r[6],
          latCoord: r[7],
          longCoord: r[8],
          phoneNumber: r[9],
          twitterHandle: r[10],
          locationComments: r[11],
          numberOfPeopleCSV: r[12],
          specialConsiderations: r[13],
          petsType: r[14],
          otherComments: r[15],
          latDMS: r[16],
          longDMS: r[17],
          priority: r[18],
          status: r[19],
          incidentURL: "https://harveysos.glitch.me/rescues/json/incident/" + r[0]

        };


        var newRescue = new Rescue(csvRescue);
        newRescue.save(function (saveErr) {
          console.log(count);
          count += 1;
          if (saveErr) {
            //dbError = true;
            console.log("DB Error: [" + i + " " + count + "]");
            //res.status(500);
            //res.send("Error Saving to Database");
          }
          if (count === output.length - 2) {
            if (!dbError) {
              console.log("No DB Error: " + count);
              res.status(200);
              res.send(output.length + " rescues added to database.");
            }
          }
        });
      }
    }
  });
});

app.get("/purge", function (req, res) {
  Rescue.remove({}, function() {
    res.status(200);
    res.send("Purged");
  });
});

//Rescues JSON API:
app.get("/rescues/json/incident/:incidentNumber", function (req, res) {
  var incident = req.params.incidentNumber;
  Rescue.findOne({"incidentNumber": incident}, function(err, resc) {
    res.send(resc);
  });
});


app.get("/rescues/json", function (req, res) {
  Rescue.find(function(err, rescues) {
    if (err) {
      res.send("Error: " + err);
      console.log("Error: " + err);
    }
    res.send(rescues);
  });
});



app.get("/rescues/", function (req, res) {
  res.sendFile(__dirname + '/views/rescues/index.html');
});

// New Rescue Form:

app.get("/rescues/new", function (req, res) {
  res.sendFile(__dirname + "/views/rescues/new.html");
});

app.post("/rescues/new", function (req, res) {
  var data = req.body;

  data.incidentURL = "https://harveysos.glitch.me/rescues/json/incident/" + data.incidentNumber;
  var newRescue = new Rescue(data);
  newRescue.save(function (err) {
    if (err) {
      res.status(400);
      res.send("Error saving to Database");
    } else {
      res.status(200);
      res.send("Thank you for submitting, the location has been added to the HarveySOS Database.");
    }
  });
});

app.get("/rescues/new/get-request", function (req, res) {
  var data = req.query;

  data.incidentURL = "https://harveysos.glitch.me/rescues/json/incident/" + data.incidentNumber;
  var newRescue = new Rescue(data);
  newRescue.save(function (err) {
    if (err) {
      res.status(400);
      res.send("Error saving to Database");
    } else {
      res.status(200);
      res.send("Thank you for submitting, the location has been added to the HarveySOS Database.");
    }
  });
});


app.post("/rescues/master/:incidentNumber", function (req, res) {
  var incident = req.params.incidentNumber;
  Rescue.findOneAndUpdate({"incidentNumber": incident}, {"recordStatus": "master"}, function(err, resc) {
    if (resc){
      res.status(200);
      res.send("OK");
    }
  });
});

app.post("/rescues/duplicate/:dIncNum/master/:mIncNum", function (req, res) {
  var dIncNum = req.params.dIncNum;
  var mIncNum = req.params.mIncNum;
  Rescue.findOne({"incidentNumber": mIncNum, "recordStatus": "master"}, function(err, resc) {
    if (err) {
      console.log("Error: " + err);
      res.status(500);
      res.send("Error");
    }
    if (resc) {
      Rescue.findOneAndUpdate({"incidentNumber": dIncNum}, {"recordStatus": "duplicate"}, function(err, resc) {
        if (resc){
          res.status(200);
          res.send("OK");
        } else {
          res.status(500);
          res.send("Error");
        }
      });
    }
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

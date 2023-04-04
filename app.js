//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
mongoose.connect("mongodb://localhost:27017/memorymeeting", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to DB!")).catch(e => console.log(e));

const meetingSchema = new mongoose.Schema({
  title: String,
  agenda: String,
  participants: Array,
  date: Date,
  location: String,
  meetingstate: Boolean,
});

const Meeting = mongoose.model("meeting", meetingSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  Meeting.find({}, function(err, foundmeetings) {
    if (!err) {
      res.render("home", {
        meetings: foundmeetings
      });
    }
  });
});


app.get("/schedule", function(req, res) {
  res.render("schedule");
});

app.get("/contact", function(req, res) {
  res.render("contact");
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/meetings/:p", function(req, res) {
  const requestedtitle = _.lowerCase(req.params.p);

  Meeting.findOne({title:requestedtitle}, function(err,foundmeeting){
    res.render("meeting", {mymeeting: foundmeeting});
  });
});
app.get("/meetings", function(req, res) {
  Meeting.find({}, function(err, foundmeetings) {
    if (!err) {
      res.render("meetings", {
        meetings: foundmeetings
      });
    }
  });
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/schedule", function(request, response) {
  const title = _.lowerCase(request.body.meetingTitle);
  const date = request.body.meetingDate;
  const time = request.body.meetingTime;
  const combinedDateTime = date + " " + time;
  const location = request.body.meetingLocation;
  const participants = request.body.meetingParticipants;
  console.log(participants);
  const agenda = request.body.meetingAgenda;


  const meeting = new Meeting({ //this is a javascript object
    title: title,
    agenda: agenda,
    participants: participants,
    date: combinedDateTime,
    location: location,
    meetingstate: false,
  });
  meeting.save().then(r => console.log(r)).catch(e => console.log(e));
  response.redirect("/");
});



app.listen(2700, function() {
  console.log("Server started on port 2700");
});

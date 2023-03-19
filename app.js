//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const _ = require('lodash');
const { intersection } = require("lodash");


mongoose.connect("mongodb://localhost:27017/memorymeetingDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const meetingSchema = new mongoose.Schema({
  title: String,
  description: String,
  participants: Array,
  date: Date,
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

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/contact", function(req, res) {
  res.render("contact");
});

app.get("/schedule", function(req, res) {
  res.render("schedule");
});

app.get("/meetings/:p", function(req, res) {
  const requestedtitle = _.lowerCase(req.params.p);

  Meeting.findOne({title:requestedtitle}, function(err,foundmeeting){
    res.render("meeting", {mymeeting: foundmeeting});
  });
});

app.post("/schedule", function(request, response) {
  const title = _.lowerCase(request.body.meetingtitle);
  const description = request.body.meetingdescription;
  
  const meeting = new Meeting({ //this is a javascript object
    title: title,
    description: description,
    participants: [],
    date: new Date(),
    meetingstate: false,
  });
  meeting.save();
  response.redirect("/");
});



app.listen(2700, function() {
  console.log("Server started on port 2700");
});

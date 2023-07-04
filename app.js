//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

mongoose.connect("mongodb+srv://adminCharbel:P1wSG@cluster0.kceghws.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to DB!")).catch(e => console.log(e));

const meetingSchema = new mongoose.Schema({
  title: String,
  date: Date,
  location: String,
  meetinglink: String,
  participants: Array,
  topics: Array,
  description: String,
  transcription: Array,
  tags: Array,
});

const Meeting = mongoose.model("meetingsDB", meetingSchema);

const typeSchema =  new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"]
  },
});
const tagSchema =  new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"]
  },
  color: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"]
  },
});
const Tag = mongoose.model("Tag", tagSchema);
const Type = mongoose.model("Type", typeSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));

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

app.get("/admin", function(req, res) {
  Type.find({}, function(err, foundallTypes) { 
    Tag.find({}, function(err, foundallTags) {
      res.render("admin", {
        types: foundallTypes,
        tags: foundallTags,
      });
    });
  });
});

app.post("/postTypes", function(req, res) {

  const itemName = req.body.newItem;
  const myNewType = new Type({
    name: itemName,
  });
  myNewType.save();
  res.redirect("/admin");
});
app.post("/postTags", function(req, res) {

  const itemName = req.body.newItem;
  var redHex = (Math.floor(Math.random() * 128) + 128).toString(16).padStart(2, '0');
  var greenHex = (Math.floor(Math.random() * 128) + 128).toString(16).padStart(2, '0');
  var blueHex = (Math.floor(Math.random() * 128) + 128).toString(16).padStart(2, '0');
  let code ='#' + redHex + greenHex + blueHex;
  const myNewTag = new Tag({
    name: itemName,
    color: code,
  });

  myNewTag.save();
  res.redirect("/admin");
});
app.post("/deleteTypes", function(req, res) {
  const checkeditemid = req.body.checkboxx;
  console.log(checkeditemid);
  Type.deleteOne({_id: checkeditemid},function(err) {
    if (err) {
      console.log(err);
      next(err); // pass the error to Express's error handler
    } else {
      console.log("Successfully deleted an item of our document.");
      res.redirect("/admin");
    }
  });
});
app.post("/deleteTags", function(req, res) {
  const checkeditemid = req.body.checkboxx;
  console.log(checkeditemid);
  Tag.deleteOne({_id: checkeditemid},function(err) {
    if (err) {
      console.log(err);
      next(err); // pass the error to Express's error handler
    } else {
      console.log("Successfully deleted an item of our document.");
      res.redirect("/admin");
    }
  });
});
app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/meetings/:p", function(req, res) {

  const requestedid = req.params.p;
  Meeting.findOne({_id:requestedid}, function(err,foundmeeting){
    Type.find({}, function(err, foundallTypes) { 
      Tag.find({}, function(err, foundallTags) {
        console.log(foundmeeting);
        res.render("meeting", {
          mymeeting: foundmeeting,
          types: foundallTypes,
          tags: foundallTags,
        });
      });
    });
  });
});

app.get("/meetings", function(req, res) {
  Meeting.find({}, function(err, foundmeetings) {
    if(foundmeetings.length===0){
      res.redirect("/schedule");
    }
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
  console.log(request.body)

  const title = _.lowerCase(request.body.meetingTitle);
  const date = new Date(request.body.meetingDate);
  const location = request.body.meetingLocation;
  const meetingurl = request.body.meetingUrl;
  const participants = request.body.meetingParticipants;
  const topics = request.body.meetingTopics;
  const description = request.body.meetingDescription;
  const meetingData = {};

  if (title) meetingData.title = title;
  if (date) meetingData.date = date;
  if (location) meetingData.location = location;
  if (meetingurl) meetingData.meetinglink = meetingurl;
  if (participants) meetingData.participants = participants;
  if (topics) meetingData.topics = topics;
  if (description) meetingData.description = description;
  meetingData.transcription = [];
  meetingData.tags = [];

  const meeting = new Meeting(meetingData);
  meeting.save().then(r => console.log(r)).catch(e => console.log(e));
  response.redirect("/meetings");
});

app.post("/deleteElement", function(request, response, next) {
  console.log(request.body);
  Meeting.deleteOne(request.body, function(err) {
    if (err) {
      console.log(err);
      next(err); // pass the error to Express's error handler
    } else {
      console.log("Successfully deleted an item of our document.");
      response.redirect("/");
    }
  });
});

app.post("/getTags", function(request, response, next) {
  Meeting.findOne(request.body, function(err,foundmeeting){
    response.send(foundmeeting.tags);
  });
});
app.post("/getmeeting", function(request, response, next) {
  Meeting.findOne(request.body, function(err,foundmeeting){
    response.send(foundmeeting);
  });
});
app.post('/save-audio', (req, res) => {
  // Get the uploaded audio blob from the request
  const transcription = req.body.transcription;
  const id = req.body.id;

  Meeting.findOne({_id:id}, function(err,foundmeeting){
    const update = { $set: { transcription: foundmeeting.transcription.concat(transcription) } };
    Meeting.updateOne({_id:id}, update)
    .then(result => {
      console.log(`Documents updated`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
    res.json({ message: "Transcription uploaded successfully" });
  });
});

app.post('/save-comment', (req, res) => {
  // Get the uploaded audio blob from the request
  const meetingId = req.body.meetingId;
  const commentId = req.body.commentId;
  const commentContent = req.body.commentContent;

  Meeting.findOne({_id:meetingId}, function(err,foundmeeting){
    foundmeeting.transcription[commentId]["comment"]=commentContent;
    const update = { $set: { transcription: foundmeeting.transcription } };
    Meeting.updateOne({_id:meetingId}, update)
    .then(result => {
      console.log(`comment updated`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
    res.json({ message: "Comment uploaded successfully" });
  });
});
app.post('/change-type', (req, res) => {
  const meetingId = req.body.meetingId;
  const sentanceid = req.body.sentanceid;
  const type = req.body.type;

  Meeting.findOne({_id:meetingId}, function(err,foundmeeting){
    console.log(foundmeeting);
    console.log(type);
    foundmeeting.transcription[sentanceid]["type"]=type;
    const update = { $set: { transcription: foundmeeting.transcription } };
    Meeting.updateOne({_id:meetingId}, update)
    .then(result => {
      console.log(`Type updated`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
    res.json({ message: "Type uploaded successfully" });
  });
});

app.post('/add-tag', (req, res) => {
  const meetingId = req.body.meetingId;
  const tag = req.body.tag;
  const input = req.body.input;
  const color = req.body.color;

  Meeting.findOne({_id:meetingId}, function(err,foundmeeting){
    foundmeeting.tags.push({text:input,tag:tag,color:color});
    const update = { $set: { tags: foundmeeting.tags } };
    Meeting.updateOne({_id:meetingId}, update)
    .then(result => {
      console.log(`Tag added`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
    res.json({ message: "Tag uploaded successfully" });
  });
});

app.post('/update-transcription', (req, res) => {
  // Get the uploaded audio blob from the request
  const meetingId = req.body.meetingId;
  const transcriptionId = req.body.transcriptionId;
  const transcriptionContent = req.body.transcriptionContent;

  Meeting.findOne({_id:meetingId}, function(err,foundmeeting){
    foundmeeting.transcription[transcriptionId]["transcription"]=transcriptionContent;
    const update = { $set: { transcription: foundmeeting.transcription } };
    Meeting.updateOne({_id:meetingId}, update)
    .then(result => {
      console.log(`Transcription updated`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
    res.json({ message: "transcription uploaded successfully" });
  });
});

app.post('/delete-transcription', (req, res) => {
  // Get the uploaded audio blob from the request
  const meetingId = req.body.meetingId;
  const transcriptionId = req.body.transcriptionId;

  Meeting.findOne({_id:meetingId}, function(err,foundmeeting){
    (foundmeeting.transcription).splice(transcriptionId, 1);
    const update = { $set: { transcription: foundmeeting.transcription } };
    Meeting.updateOne({_id:meetingId}, update)
    .then(result => {
      console.log(`Transcription deleted`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
    res.json({ message: "transcription deleted successfully" });
  });
});

app.listen(2700, function() {
  console.log("Server started on port 2700");
});

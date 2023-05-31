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
  date: Date,
  location: String,
  meetinglink: String,
  participants: Array,
  topics: Array,
  description: String,
  transcription: Array,
});

const Meeting = mongoose.model("meetingsDB", meetingSchema);

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

app.get("/contact", function(req, res) {
  res.render("contact");
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/meetings/:p", function(req, res) {
  const requestedid = req.params.p;

  Meeting.findOne({_id:requestedid}, function(err,foundmeeting){
    res.render("meeting", {mymeeting: foundmeeting});
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
    }
  });
});

app.post(/saveNote/, function(request, response, next) {
  console.log(request.body);
  const id_meeting = request.body.id_meeting;
  const note = request.body.note;
  const index = request.body.index;
  let update= {$set: { [`transcription.${index}.note`]: note } };
    Meeting.updateOne({_id:id_meeting}, update)
    .then(result => {
        console.log(`Documents updated`);
    })
    .catch(err => console.error(`Error updating documents: ${err}`));
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




function applyFilters(event) {
  console.log("applyFilters")
  event.preventDefault(); // Empêche le rechargement de la page lors de la soumission du formulaire

  // Récupérer les éléments cochés
  const checkedFilters = Array.from(document.querySelectorAll('input[name="filter"]:checked'))
      .map(filter => filter.value);

  // Parcourir les éléments de la liste et les afficher ou les masquer en fonction des filtres sélectionnés
  const transcriptList = document.getElementById('transcript-list');
  const listItems = transcriptList.getElementsByTagName('li');

  for (const listItem of listItems) {
    const topic = listItem.querySelector('.topic').textContent;
    const participant = listItem.querySelector('.participant').textContent;

    if (checkedFilters.includes(topic) || checkedFilters.includes(participant)) {
      listItem.style.display = ''; // Afficher l'élément
    } else {
      listItem.style.display = 'none'; // Masquer l'élément
    }
  }
}







app.listen(2700, function() {
  console.log("Server started on port 2700");
});

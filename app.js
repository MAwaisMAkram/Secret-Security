//jshint esversion:6
require('dotenv').config()
const express =require("express");              //using express module
const bodyParser = require("body-parser");      // for geting values from html
const ejs = require("ejs");                     // for templates
const mongoose = require("mongoose");           // require the dataBase into app
mongoose.set("strictQuery", true);

const encrypt = require("mongoose-encryption");

console.log(process.env.API_KEY);

const app = express();                          // our app is using the express middleware
app.set("view engine", "ejs");                  // view ejs engine to app


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));              // using for static page like css

const conn = mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err){
        if (err) {
            console.log(err);
        }
        else {
            res.render("secrets");
        }
    });
});

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}, function(err, foundUser){
        if (err) {
            console.log(err);
        }
        else {
            if (foundUser.password === password){
                res.render("secrets");
            }
        }
    });
});



app.listen(3000, function(req,res){
    console.log("server listening on port 3000!")
});
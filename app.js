//jshint esversion:6
require('dotenv').config()
const express =require("express");              //using express module
const bodyParser = require("body-parser");      // for geting values from html
const ejs = require("ejs");                     // for templates
const mongoose = require("mongoose");           // require the dataBase into app
mongoose.set("strictQuery", true);

const session = require("express-session");     // express session for user login
const passport =require("passport");            // passport for user login
const passportLocalMongoose = require("passport-local-mongoose");   //mongoose level encyption for user



const app = express();                          // our app is using the express middleware
app.set("view engine", "ejs");                  // view ejs engine to app


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));              // using for static page like css

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());     //initialize the passpot into server
app.use(passport.session());        //using session into passport

const conn = mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);       //pligin the user schema into the passport-mongoose

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());            // creating the strategy for the user

passport.serializeUser(User.serializeUser());   // serializing the user with cookie
passport.deserializeUser(User.deserializeUser());   // deserializing the user from the cookie

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

// get secret page and authenticate the user
app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
    }
    else {
        res.redirect("/login");
    }
});

// logout from the site
app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("/");
        }
    });
});

// register the new user inputing credentials
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local") (req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

// login the user with it's credentials
app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if (err){
            console.log(err);
        }
        else {
           passport.authenticate("local") (req, res, function(){
            res.redirect("/secrets");
           });
        }
    });
});



app.listen(3000, function(req,res){
    console.log("server listening on port 3000!")
});
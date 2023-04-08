//jshint esversion:6
require("dotenv").config()
const express =require("express");              //using express module
const bodyParser = require("body-parser");      // for geting values from html
const ejs = require("ejs");                     // for templates
const mongoose = require("mongoose");           // require the dataBase into app
mongoose.set("strictQuery", true);

const session = require("express-session");     // express session for user login
const passport =require("passport");            // passport for user login
const passportLocalMongoose = require("passport-local-mongoose");   //mongoose level encyption for user
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");


// our app is using the express middleware
const app = express();

// view ejs engine to app                        
app.set("view engine", "ejs");                  


app.use(bodyParser.urlencoded({extended: true}));

// using for static page like css
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

//initialize the passpot into server
app.use(passport.initialize());

//using session into passport
app.use(passport.session());

//connect to mongoose finding and creating userDB
const conn = mongoose.connect("mongodb://127.0.0.1:27017/userDB");

//creating UserSchema from mongoose connection
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

//pligin the user schema into the passport-mongoose
userSchema.plugin(passportLocalMongoose);       
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

// creating the strategy for the user
passport.use(User.createStrategy());            

// work with all kind of authentication strategies passport serialization
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
});

// work with all kind of authentication strategies passport dserialization
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

// creating a google strategy for to get clientsID, Secret and cllback from credentials
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// creating a facebook strategy for to get clientsID, Secret and cllback from credentials
passport.use(new FacebookStrategy({
    clientID: process.env.APPLICATION_ID,
    clientSecret: process.env.APPLICATION_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// get the home route of your application
app.get("/", function(req, res){
    res.render("home");
});

//get the google authentication client profile
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
// the callback from the google authntication client
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
});

//get the facebook authentication client profile
app.get("/auth/facebook",
  passport.authenticate("facebook", { scope: ["user_friends", "manage_pages"] })
);

// the callback from the google authntication client
app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
});

// get login page route
app.get("/login", function(req, res){
    res.render("login");
});

// get register the user route
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
//username from form
//password from form
//callback function for user
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else {
            //local authentication of user credentials for secrete pages
            passport.authenticate("local") (req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

// login the user with it's credentials
//username from form
//password from form
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
            //local authentication of user credentials for secrete pages
            passport.authenticate("local") (req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});


// server configuration on port 3000
app.listen(3000, function(req,res){
    console.log("server listening on port 3000!")
});
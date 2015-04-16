var express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    db = require("./models"),
    session = require('express-session'),
    methodOverride = require('method-override'),
    app = express();

//Added process env
var env = process.env;
var api_key = env.MY_API_KEY;

app.set("view engine", "ejs");

app.get("/", function (req, res) {
	res.render("index");
});


// setting up middleware for bodyParser
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
  secret: 'taco for now',
  resave: false,
  saveUninitialized: true
}));

// let's make our own middleware
// it runs this with every request
app.use("/", function (req, res, next) {
    // the req is the incoming req
    // and the login key is what we made up
    
    // 1.
    req.login = function (user) {
        // set the value on session.userId
        req.session.userId = user.id;
    };
    
  // 2.
  req.currentUser = function () {
    return db.User.
      find({
        where: {
          id: req.session.userId
       }
      }).
      then(function (user) {
        req.user = user;
        return user;
      })
  };
  
  req.logout = function () {
    req.session.userId = null;
    req.user = null;
  }

  next();
});

app.get("/signup", function (req, res) {
  res.render("users/signup");
});

    
app.post('/signup', function(req,res){
	var email = req.body.email;
	var password = req.body.password;
	db.User.createSecure(email,password)
	  .then(function(user){
	  	res.redirect('/login');
	  });
	});	

// remember to have Method=Post and action=users
//  for the form 
app.post("/users",  function (req, res) {
    var user = req.body.user;
    
    db.User.
      createSecure(user.email, user.password).
      then(function () {
        res.send("You've signed in!");
      });
});


// this tells us we will need a `views/login` file
app.get("/login", function (req, res) {
  res.render("users/login");
});


// this where the form goes
app.post("/login", function (req, res) {
    var user = req.body.user;
    
    db.User.
    authenticate(user.email, user.password).
    then(function (user) {
        req.login(user);
        res.redirect("/profile");
    });
});


app.get("/profile", function (req, res) {

	// YOU NEED AUTHORIZATION CODE HERE, BASICALLY, AN IF/ELSE STATEMENT THAT
	// CHECKS TO SEE IF A USER IS LOGGED IN, AND IF NOT, REDIRECTS BACK TO LOGIN
  req.currentUser()
    .then(function (user) {
    	console.log(user);
      res.render("users/profile.ejs", {user: user});
    })
});

app.get("/logout", function (req, res) {
	// USE REQ.LOGOUT TO DELETE THE CURRENT SESSION
	// THEN REDIRECT TO LOGIN OR WHEREVER
  res.render("users/logout");
});


app.get('/search', function (req, res) {
	var city = req.query.city;
	var url = "https://api.foursquare.com/v2/venues/explore?client_id=XBWYZXX2HJBZOXRI0ZFJS34C1KAWZ4BIRXAHILBBD0S3Q3IF&client_secret=FCCEOS40FWH5UBKFYK2EBWDUPEYLTZT55RDDMCALWXUU11MH&v=20130815&near=" + city + "&query=gay+clubs";
	console.log("This is the URL " + url);
	request(url, function (err, resp, body) {
		console.log("request working");
		console.log(body);
		if(!err && resp.statusCode === 200) {
			console.log("Response is coming back");
			var jsonData = JSON.parse(body);
			console.log(jsonData);

			// variables for each piece of data we want back
			// var name = jsonData.response.groups[0].items[0].venue.name;
			// console.log(name);
			// var address = jsonData.response.groups[0].items[0].venue.location.address;
			// console.log(address);
			// var city = jsonData.response.groups[0].items[0].venue.location.city;
			// console.log(city);
			// var state = jsonData.response.groups[0].items[0].venue.location.state;
			// console.log(state);
			// var phone = jsonData.response.groups[0].items[0].venue.contact.formattedPhone;
			// console.log(phone);
			res.render("site/results", {data: jsonData.response.groups[0].items});
		}
	})
});

// app.get('/site/results', function (req, res) {

// 	res.render("site/results");
// 		var city = req.query.city;
// 	var url = "https://api.foursquare.com/v2/venues/explore?client_id=XBWYZXX2HJBZOXRI0ZFJS34C1KAWZ4BIRXAHILBBD0S3Q3IF&client_secret=FCCEOS40FWH5UBKFYK2EBWDUPEYLTZT55RDDMCALWXUU11MH&v=20130815&near=" + city + "&query=gay+clubs";
// 	request(url, function (err, resp, body) {
// 		console.log("request working");
// 		if(!err && resp.statusCode === 200) {
// 			console.log("Response is coming back");
// 			var jsonData = JSON.parse(body);
// 			console.log(jsonData);
			
// 			// variables for each piece of data we want back
// 			// var name = jsonData.response.groups[0].items[0].venue.name;
// 			// console.log(name);
// 			// var address = jsonData.response.groups[0].items[0].venue.location.address;
// 			// console.log(address);
// 			// var city = jsonData.response.groups[0].items[0].venue.location.city;
// 			// console.log(city);
// 			// var state = jsonData.response.groups[0].items[0].venue.location.state;
// 			// console.log(state);
// 			// var phone = jsonData.response.groups[0].items[0].venue.contact.formattedPhone;
// 			// console.log(phone);
// 			res.render("site/results", {data: jsonData.response.groups[0].items});
// 		}
// 	})
// });



app.listen(3000, function () {
  console.log("SERVER RUNNING");
});
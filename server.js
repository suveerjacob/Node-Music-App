// We first require our express package
var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require("bcrypt-nodejs");
var myData = require('./data.js');
var Guid = require('guid');
var cookieParser = require('cookie-parser');
var multer  =   require('multer');
var xss = require("xss");
// This package exports the function to create an express instance:
var app = express();

/// --------------------- for Capcha

var engines = require('consolidate');
app.engine('html', engines.hogan);
var https = require('https');

// ------------------------------
// We can setup Jade now!
app.set('view engine', 'ejs');

// This is called 'adding middleware', or things that will help parse your request
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());
app.use('/uploads-xx', express.static('uploads'));
// This middleware will activate for every request we make to 
// any path starting with /assets;
// it will check the 'static' folder for matching files 
app.use('/assets', express.static('static'));


// -------------------------------------------------------------------------------
function getExtension(song_name) {
    var str = '';
    str = song_name;
    var lastindex = str.lastIndexOf('.');
    var extension = str.substr(lastindex);
    return extension;
};

app.post('/api/addtoplaylist', function (req, res) {
    var SessionId = ( req.cookies._currentSessionId == "" ||
                        req.cookies._currentSessionId == undefined) ? 
                        "" : req.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
    console.log(' -------------------------------------------------------------- ')
    console.log('calling /api/addtoplaylist');
    
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        myData.getUserFromSessionID(SessionId).then(function (user) {
            var new_song_iDs = req.body.songs;
            var playlist_iD = req.body.playlistid;
            console.log('Adding songs :' + new_song_iDs + ' to play list : ' + playlist_iD);
            myData.addToPlayList(user, new_song_iDs, playlist_iD ).then(function (_songupdates) {
                _songupdates.forEach(function(song) {
                    console.log('OFR FKCU Song ID : ' + song.songid);
                }, this);
                /*myData.getUserData(user).then(function (_userData) {
                    
                });*/
                var sdsresult = {
                    songupdates : new_song_iDs,
                    playlistid : playlist_iD,
                    operationDone : 'tr'
                };
                res.json(sdsresult);
                //res.json({ sucess : true });
            });
        
        });
    }else{
        var sdsresult = { operationDone : 'fa'  };
        res.json(sdsresult);
    }
});

var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        console.log(' handling file name and updating all songs playlist.');
      var SessionId = ( req.cookies._currentSessionId == "" ||
                        req.cookies._currentSessionId == undefined) ? 
                        "" : req.cookies._currentSessionId;
      var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
      console.log('is user log-in : ' +  is_logged );
      console.log('session id : ' +  SessionId );
      if(is_logged)
      {
        myData.getUserFromSessionID(SessionId).then(function (user) {
            console.log('Songs is being added to user with session id : ' + SessionId + 
                ' and user id : ' + user._id);    
            var _guid = Guid.create().toString();
            var new_name = 'song-' + _guid + '.mp3';// getExtension(file.originalname).toLowerCase();
            console.log('file ' + file.originalname + ' will be saved with name : ' + new_name);  
            var playlist_name = 'allsongs';
            console.log(' ------------------------------ FILE -------------------------------- ')
            console.log(file);                        
            console.log(' ------------------------------ FILE -------------------------------- ')
            var song_collection = [];
            var new_song = {
                _id : _guid,
                name : file.originalname,
                rating : 5,
                isdefault : false
            };
            song_collection[0] = new_song;
            
            console.log('array of current songs : ' + song_collection);
            
            myData.Playlist_update(song_collection, user._id, playlist_name).then(function (params) {
                console.log('Playlist is updated in database');
                callback(null,  new_name);                  
            });    
            
            
        });           
       }        
    }
});

var upload = multer({ storage : storage}).single('userfile');

app.post('/api/fileupload',function(req,res){
    console.log('file upload module' + new Date().toLocaleString()) ;
    upload(req,res,function(err) {
       
        if(err) {
            res.end("Error uploading file.");
        }
        console.log('File Uploaded.');
        //res.redirect("/");
        res.json({ result : 'done'});
    });
});

app.get('/api/getuserlist' , function (request, response) {
    console.log(' ----------------------------------------------------- ');
    console.log('/api/getuserlist called');
    
    var SessionId = ( request.cookies._currentSessionId == "" ||
                        request.cookies._currentSessionId == undefined) ? 
                        "" : request.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
                        
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        var identifier_data = request.body.playlistid;
        myData.getUsers().then(function (_userList) {
            response.json({ userlist : _userList , playlistid : identifier_data, success : true });
        });        
    }else{
        response.json(  { success : false , message : 'No user is logged in.' } )
    }           
});
app.post('/api/shareplaylist' , function (request, response) {
   
    console.log(' ----------------------------------------------------- ');
    console.log('/api/shareplaylist called');
    
    var SessionId = ( request.cookies._currentSessionId == "" ||
                        request.cookies._currentSessionId == undefined) ? 
                        "" : request.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
                        
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        var playlist_id = request.body.playlistid;
        var useriDs = request.body.users;
        console.log('Playlist id : ' + playlist_id);
        console.log('Users : ' + useriDs);
        myData.getUserFromSessionID(SessionId).then(function (user) {
            
            myData.sharePlaylist(user, useriDs, playlist_id).then(function (op_res) {
                if(op_res == true){
                    
                    response.json(  { 
                        sucess : true , 
                        playlistid : playlist_id ,  
                        message : 'Deleted.' 
                    });
                    
                }else{
                    response.json(  { sucess : false , message : op_res } );
                }
            })

        },function (params) {
            response.json(  { sucess : false , message : params } );
        });
    }else{
        response.json(  { sucess : false , message : 'No user is logged in.' } )
    }
        
});


app.delete('/api/deleteplaylist',function (request, response) {
    console.log(' ----------------------------------------------------- ');
    console.log('/api/deleteplaylist called');
    
    var SessionId = ( request.cookies._currentSessionId == "" ||
                        request.cookies._currentSessionId == undefined) ? 
                        "" : request.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
                        
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        var playlist_id = request.body.playlistid;
        console.log('Playlist id : ' + playlist_id);
        myData.getUserFromSessionID(SessionId).then(function (user) {

            myData.deletePlaylist(playlist_id).then(function (op_res) {
                if(op_res == true){
                    myData.getUserData(user).then(function (_userData) {
                        console.log('Got User Data.');
                        response.json(  { 
                            userData : _userData,
                            sucess : true , 
                            playlistid : playlist_id ,  message : 'Deleted.' } );
                    });
                    
                }else{
                    response.json(  { sucess : false , message : op_res } );
                }
            })

        },function (params) {
            response.json(  { sucess : false , message : params } );
        });
    }else{
        response.json(  { sucess : false , message : 'No user is logged in.' } )
    }       
})
app.delete('/api/deletesong',function (request, response) {

    console.log(' ----------------------------------------------------- ');
    console.log('/api/deletesong called');
    var SessionId = ( request.cookies._currentSessionId == "" ||
                        request.cookies._currentSessionId == undefined) ? 
                        "" : request.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
                        
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        var song_id = request.body.songid;
        var playlist_id = request.body.playlistid;
        
        myData.getUserFromSessionID(SessionId).then(function (user) {
            console.log(' Song Id : ' + song_id);
            console.log(' Playlist Id : ' + playlist_id);
            console.log(' User Id : ' + user._id);
            myData.deleteSongFromPlayList(song_id , user._id , playlist_id ).then(function (op_res) {
                if(op_res == true){
                    myData.getUserData(user).then(function (_userData) {
                        response.json(  { 
                            userData : _userData,
                            sucess : true , songid : song_id, 
                            playlistid : playlist_id ,  message : 'Deleted.' } );
                    });
                    
                }else{
                    response.json(  { sucess : false , message : op_res } );
                }
            })
        },function (params) {
            response.json(  { sucess : false , message : params } );
        });
    }else{
        response.json(  { sucess : false , message : 'No user is logged in.' } )
    }       
    
});

app.post('/api/createplaylist', function (req, res) {
    console.log(' ----------------------------------------------------- ');
    console.log('/api/createplaylist called');
    var SessionId = ( req.cookies._currentSessionId == "" ||
                        req.cookies._currentSessionId == undefined) ? 
                        "" : req.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
    
    
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        myData.getUserFromSessionID(SessionId).then(function (user) {
           console.log('Got user_profile object.');
           var playlist_name = xss(req.body.playlistname);
           
           var user_id = user._id;
           console.log('Playlist to be created : ' + playlist_name);
           console.log('play list for user with User Id : ' + user_id);
           myData.create_custome_playlist(playlist_name, user_id).then(function (result) {
                console.log('Got User Data object.');
                res.json( { sucess : result });
            });   
        });
    }else{
        res.json({ result : 'null' });
    }
});

app.get('/api/getUserData' , function (req, res) {
    console.log(' ----------------------------------------------------- ');
    console.log('/api/getUserData called');
    var SessionId = ( req.cookies._currentSessionId == "" ||
                        req.cookies._currentSessionId == undefined) ? 
                        "" : req.cookies._currentSessionId;
    var is_logged = ( SessionId == "" ||  SessionId == undefined) ? 
                        false : true;
                        
    console.log('User Logged in : ' + is_logged);
    if(is_logged){
        myData.getUserFromSessionID(SessionId).then(function (user) {
           console.log('Got user_profile object.');
            myData.getUserData(user).then(function (userData) {
                console.log('Got User Data object.');
                res.json( userData);
            });   
        });
    }else{
        res.json({ result : 'null' });
    }
});




// -------------------------------------------------------------------------------



app.use('/api/logout', function(request, response){
    console.log("In Logout : Middleware");
    console.log("now clearing the cookie");

    myData.clearSessionID(request.cookies._currentSessionId);

    var anHourAgo = new Date();
    anHourAgo.setHours(anHourAgo.getHours() -1);

    // invalidate, then clear so that lastAccessed no longer shows up on the
    // cookie object
    response.cookie("_currentSessionId", "", { expires: anHourAgo });
    response.clearCookie("_currentSessionId");

    //response.render("pages/home", { pageTitle: "Symphony Music App", _error: null, form_num: 0 });
    response.redirect('/');
});


app.use('/', function(request, response, next){
    //console.log(" / -- middleware");
    if(request.cookies._currentSessionId){
        //console.log("Cookie Exists");
        myData.getUserFromSessionID(request.cookies._currentSessionId).then(function(obj){
            //console.log("User by Session : " + JSON.stringify(obj));
            response.render("pages/mainpage.ejs");
        }, function(err){
            //console.log("User by Session : " + err);
            next();
            //response.render("pages/home", { pageTitle: "Assignment 3", _error: null });
        });
    }else{
        next();
        //response.render("pages/home", { pageTitle: "Assignment 3", _error: null });
    }

});


app.use('/api/signup', function(request, response, next){
    console.log("Server.js: in sign up middleware /api/signup");
    console.log("UserName : " + request.body.username);
    console.log("Password : " + request.body.pass)

    var hash = bcrypt.hashSync(xss(request.body.pass));

    myData.new_user(xss(request.body.username), hash, Guid.create().toString()).then(function(inserted_user) {

        var expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        var generatedSessionID = Guid.create().toString();
        console.log("GEnerated Session ID : "+ generatedSessionID);
        response.cookie("_currentSessionId", generatedSessionID, { expires: expiresAt });

        myData.insertSessionID(inserted_user._id,generatedSessionID).then(function(updated){
            console.log("Updated at signup : " + JSON.stringify(updated) );
            // Sunil Update : 
                // on succesful sign in all songs play list should be populated with default songs.
            myData.copyDefault_songsToUser(inserted_user._id).then(function (result) {
                response.redirect("/");         
            }); 
        });
        
    }, function(errorMessage) {
        response.render("pages/home", { pageTitle: "Symphony Music App", _error: errorMessage, form_num: 1 });
    });
});

app.use('api/login', function(request, response, next){
    console.log("Server.js: in Login middleware /api/login");


    next();
});



// Setup your routes here!

app.get('/clear', function (request, response){

    console.log("Clearing cookies");
    var anHourAgo = new Date();
    anHourAgo.setHours(anHourAgo.getHours() -1);
    response.cookie("_currentSessionId", "", { expires: anHourAgo });
    response.clearCookie("_currentSessionId");
    response.cookie("_currentSessionID", "", { expires: anHourAgo });
    response.clearCookie("_currentSessionID");
});

app.get("/", function (request, response) {
    console.log(request.cookies);
    response.render("pages/home", { pageTitle: "Symphony Music App", _error: null, form_num: 0 });
});


app.post('/api/signup', function(request, response){
    console.log("Server.js: in post /api/signup");
    console.log("UserName : " + request.body.username);
    console.log("Password : " + request.body.pass);
    console.log("Checking : " + response.locals.dat);
});



// ----------------------- capcha

app.post('/api/login', function(request, response){

    verifyRecaptcha(request.body["g-recaptcha-response"], function(success) {
        if (success) {
            console.log("Captcha Success");
            //res.end("Success!");
            console.log("Server.js: in post /api/login");
            console.log("UserName : " + request.body.username);
            console.log("Password : " + request.body.pass);

            myData.getUser(xss(request.body.username)).then(function(user) {

                bcrypt.compare(request.body.pass, user.encryptedPassword, function (err, res) {
                    if (res === true) {

                        var expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() + 1);
                        var generatedSessionID = Guid.create().toString();
                        console.log("Login : GEnerated Session ID : "+ generatedSessionID);
                        response.cookie("_currentSessionId", generatedSessionID, { expires: expiresAt });
                        myData.insertSessionID(user._id,generatedSessionID).then(function(updated){
                            console.log("Updated at login : " + JSON.stringify(updated) );
                        });

                        //response.render("pages/mainpage.ejs");
                        response.redirect('/');
                    } else {
                        response.render("pages/home", { pageTitle: "Symphony Music App", _error: "Password Do Not Match!" , form_num: 2});
                    }
                });

            }, function(errorMessage) {
                //response.status(500).json({ error: errorMessage });
                response.render("pages/home", { pageTitle: "Symphony Music App", _error: errorMessage, form_num: 2 });
            });
        } else {
            //res.end("Captcha failed, sorry.");
            console.log("Captcha Failed");
            // TODO: take them back to the previous page
            response.render("pages/home", { pageTitle: "Symphony Music App", _error: "Captcha Failed!! Try Again" , form_num: 2});
        }
    });
});

var SECRET = "6Lf5bR4TAAAAAIeTVzYOFNjTSpKJhs1PpqIj7FIe";

// Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
}

// -------------------------------
app.post('/api/update', function(request, response){
    console.log("Server.js: in post /api/update");
    console.log("First Name : " + request.body.firstname);
    console.log("Last Name : " + request.body.lastname);
    console.log("Hobby : " + request.body.hobby);
    console.log("Pet Name : " + request.body.petname);

});

app.post('/api/logout', function(request, response){
    console.log("In Logout : ");
});


// We can now navigate to localhost:3000
app.listen(3000, function () {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});

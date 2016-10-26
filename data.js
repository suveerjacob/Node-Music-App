var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    runStartup = require("./startup.js"),
    bcrypt = require("bcrypt-nodejs"),
    Guid = require('guid');

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

runStartup().then(function(user) {
    console.log("Data.js : Database Configured");
    console.log("Data.js : User Detail : -- " );
    console.log(user);
});

MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        var myCollection = db.collection("user_profile");

        exports.create_custome_playlist = function (playlistName, _userid) {
            var custome_PL= {
                id : Guid.create().toString(),
                name : playlistName,
                userid : _userid,
                songs : [],
                isPublic : false,
                shared : false,
                sourceid : '',
                ownerid : '',
                ownername : ''
            };
            return db.collection('playlist_master').insert(custome_PL).then(function (params) {
                return true;
            });    
        };
        
        exports.addToPlayList = function (_user, _songs, playListiD) {
            console.log('called addToPlayList');
            return db.collection('playlist_master').findOne({ id: playListiD ,  userid : _user._id }).then(function (playlist) {
                var songs_update = [];
                playlist.songs.forEach(function(songs_id) {
                    songs_update[songs_update.length] = songs_id;                        
                }, this);   
                //console.log('Old Song ID : ' + songs_update);
                _songs.forEach(function(songs_id) {
                    songs_update[songs_update.length] = songs_id;                        
                }, this);
                //console.log('With new Song IDs : ' + songs_update);
                
                return db.collection('playlist_master').update(
                    
                    { id: playListiD ,  userid : _user._id }, 
                    { 
                        id: playListiD , name : playlist.name , userid : _user._id ,
                        songs : songs_update , isPublic : playlist.isPublic
                    },
                    {upsert: true}).then(
                        function (params) {
                        console.log('Updated with Result : ' + params);
                        var songupdates = [];
                        _songs.forEach(function(_songiD) {
                            var songupdate = {
                                songid : _songiD,
                                playlistid : playListiD                                  
                            };
                            songupdates[songupdates.length] = songupdate;
                        }, this);
                        console.log('New Songs Returning : ' + songupdates);      
                        return songupdates;
                    });
            });
        };
        
        exports.getUserData = function (_user) {
            var _userid = _user._id;
            // get all playlist coresponding to user id passed
            // get all songs in those playlist
            // return object as per our design that is
            return db.collection('playlist_master').find({  userid : _userid}).toArray().then(function (playlist_collection) {
                var songsIdCol = [];
                var shared_playlist = [];
                var allsong_playlistid = 0;
                var allsong_playlist_songs = [];
                var _userplaylist = [];
                console.log('Playlist count : ' + playlist_collection.length);
                playlist_collection.forEach(function(playlist) {
                    console.log('Got Playlist : ' + playlist.name +' for user :' + _user.username + ' with following songs :' + playlist.songs);
                    if(playlist.name == 'allsongs'){
                        
                        allsong_playlistid = playlist.id;
                        allsong_playlist_songs = playlist.songs;
                    }else if(playlist.shared){
                        shared_playlist[shared_playlist.length] = playlist;
                        console.log('Playlist : ' + playlist.name +' is a shared list.');
                    }else {
                        _userplaylist[_userplaylist.length] = playlist;
                        console.log('Playlist : ' + playlist.name +' is not a shared list');
                    }
                    playlist.songs.forEach(function(songid) {
                        if(songsIdCol.indexOf(songid) == -1){
                            songsIdCol[songsIdCol.length] = songid;
                        }
                    }, this);
                }, this);
                console.log('Count of Custome Playlist ' + _userplaylist.length);
                return db.collection('songs').find( { _id : {$in : songsIdCol} }).toArray().then(function (song_collection) {
                    var userData = {
                        id : _user._id,
                        name : _user.username,
                        allsongs : { id : allsong_playlistid , name : 'allsongs' ,displayname : 'All Songs',
                                        songs : allsong_playlist_songs  },
                        userplaylist : _userplaylist,
                        sharedPlaylist : shared_playlist,
                        songs : song_collection
                    };
                    console.log('User Data for : ' + _user.name);
                    console.log('User Data : ' + userData);
                    return userData;                    
                })
                
            });            
        };
        
        
        exports.sharePlaylist = function (current_user,useriDList, target_playlist_id ){
            console.log('Current Users in data base : ' + JSON.stringify(current_user));
            console.log('Users : ' + useriDList);
            
            return db.collection('playlist_master').findOne({ id : target_playlist_id}).then(function (target_playlist) {
                console.log('Got Target Play list : ' + target_playlist.name);
                return db.collection('playlist_master').find().toArray().then(function (allplaylist) {
                    var playlist_new = [] ;
                    console.log('Got all playlist for comaparision');
                    useriDList.forEach(function(user_iD) {
                        console.log('Processing is done for user id : ' + user_iD);
                        var playlist_user = allplaylist.filter( pl => (pl.userid == user_iD));
                        //console.log('Playlist for users : ' +JSON.stringify(playlist_user));
                        var target_in_source = playlist_user.find(pl => pl.sourceid == target_playlist_id);
                        console.log('Original Playlist : ' +JSON.stringify(target_in_source));
                        if(target_in_source == null || target_in_source == undefined){
                            console.log('Is is null');
                            
                            console.log('Current User : ' + JSON.stringify(current_user));
                            var playlist_n = {
                                id : Guid.create().toString(),
                                sourceid : target_playlist.id, 
                                userid : user_iD,
                                name : target_playlist.name,
                                isPublic : false,
                                shared : true,
                                songs : target_playlist.songs,
                                ownerid : target_playlist.userid,
                                ownername : current_user.username
                            };
                            console.log('New Playlist : ' + JSON.stringify(playlist_n));
                            playlist_new[playlist_new.length] = playlist_n;
                            console.log('NEW playlist is being created for user : ' + user_iD);
                        } else{
                            console.log( user_iD + ' user already has this playlist.');
                        }
                    }, this);
                    
                    // now insert into database.
                    if(playlist_new.length > 0){
                        console.log( 'Going for execution.');
                        return db.collection('playlist_master').insert(playlist_new).then(function (params) {
                            console.log('Sharing is done.');
                            return true;
                        },function (params) {
                            console.log('Error: ' + params);
                        });
                    }
                    else
                        return true;
                });    
            });
            
            
        }
        exports.copyDefault_songsToUser = function (_userid) {
            return db.collection('playlist_master').findOne({ name : 'default', isPublic : true }).then(
                function (defaultsongs) {
                    console.log('default track : ' + defaultsongs);
                    var destination_default = [];
                    defaultsongs.songs.forEach(function(default_song_id) {
                        destination_default[destination_default.length] = default_song_id; 
                    }, this);
                    var all_song_playlist= {
                        id : Guid.create().toString(),
                        name : 'allsongs',
                        userid : _userid,
                        songs : destination_default,
                        isPublic : false,
                        ownerid : '',
                        ownername : '',
                        sourceid : '',
                        shared : false
                        
                    };
                    return db.collection('playlist_master').insert(all_song_playlist).then(
                        function (params) {
                            console.log('Copied default playlist to all songs of recently signup user.')
                            return true;
                        },function (params) {
                            console.log('error occured whie copying default playlist to all songs.')
                            return false;
                        }
                    );
                }
            );
        };
        
        exports.Playlist_update = function (_songs, user_id, playlist_name) {
            // ALGORITHM : 
            // add to songs collection first
            // check for exsiting playlist for playlist name passed and user id. 
                // if present append for playlist name
                // else create new playist with play list name passed for current user.
             
            console.log('song being added : ' + _songs);
            return db.collection('songs').insert(_songs).then(function (params) {
                console.log('Song is added to songs collection');
                
                return db.collection('playlist_master').findOne({ userid : user_id, name  : playlist_name}).then(function (playlist) {
                    console.log('Song is being added to playlist collection');
                    if(playlist != null && playlist != undefined){
                        
                        console.log('Yepi, found a record with user id : ' + user_id + ' and playlist name : ' + playlist_name);
                        var all_songs = []; all_songs = playlist.songs;
                        _songs.forEach(function(song) {
                            all_songs[all_songs.length] = song._id;
                        }, this);
                        
                        return db.collection('playlist_master').update(
                            { userid : user_id ,  name  : playlist_name },
                            { 
                                id :playlist.id , userid : playlist.userid, 
                                name : playlist.name, isPublic : playlist.isPublic, 
                                songs : all_songs
                            },
                            { upsert: true }
                        ).then(function (params) {
                            console.log(' all songs are updated in database : ' + params.songs);
                            return params;
                        });
                    }else{
                        console.log('Playlist : ' + playlist_name + ' for user with id : ' + user_id + ' has created first time.');
                        var songId_col = [];
                        _songs.forEach(function(song) {
                            songId_col[songId_col.length] = song._id;
                        }, this);
                        var newplaylist = {
                            id : Guid.create().toString(),
                            userid : user_id,
                            name : playlist_name,
                            songs : songId_col,
                            isPublic : false,
                            ownerid : '',
                            ownername : '',
                            sourceid : '',
                            shared : false
                        };
                        return db.collection('playlist_master').insert(newplaylist).then(function (params) {
                            console.log('created playlist : done');
                            return true; 
                        });
                    }
                });
                
                    
            });            
            
        };
        exports.deletePlaylist = function (playlistid) {
            return db.collection('playlist_master').remove({ id : playlistid}).then(function (params) {
                return true;
            })
        };
        
        exports.getUsers = function () {
            return db.collection('user_profile').find().toArray().then(function (_userprofiles) {
                return _userprofiles;
            })
        }
        
        exports.deleteSongFromPlayList = function (_songid , _userid , _playlistid) {
            console.log('In module : ' + 'deleteSongFromPlayList');
            return db.collection('playlist_master').findOne({ id : _playlistid, userid : _userid }).then(
                function (playlist) {
                    
                    console.log('Found playlist : ' + playlist.name +' with user id : ' + _userid + ' and playlist id : ' + _playlistid);
                    console.log('old play list count : ' + playlist.songs.length);
                    var playlist_songs = [];
                    //playlist_songs = playlist.songs;
                    //playlist_songs.filter( songid => songid != _songid);
                    playlist.songs.forEach(function(songid) {
                        if(songid != _songid)   
                            playlist_songs[playlist_songs.length] = songid;
                    }, this);
                    console.log('new play list count : ' + playlist.songs.length);
                    return db.collection('playlist_master').update(
                        { id  : _playlistid, userid : _userid},
                        { 
                            id :playlist.id , userid : playlist.userid, 
                            name : playlist.name, isPublic : playlist.isPublic, 
                            songs : playlist_songs
                        },
                        { upsert: true }).then(function (params) {
                            console.log('Updated.');
                            return true;
                        });
                });
            
        };
        
        exports.getUser = function(_username){
            console.log("In getUser method");
            return myCollection.find({ username: _username }).limit(1).toArray().then(function(user) {
                if (user.length === 0) return Promise.reject("Username : \'" +_username +"\' not found!");
                return user[0];
            });
        };

        exports.getUserFromID = function(id){
            console.log("In getUserFromID method");
            return myCollection.find({ _id: id }).limit(1).toArray().then(function(user) {
                if (user.length === 0) return Promise.reject("No user found");
                return user[0];
            });
        };

        exports.getUserFromSessionID = function(sessionID){
            //console.log("In getUserFromSessionID method");
            return myCollection.find({ currentSessionId: sessionID }).limit(1).toArray().then(function(user) {
                if (user.length === 0) return Promise.reject("No user found");
                return user[0];
            });
        };

        exports.new_user = function(_username, pass_hash){
            console.log("In new_user method");
            var user = {
                _id : Guid.create().toString(),
                username: _username,
                encryptedPassword: pass_hash,
                currentSessionId: '',
                profile: {
                    firstName: '',
                    lastName: '',
                    hobby: '',
                    petName: ''
                }
            };

            return myCollection.find({ username: _username }).limit(1).toArray().then(function(user_found) {
                if (user_found.length !== 0) return Promise.reject("Username : \'" +_username +"\' already exists! Try a different username!");

                return myCollection.insertOne(user).then(function (newUser) {
                    return newUser.insertedId;
                }).then(function(user_id){
                    return exports.getUserFromID(user_id)
                });
            });

        };

        exports.updateUser = function(_sessionID, _profile){
            console.log("In update user method");
            return myCollection.updateOne({ currentSessionId: _sessionID }, { $set: { "profile": _profile } }).then(function() {
                return exports.getUserFromSessionID(_sessionID);
            });
        };

        exports.insertSessionID = function(_userID, sessionID){
            console.log("inserting session ID in database");
            return myCollection.updateOne({ _id: _userID }, { $set: { "currentSessionId": sessionID } }).then(function() {
                return exports.getUserFromID(_userID);
            });
        };

        exports.clearSessionID = function(sessionID){
            console.log("Clearing Session ID");
            return myCollection.updateOne({ currentSessionId: sessionID }, { $set: { "currentSessionId": "" } });
        };

    });

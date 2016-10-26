var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    fs = require('fs'),
    Guid = require('guid');

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;

function getExtension(song_name) {
    var str = '';
    str = song_name;
    var lastindex = str.lastIndexOf('.');
    var extension = str.substr(lastindex);
    return extension;
}

function rename_DefaultSongs(Naav_guid , Aazaadiyan_guid, Kahaani_guid, Naav_OG_Name ,Aazaadiyan_OG_Name, Kahaani_OG_Name ) {
      var naav_new_name = 'songs-' + Naav_guid + getExtension(Naav_OG_Name);
      var azzadiyan_new_name = 'songs-' + Aazaadiyan_guid + getExtension(Aazaadiyan_OG_Name);
      var kahaani_new_name = 'songs-' + Kahaani_guid + getExtension(Kahaani_OG_Name);
      
      
      fs.renameSync('./uploads/' + Naav_OG_Name,'./uploads/' + naav_new_name);
      fs.renameSync('./uploads/' + Aazaadiyan_OG_Name,'./uploads/' + azzadiyan_new_name);
      fs.renameSync('./uploads/' + Kahaani_OG_Name,'./uploads/' + kahaani_new_name);
       
};
/*
                var naav_og_name = '04 - Naav.mp3';
                var aazadiyan_og_name = '06 - Aazaadiyan.mp3';
                var kahaani_og_name = '01 - Kahaani (Aankhon Ke Pardon Pe).mp3';
                var Naav_guid = Guid.create().toString();
                var Aazaadiyan_guid  = Guid.create().toString();
                var Kahaani_guid = Guid.create().toString();
                
                rename_DefaultSongs(Naav_guid,Aazaadiyan_guid, Kahaani_guid, 
                        naav_og_name, aazadiyan_og_name, kahaani_og_name);
                
                db.collection('songs').insert(
                        [
                            { _id: Naav_guid, name: naav_og_name , 
                              rating: 5 , isdefault : true },
                            { _id: Aazaadiyan_guid , name: aazadiyan_og_name, 
                              rating: 5 , isdefault : true },
                            { _id: Kahaani_guid , name: kahaani_og_name, 
                              rating: 5 , isdefault : true },
                        ],
                        { ordered: false }).then(function (params) {
                            console.log('added default songs to the songs collection');
                            return true;
                        });
 */
function generateDefualtSongs(db) {
    
    return db.collection('songs').count().then(
        function (_count) {
            if(_count < 1){
                
                db.collection('songs').insert(
                        [
                            { _id: 'default1', name:  'Naav.mp3' , 
                              rating: 0 , isdefault : true },
                            { _id: 'default2' , name: 'Aazaadiyan.mp3', 
                              rating: 0 , isdefault : true },
                            { _id: 'default3' , name: 'Kahaani (Aankhon Ke Pardon Pe).mp3', 
                              rating: 0 , isdefault : true },
                        ],
                        { ordered: false }).then(function (params) {
                            console.log('added default songs to the songs collection');
                            return true;
                        });        
            }else{
                console.log('Songs collection has ' + _count + ' songs');
                return true;
            }      
    });
};

function genarate_default_PlayList(db) {
    console.log('Generating default playlist defaultplaylist ');
    return db.collection('playlist_master').findOne({ name : 'default'}).then(function (default_playList) {
        
        if(default_playList == null && default_playList == undefined){
            
            console.log('default playlist was not there. Therefore creating one.');
            return db.collection('songs').find().toArray().then(function (allsongs) {
                var defualt_songs = [];
                allsongs.forEach(function(element) {
                    if(element.isdefault){
                        defualt_songs[defualt_songs.length] = element._id;
                        console.log('Song : ' + element.name + ' is being added to default playlist');
                    }                    
                }, this);
                return db.collection('playlist_master').insert(
                    { id : Guid.create().toString() , 
                      name : 'default',
                      songs : defualt_songs,
                      shared : false,
                      isPublic : true },
                    { ordered: false }).then(function (params) {
                        console.log('default play list creation is done.');
                        return true;
                });
            })
        }else{
            console.log('default collection is already there');
            return true;
        }
    });    
};

function runSetup() {
    /*return MongoClient.connect(fullMongoUrl)
        .then(function(db) {
            return db.createCollection("user_profile");
        }).then(function(userCollection) {

            return userCollection.count().then(function(theCount) {
                // the result of find() is a cursor to MongoDB, and we can call toArray() on it
                if (theCount > 0) {
                    return movieCollection.find.toArray();
                }
            });
        });*/
        
        console.log('Running start-up code.');
        return MongoClient.connect(fullMongoUrl).then(function(db) {
            return db.createCollection("user_profile").then(function (params) {
                console.log('user profile collection created.');
                return db.createCollection("playlist_master").then(function (params) {
                    //deleteAllSongs(db);
                    console.log('Playlist Master collection created.');
                    return generateDefualtSongs(db).then(function (_playlist_creation) {
                        console.log('Generating default songs is done.');
                        return genarate_default_PlayList(db).then(function (params) {
                            console.log('created tables user, playlist, songs in database.');
                            return true;                         
                        })                
                    });   
                }); 
            });
        });
}

// By exporting a function, we can run 
var exports = module.exports = runSetup;
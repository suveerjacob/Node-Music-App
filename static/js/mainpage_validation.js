

(function ($){

    console.log("in main page validation");
    var userData = null;
    var songs_for_user_playlist = [];
    
    var get_userData = {
        method: "GET",
        url: '/api/getUserData'      
    };
    function populateMainPage(){
        $.ajax(get_userData).then(function (_userData) {
            $('#user_button').html('');
            $('#user_button').append(_userData.name + '<span class="caret"></span>');
            $('#user_li_name').text("Welcome "+_userData.name);
            
            $('#welcometext').text("Welcome "+_userData.name);
            
            console.log('Retrived User Data from server : ' + _userData);
            var _songs = [];
            _songs = _userData.allsongs;
            userData = _userData;
            console.log(JSON.stringify(userData));
            prepare_all_playlist(_userData.allsongs , _userData.songs);
            postUserPlayList_template(_userData.userplaylist, _userData.songs, MyListControl);
            postUserPlayList_template(_userData.sharedPlaylist, _userData.songs, SharedListControl);
            
            /*if(_songs.length > 0)
                playsong(_songs , _songs[0]._id);
            else if(_userData.songs.length > 0)
                playsong(_songs , _userData.songs[0]._id);*/
        });
    }
    
    $(function() {
        $(document).keyup(function(evt) {
            if (evt.keyCode == 32) {
                console.log("Space pressed : keyup");
            }
            if (evt.keyCode == 27) {

                if($('#file_upload_box').hasClass('in')){
                    console.log("Escape pressed : Modal Open. Now Closing it");
                    $('#file_upload_box').modal('toggle');

                }
                // create_play_list
                if($('#create_play_list').hasClass('in')){
                    console.log("Escape pressed : Modal Open. Now Closing it");
                    $('#create_play_list').modal('toggle');

                }
                
                // ------------
                if($('#add_songs_toplaylist').hasClass('in')){
                    console.log("Escape pressed : Modal Open. Now Closing it");
                    $('#add_songs_toplaylist').modal('toggle');

                }
                // ----------------
                if($('#mdlshareplaylist').hasClass('in')){
                    console.log("Escape pressed : Modal Open. Now Closing it");
                    $('#mdlshareplaylist').modal('toggle');

                }
            }
        });
    });



    function prepare_all_playlist(allsongs, songs) {
        $("#ulallsongs").empty(); 
        
        //$("#ulallsongs").attr('id', sid);
        allsongs.songs.forEach(function(song_id) {
            //alert('sjsj');
            console.log('Playlist is being created for playlist with id : ' + allsongs.id + ' and name : ' + allsongs.name);
            var songs_col = [];
            songs_col = songs;
            var song = songs_col.find( x => (x._id == song_id));
            if(song != null && song != undefined){
                
                //alert('song ' + song.name + ' being added to list all playlist');
                var list_item = '';
                list_item =  '<li id="'+ song._id +'" class="list-group-item">' + 
                    '<div class="row">' +
                        '<div class="col-xs-2">' +
                            '<button  class="btn btn-primary"  data-operation="playsongs"  data-listid="' + allsongs.id + '" data-id="' + song._id + '">Play <span class="glyphicon glyphicon-play"></span></button>' +
                        '</div>' +
                        '<div class="col-xs-4">' +
                            '<p>' + song.name + '</p>' + 
                        '</div>' +
                        '<div class="col-xs-6" >' +
                            '<button class="btn btn-primary" data-operation="delallsongs" data-listid="' + allsongs.id + '" data-id="' + song._id + '" style="float: right"><span  class="glyphicon glyphicon-trash"></span></button>' +
                        '</div>' +
                    '</div>' +
                '</li>';
                
                $("#ulallsongs").append(list_item);      
            }
        }, this);
    }
    
    /*$("#ulallsongs").delegate('.btn btn-primary', 'click', function () {
        alert('Hello you did it.');    
    });*/
   function getPlayListByiD(iD) {
       var playlist = null;
       
       // (userData.allsongs.id == iD) ? userData.allsongs ? userData.allsongs : ( (userData.userplaylist.indexOf(iD) != -1) ? (userData.userplaylist.find(sid=> sid == iD) :
       if(userData.allsongs.id == iD){
            playlist = userData.allsongs;
            console.log('Found play list with name :' + playlist.name + ' for playlist with iD : ' + iD);
       }
       else if(userData.userplaylist.find(playlist => playlist.id == iD) != null
            && userData.userplaylist.find(playlist => playlist.id == iD) != undefined ){
           
           playlist = userData.userplaylist.find(playlist => playlist.id == iD);
           console.log('Found play list with name :' + playlist.name + ' for playlist with iD : ' + iD);
       
       }else if (userData.sharedPlaylist.find(playlist => playlist.id == iD) != null
            && userData.sharedPlaylist.find(playlist => playlist.id == iD) != undefined){
       
           playlist = userData.sharedPlaylist.find(playlist => playlist.id == iD);
           console.log('Found play list with name :' + playlist.name + ' for playlist with iD : ' + iD);
       
       }
       return playlist;     
   }
   
   
    function doesIdExsits(id, song_ids) {
        return song_ids.indexOf(id) != -1;
    }
    
    function getfilteredList(allsongs, exsitingSongiDs)
    {
        console.log('All Songs : ' + JSON.stringify(allsongs));
        console.log('Already Present songs : ' + JSON.stringify(exsitingSongiDs));
        var possiblesongs = [];
        var exsistingSongs = [];
        allsongs.forEach(function(element) {
            
            exsitingSongiDs.forEach(function(songid) {
                if (element._id == songid) {
                    exsistingSongs[exsistingSongs.length] = element;
                }
            }, this);
        }, this);   
        
        
        allsongs.forEach(function(availableSong) {
            var Present = false;
            exsistingSongs.forEach(function(existingSong) {
                if ((existingSong._id == availableSong._id) || (existingSong.name == availableSong.name)) {
                    Present = true;                     
                }
            }, this);
            if(!Present){ 
                    possiblesongs[possiblesongs.length] = availableSong;
                    console.log('songs : ' + availableSong.name + ' is already present.');}
            else{
                    console.log('songs : ' + availableSong.name + ' can be added.');
                }
            
        }, this);
        console.log('Available songs : ' + JSON.stringify(possiblesongs));
        return possiblesongs;
        
    }
    
    function getUserPlTemplate(songid, playlistid, songname) {
        var playlist_template = '<li id="' + songid + '" class="list-group-item">'+
                '<div class="row">'+
                    '<div class="col-xs-2">'+
                        '<button  class="btn btn-primary" data-operation="playsongs" data-listid="' + playlistid + '" data-id="' 
                            + songid + '">Play <span class="glyphicon glyphicon-play"></span></button>'+
                    '</div>' +
                    '<div class="col-xs-4">'+
                        '<p>' + songname + '</p>' +
                    '</div>'+
                    '<div class="col-xs-6" >'+
                        '<button class="btn btn-primary" data-operation="del_cust_pl" style="float: right" data-listid="' + playlistid 
                            + '" data-id="' + songid + '">Delete</button>' +
                    '</div>' +
                '</div>' +
        '</li>';
        return playlist_template;
                                    
    }
    var current_playlistid = '';
    $(document).on("click", ".btn", function(e){
         console.log('click for class : btn');
         var operation = $(this).data('operation');
         console.log('operation : ' + operation);
         if(operation == 'playsongs'){
            
            var song_id = $(this).data('id');
            playsong(userData.songs , song_id);    
         }else if(operation == 'addto_pl'){
             var plist_id = $(this).data('listid');
             console.log('Adding songs to Play List : ' + getPlayListByiD( plist_id));
             if (plist_id != '') {
                 $('#ulavailablesongs').empty();
                 var current_playList = getPlayListByiD(plist_id);
                 //console.log('Current Playlist name : ' + current_playList.name);
                 //var possible_song_ids = userData.allsongs.songs.filter(song_id => !doesIdExsits(song_id, current_playList.songs));
                 //console.log('Possible song ids : ' + possible_song_ids);
                 var possible_songs = [];
                 //possible_songs = userData.songs.filter( songitem => doesIdExsits(songitem._id , possible_song_ids));
                 possible_songs = getfilteredList(userData.songs, current_playList.songs);
                 console.log('Possible songs : ' + possible_songs);
                 possible_songs.forEach(function(possible_song) {
                     var song_template = '<li class="addsongs list-group-item">' + 
                        '<div class="row">' +
                            '<div class="col-xs-1" >' + 
                                '<input type="checkbox"  data-playlistid="' + plist_id + '" id="' + possible_song._id + '" value="'  + possible_song._id + '">' +                            
                            '</div>' +
                            
                            '<div class="col-xs-11">' +
                                '<p>' + possible_song.name + '</p>' + 
                            '</div>' +
                            
                        '</div>' +
                     '</li>';
                    
                     $('#ulavailablesongs').append(song_template);
                     
                 }, this);
                 $('#btnaddcuspl').attr("data-listid", '');
                 $('#btnaddcuspl').attr("data-listid", plist_id);
                 current_playlistid = plist_id;
                 $('#add_songs_toplaylist').modal('toggle');
                 
                 songs_for_user_playlist = [];
             }
         }else if(operation == 'addto_user_pl'){
             
             var psong_id = $(this).data('id');
             songs_for_user_playlist[songs_for_user_playlist.length] = psong_id;
             //console.log('Song being added with iD : ' + psong_id);
         }else if(operation == 'cnfm_add_user_play'){
             
             
             
                var current_list_id = $(this).data("listid");
                current_list_id = current_playlistid;
                 console.log('Saving data to server to add songs to playlist : ' + getPlayListByiD(current_list_id));
                 var arr_song_ids = [];                                 
                 var songs_tpUpdate = $('li.addsongs input[type=checkbox]:checked').map(function(){
                     arr_song_ids[arr_song_ids.length] =  $(this).val();
                     return $(this).val();
                    });
                    console.log('Newly selected songs to load : ' +    arr_song_ids);
             
             
                 
                 if(arr_song_ids.length > 0){
                     var _addto_user_pl = {
                        method: "POST",
                        url: '/api/addtoplaylist',
                        contentType : "application/json",
                        data: JSON.stringify({ 
                                playlistid : current_list_id,
                                songs : songs_tpUpdate.get()
                            })
                    };  
                    
                    $.ajax(_addto_user_pl).then(function(result_json){   
                        
                        current_playlistid = "";
                        //console.log('going to call /api/addtoplaylist');
                        if($('#add_songs_toplaylist').hasClass('in')){
                                console.log("Modal for adding songs to playlist is open. Now Closing it");
                                $('#add_songs_toplaylist').modal('toggle');
                        }       
                        //console.log('Data returned from server : ' + result_json.operationDone );
                        if(result_json.operationDone == "tr"){
                            //console.log('Data returned from server : ' + result_json.operationDone );
                            //userData = result_json.userData;
                            var playlistObj = userData.userplaylist.find(pl => (pl.id== result_json.playlistid));
                            result_json.songupdates.forEach(function(updatedSongs) {
                                playlistObj.songs[playlistObj.songs.length] = updatedSongs;
                            }, this);   
                            var song_tobeAdded = [];  song_tobeAdded = result_json.songupdates;
                            //console.log('Song IDs : ' + result_json.songupdates);  
                            song_tobeAdded.forEach(function(id) {
                                var songObj = userData.songs.find(song => song._id == id);
                                
                                //console.log('Song Name : ' + songObj.name + ' with playlist id : ' + result_json.playlistid);
                                var userPlayListSong_Template = getUserPlTemplate(id,result_json.playlistid,songObj.name);
                                $('[id=ul' + result_json.playlistid +']').append(userPlayListSong_Template);        
                            }, this);
                        }
                        
                        
                        //prepare_all_playlist(_userData.allsongs , _userData.songs);
                        //postUserPlayList_template(_userData.userplaylist, _userData.songs);                    
                    }); 
                 }
         
         }else if(operation == 'del_cust_pl'){
             var playlistid = $(this).data("listid");
             var psongid = $(this).data("id");
             deleteSongCustFromPlaylist(psongid, playlistid);
         }else if(operation == 'delallsongs'){
             var playlistid1 = $(this).data("listid");
             var psongid1 = $(this).data("id");
             //console.log('Deleting song from all songs list. playlistid1: ' + playlistid1 + ' psongid1:' + psongid1);
             deleteSongFrom_All_Playlist(psongid1, playlistid1);
         }else if(operation == 'delete_pl'){
             var playlistid2 = $(this).data("listid");
             console.log('play list id : ' + playlistid2);
             deletePlaylist(playlistid2);
         }else if(operation == 'share_pl'){
             var playlistid3 = $(this).data("listid");
             
             var get_playlists = {
                    method : "GET",
                    url : '/api/getuserlist',
                    contentType : "application/json",
                    data: JSON.stringify({
                        playlistid : playlistid3 
                    })      
             };
             $.ajax(get_playlists).then(function (response) {
                 if(response.success){
                     console.log('All Users : ' + response.userlist);
                     var userList = response.userlist;
                     $('#btnshareplaylist').attr('data-playlistid' , playlistid3);
                     createShareList(userList);
                 }else{
                     console.log('Error : There was a problem at server side ');
                     console.log(response.message);
                 }
             });
         }else if(operation == 'shareplaylist'){
             //$('#uluserlist').find('input[data-pla]')
             var playlistid4 = $(this).data("playlistid");
             //console.log('Current Play list : ' + playlistid4);
             var checkedValues = $('li.addto input[type=checkbox]:checked').map(function(){
                 return $(this).val();
             });
             
             //console.log("Checked Values : "+checkedValues.get());
             var share_req = {
                 method : 'POST',
                 url : '/api/shareplaylist',
                 contentType : "application/json",
                 data: JSON.stringify({
                     users : checkedValues.get(), 
                     playlistid : playlistid4
                 })       
             };
             $.ajax(share_req).then(function (response) {
                 console.log('response received from server.');
                 if($('#mdlshareplaylist').hasClass('in')){
                            console.log("Modal for adding songs to playlist is open. Now Closing it");
                            $('#mdlshareplaylist').modal('toggle');
                    }       
                 
             });
         }else if(operation == 'crtpl'){
             $('#txtnewplaylistname').val();
             if($('#txtnewplaylistname').val() == ''){
                 $('#crtplstatus').text('Can not be empty');
             }else{
                 $('#crtplstatus').text('Creating');
                 postPlayListToServer();    
             }
             
         }
         
             
    });
    
    
    
    $(document).on('oninput','.target',function(params) {
        console.log( params );
    });
    function filterUsers(params) {
        console.log(params);
    }
    function createShareList(userlist, playlistiD) {
        $('#uluserlist').empty();
        var all_user_template = '';
        userlist.forEach(function(user) {
            if(user._id != userData.id){
                all_user_template += '<li id="' + user._id + '" class="addto list-group-item">' +
                                    '<div class="row">'+
                                        '<div class="col-xs-1">'+
                                            '<input type="checkbox" data-playlistid="' + playlistiD + '" id="' + user._id + '" value="'  + user._id + '">' +
                                        '</div>' +
                                        
                                        '<div class="col-xs-11">'+
                                            '<label type="text" id="' + user._id + '" value="' + user.username + '">' + user.username + '</label>' +
                                        '</div>' +
                                        
                                    '</div>' +
                                 '</li>';     
            }
            
        }, this);
        all_user_template += '</ul>';
        $('#uluserlist').append(all_user_template);
        $('#mdlshareplaylist').modal('toggle');
    }
    
    
    
    function deletePlaylist(pPlaylistid) {
        var delete_pl = {
            method: "DELETE",
            url: '/api/deleteplaylist',
            contentType : "application/json",
            data: JSON.stringify({
                playlistid : pPlaylistid 
            })  
        };
        $.ajax(delete_pl).then(function (response) {
            if(response.sucess){
                userData = response.userData;
                $('#uluserplaylistcol').find('[data-playlistid='+ response.playlistid + ']').remove();
                $('#ulsharedplaycol').find('[data-playlistid='+ response.playlistid + ']').remove();
            }else{
                console.log('Error : There was a problem at server side ');
                console.log(response.message);
            }
        });
    }
    function deleteSongFrom_All_Playlist(pSongid , pPlaylistid) {
        var delete_song = {
            method: "DELETE",
            url: '/api/deletesong',
            contentType : "application/json",
            data: JSON.stringify({
                songid : pSongid,
                playlistid : pPlaylistid 
            })
         };
         $.ajax(delete_song).then(function (response) {
            console.log(response);
            if(response.sucess){
                userData = response.userData;
                console.log('deleted from server');
                console.log('returing song id : ' + response.songid);
                $("[id=ulallsongs]").find('[id=' + response.songid + ']').remove();  
                
            }else{
                console.log('Error : There was a problem at server side ');
                console.log(response.message);
            }
         });
    }
    
    function postPlayListToServer() {
        console.log('Play List Name : ' + $('#txtnewplaylistname').val()); 
        var pl_name = $('#txtnewplaylistname').val();
        var create_playlist =  {
            method: "POST",
            url: '/api/createplaylist',
            contentType : "application/json",
            data: JSON.stringify({ playlistname : pl_name })
        };
        console.log(' Calling to server ');
        $.ajax(create_playlist).then(function (result) {
            console.log(' call returned. ');
             $.ajax(get_userData).then(function (_userData) {
                 
                if($('#create_play_list').hasClass('in')){
                    console.log("Escape pressed : Modal Open. Now Closing it");
                    $('#create_play_list').modal('toggle');

                }
                $('#crtplstatus').text('');
                console.log('Retrived User Data from server : ' + _userData);
                var _songs = [];
                _songs = _userData.allsongs;
                userData = _userData;
                prepare_all_playlist(_userData.allsongs , _userData.songs);
                postUserPlayList_template(_userData.userplaylist, _userData.songs, MyListControl);
                postUserPlayList_template(_userData.sharedPlaylist, _userData.songs, SharedListControl);
                
            });         
        });
    }
    /*$(document).on('click' , '.createplaylist', function (e) {
        
    });*/
    var playlist_index = 1;
    var MyListControl = 'myplaylist';
    var SharedListControl = 'sharedplaylist';
    function postUserPlayList_template(userPlayList_collection, psongs, listcontrol) {
        // get control 
        if(listcontrol == 'myplaylist')
            $('#uluserplaylistcol').empty();
        else
            $('#ulsharedplaycol').empty();
        var songs = []; songs = psongs;
        
        var cust_PL_collection = []; cust_PL_collection = userPlayList_collection;
        if(cust_PL_collection.length == 0) 
            return;
        cust_PL_collection.forEach(function(userPlayList) {
            console.log('Custome Playlist with ID : ' + userPlayList.id +' and name : ' + userPlayList.name);            
            var playlist_template = '';             
            playlist_template =
                
                '<div data-playlistid="' + userPlayList.id +'" class="panel-group">' +
                    '<div class="panel panel-default">'+
                        '<div class="panel-heading">'+
                            '<h4 class="panel-title">' +
                                '<div>' +
                                    '<a data-toggle="collapse" href="#collapse'+ playlist_index + '">' + userPlayList.name + '</a>' ;
            playlist_template += (listcontrol == SharedListControl) ? '<p style="float: right"> Shared By : ' + userPlayList.ownername + '</p>' : '';
                                    
            playlist_template += '</div>' +
                            '</h4>'+
                        '</div>'+
                        '<div id="collapse' + playlist_index + '" class="panel-collapse collapse">';
                        playlist_template +=  '<ul id="ul' + userPlayList.id +'" class="list-group">';
                        if(userPlayList.songs.length > 0){
                            
                            userPlayList.songs.forEach(function(song_id) {
                                var current_song = songs.find(song => song._id == song_id);
                                if(current_song != null && current_song != undefined ){
                                    console.log('current song object' + current_song.name);
                                    console.log('Adding Song control to play list');
                                    playlist_template += getUserPlTemplate(current_song._id, userPlayList.id, current_song.name);
                                         
                                }else{
                                    console.log('System was unable to find songs in database with id : ' + song_id);
                                }  
                                
                            }, this);                       
                                
                            
                            
                        }
                        playlist_template +=                            
                            '</ul>' ;
                        var classname = (listcontrol == SharedListControl) ? 'btn btn-link hidden' : 'btn btn-link';
                        console.log('Add to list button is being added to Playlist : ' + getPlayListByiD(userPlayList.id));
                        playlist_template +=
                            '<div class="panel-footer">' +
                                '<span>' +
                                    '<button class="btn btn-link" data-operation="delete_pl" data-listid="' + userPlayList.id + '">Delete Playlist</button>' +
                                    '<button class="' + classname + '" data-operation="addto_pl" data-listid="' + userPlayList.id + '">Add To Playlist</button>' +
                                    '<button class="' + classname + '" data-operation="share_pl" data-listid="' + userPlayList.id + '">Share Playlist</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                '</div>' +
                '</div>';
                //console.log(playlist_template);
                if(listcontrol == 'myplaylist')
                    $('#uluserplaylistcol').append(playlist_template);
                else
                    $('#ulsharedplaycol').append(playlist_template);
                
            playlist_index++;            
        }, this);
        
    }
    
    function deleteSongCustFromPlaylist(pSongid , pPlaylistid) {
        var delete_song = {
            method: "DELETE",
            url: '/api/deletesong',
            contentType : "application/json",
            data: JSON.stringify({
                songid : pSongid,
                playlistid : pPlaylistid 
            })
         };
         $.ajax(delete_song).then(function (response) {
            console.log(response);
            if(response.sucess){
                userData = response.userData;
                $('[id=ul' + response.playlistid +']').find('[id=' + response.songid + ']').remove();  
                
                
            }else{
                console.log('Error : There was a problem at server side ');
                console.log(response.message);
            }
         });
    }
    $(document).on("click", ".delete", function(e){
        console.log('click for class : delete');
         var song_id = $(this).data('id');
         //console.log('Deleting song : ' + song_id);
         var playlist_id = $(this).data('listid');
         //console.log('Playlist Id : ' +playlist_id);
         var delete_song = {
            method: "DELETE",
            url: '/api/deletesong',
            contentType : "application/json",
            data: JSON.stringify({
                songid : song_id,
                playlistid : playlist_id 
            })
         };
         $.ajax(delete_song).then(function (response) {
            console.log(response);
            $.ajax(get_userData).then(function (_userData) {
                console.log('Retrived User Data from server : ' + _userData);
                var _songs = [];
                _songs = _userData.allsongs;
                userData = _userData;
                prepare_all_playlist(_userData.allsongs , _userData.songs);
                postUserPlayList_template(_userData.userplaylist, _userData.songs, 'myplaylist');
                postUserPlayList_template(_userData.sharedPlaylist, _userData.songs, 'sharedplaylist');
                /*if(_songs.length > 0)
                    playsong(_songs , _songs[0]._id);
                else if(_userData.songs.length > 0)
                    playsong(_songs , _userData.songs[0]._id);*/
            });         
         });
         
    });
    
     
    
        function playsong(songsCollection , song_Id) {

        var songs = [];
        songs = songsCollection;
        if(songs.length > 0){

            console.log("PLAYING ID : "+song_Id );
            var current_index = userData.allsongs.songs.indexOf(song_Id);
            console.log("CURRENT INDEX : "+userData.allsongs.songs[current_index]);
            console.log("NXT INDEX : "+userData.allsongs.songs[current_index +1]);

            var next_song_id = 'last';
            if(current_index != userData.allsongs.songs.length -1){
                next_song_id = userData.allsongs.songs[current_index +1];
            }else{
                next_song_id = 'last';
            }

            var song = songs.find(x => ( x._id == song_Id));
            console.log('Song to be played :' + song.name);         
            var player=document.getElementById('player');
            $('#player').attr('data-next', next_song_id);
            $('#srcmp3').attr('src', './uploads-xx/song-' + song_Id + '.mp3');
            $('#now_playing').text("Now Playing : " + song.name);
            player.load();
            player.play();
        }
        
    }

    populateMainPage();

    $(function() {
        var upload_form = $('#uploadForm');
        upload_form.submit(function(e){

            e.preventDefault();
            console.log("Upload form submit clicked");
            var form_details = {
                method: "POST",
                url: '/api/fileupload',
                processData: false,
                contentType: false,
                data: new FormData(this)
            };

            $.ajax(form_details).then(function (responseMessage) {
                console.log('Upload Form Response : ' + JSON.stringify(responseMessage.result));
                document.getElementById('upload_file_detail').value = '';
                $('#file_upload_box').modal('toggle');
                populateMainPage();
            });
        });
    });
    
    $(document).ready(function() {
        $('#player').on('ended', function () {
            console.log("Now ended" + $('#player').attr('data-next'));
            playsong(userData.songs, $('#player').attr('data-next'));

        });
        
       
    });


    $(function() {
        var audioElement = document.getElementById('player'); 
        $(document).keyup(function (evt) {
            if (evt.keyCode == 32) {
                evt.preventDefault();
                console.log("Space pressed : keyup");
                if (audioElement.paused) {
                    audioElement.play();
                    console.log("Paused")
                } else {
                    audioElement.pause();
                    console.log("Playing")
                }
            }

        });
    });
    
        
})(jQuery);

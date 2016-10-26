(function ($){
    console.log("This is Validators.js file : function is executed ");


    // Retirement Amount If Saving Per Month
    var sign_up_form = $("#sign_up");
    var u_name = $("#u_name");
    var e_pass = $("#e_pass");
    var c_pass = $("#c_pass");
    var form1_error = $("#form1-error-message");

    $(function() {
        $(document).keyup(function(evt) {
            if (evt.keyCode == 32) {
                console.log("Space pressed : keyup");
            }
            if (evt.keyCode == 27) {

                if($('#sign_up_modal').hasClass('in')){
                    console.log("Escape pressed : Modal Open. Now Closing it");
                    $('#sign_up_modal').modal('toggle');

                }else{
                    console.log("Escape pressed : Modal Already Closed");
                }

            }
        });
    });


    function extractForm_1_Values(){
        var username = u_name.val();
        var entered_pass = e_pass.val();
        var confirm_pass = c_pass.val();
        if(username == "" || username == null || username == undefined){
            throw "Username cannot be left blank";
        }
        if(entered_pass == "" || entered_pass == null || entered_pass == undefined){
            throw "Password cannot be left blank";
        }
        if(confirm_pass == "" || confirm_pass == null || confirm_pass == undefined){
            throw "Confirm Password cannot be left blank";
        }

        if(confirm_pass != entered_pass){
            throw "Both Passwords do not match";
        }
        console.log("Username : " + username + " -- Password : " + entered_pass + " -- Confirm Pass : " + confirm_pass);
    }
    sign_up_form.submit(function(){
        console.log("Sign up button Clicked");
        form1_error.addClass('hidden');
        form1_error.text('');
        try{
            extractForm_1_Values();
        }catch(e){
            form1_error.text(e);
            form1_error.removeClass('hidden');
            return false;
        }
    });

    var login_form = $("#login");
    var login_name = $("#login_name");
    var login_pass = $("#login_pass");
    var form2_error = $("#form2-error-message");

    function extractForm_2_Values(){
        var username = login_name.val();
        var entered_pass = login_pass.val();

        if(username == "" || username == null || username == undefined){
            throw "Username cannot be left blank";
        }

        if(entered_pass == "" || entered_pass == null || entered_pass == undefined){
            throw "Password cannot be left blank";
        }
        console.log("Login form values : ");
        console.log("Username : " + username + " -- Password : " + entered_pass);
    }
    login_form.submit(function(){
        console.log("Login button Clicked");
        form2_error.addClass('hidden');
        form2_error.text('');
        try{
            extractForm_2_Values();
        }catch(e){
            form2_error.text(e);
            form2_error.removeClass('hidden');
            return false;
        }
    });


})(jQuery);

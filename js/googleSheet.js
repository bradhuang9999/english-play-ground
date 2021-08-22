var settingUtil = (()=>{
  var thisUtil = {};
  thisUtil.settingSave = function() {
    if(document.getElementById('inputApiKey').value!==localStorage.getItem("vocApiKey")) {
      localStorage.setItem("vocApiKey", document.getElementById('inputApiKey').value);
      //initClient();//initial again if ApiKey changed
    }
    
    localStorage.setItem("vocSpreadsheetId", document.getElementById('inputVocSpreadsheetId').value);
    localStorage.setItem("vocSheetName", document.getElementById('inputVocSheetName').value);
    localStorage.setItem("vocSheetId", document.getElementById('inputVocSheetId').value);

    msgUtil.showSuccess('Save Successful');
  };

  thisUtil.settingLoad = function() {
    document.getElementById('inputApiKey').value = localStorage.getItem("vocApiKey");
    document.getElementById('inputVocSpreadsheetId').value = localStorage.getItem("vocSpreadsheetId");
    document.getElementById('inputVocSheetName').value = localStorage.getItem("vocSheetName");
    document.getElementById('inputVocSheetId').value = localStorage.getItem("vocSheetId");
  };

  thisUtil.getApiKey = function() {
    return document.getElementById('inputApiKey').value;
  };

  thisUtil.getSpreadsheetId = function() {
    return document.getElementById('inputVocSpreadsheetId').value;
  };

  thisUtil.getVocSheetName = function() {
    return document.getElementById('inputVocSheetName').value;
  };

  thisUtil.getVocSheetId = function() {
    return document.getElementById('inputVocSheetId').value;
  };

  thisUtil.settingLoad();//Init and load setting
  
  return thisUtil;
})();

// Client ID and API key from the Developer Console
      var CLIENT_ID = '273088253477-n1qrqu3r5avhrt9k8kbhf6dqvdst9l4v.apps.googleusercontent.com';
      
      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

      var authorizeButton = document.getElementById('authorize_button');
      var signoutButton = document.getElementById('signout_button');

      /**
       *  On load, called to load the auth2 library and API client library.
       */
      function handleClientLoad() {
        if(settingUtil.getApiKey()!=='') {
          gapi.load('client:auth2', initClient);
        }
      }

      /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */
      function initClient() {
        gapi.client.init({
          apiKey: settingUtil.getApiKey(),
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(function () {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          authorizeButton.onclick = handleAuthClick;
          signoutButton.onclick = handleSignoutClick;
        }, function(error) {
          $('#textStatus').html(JSON.stringify(error, null, 2));
        });
      }

      /**
       *  Called when the signed in status changes, to update the UI
       *  appropriately. After a sign-in, the API is called.
       */
      function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
          authorizeButton.style.display = 'none';
          signoutButton.style.display = 'block';
          //listMajors();
          //loadMySheetData();
          $('btn-need-login').show();
        } else {
          authorizeButton.style.display = 'block';
          signoutButton.style.display = 'none';
        }
      }

      /**
       *  Sign in the user upon button click.
       */
      function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
      }

      /**
       *  Sign out the user upon button click.
       */
      function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
      }

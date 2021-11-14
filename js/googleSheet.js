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

    localStorage.setItem("engVoiceVal", selectEngVoice.selectedIndex);
    localStorage.setItem("localVoiceVal", selectLocalVoice.selectedIndex);

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


var sheetUtil = (()=>{
  var thisUtil = {};
  thisUtil.isSignedIn = false;

  // Client ID and API key from the Developer Console
  var CLIENT_ID = '273088253477-n1qrqu3r5avhrt9k8kbhf6dqvdst9l4v.apps.googleusercontent.com';
      
  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

  var authorizeButton = document.getElementById('btnAuthorize');
  var signoutButton = document.getElementById('btnSignout');

  /**
   *  On load, called to load the auth2 library and API client library.
   */
   thisUtil.handleClientLoad = function() {
    if(settingUtil.getApiKey()!=='') {
      gapi.load('client:auth2', initClient);
    }
  }

  thisUtil.onSigned = function() {};

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
  function updateSigninStatus(parmIsSignedIn) {
    thisUtil.isSignedIn = parmIsSignedIn;
    if (parmIsSignedIn) {
      authorizeButton.style.display = 'none';
      signoutButton.style.display = 'block';
      //listMajors();
      //loadMySheetData();
      $('btn-need-login').show();
      if(thisUtil.onSigned) {
        thisUtil.onSigned();
      }
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

  /**
   * convert column num [1,2,3] to [A,B,C]
   */
  thisUtil.colNumToChar = function(colNum) {
    return String.fromCharCode(64+colNum);
  }

  thisUtil.getIndexedTable = function(sheetName) {
    let sheetNameTransform = 'sheet_' + sheetName.replaceAll(' ', '_');
    
    if(db[sheetNameTransform]===undefined) {
      let tableInfo = {};
      tableInfo[sheetNameTransform] = '&rowNum, rowInfo'
      db.version(1).stores(tableInfo);
    }
    
    return db.table(sheetNameTransform);
  }  

  

  thisUtil.loadSheetData = async function(spreadsheetId, sheetName, range) {
    var indexedTable = thisUtil.getIndexedTable(sheetName);
    var rowDataList = await indexedTable.orderBy('rowNum').toArray();
    return rowDataList;
  }

  thisUtil.syncSheetData = async function(spreadsheetId, sheetName, range) {
    var response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    }); 

    var indexedTable = thisUtil.getIndexedTable(sheetName);
    await indexedTable.clear();
    var range = response.result;
    for (let rowNum = 1; rowNum < range.values.length; rowNum++) {
      const rowInfo = range.values[rowNum-1];
      await indexedTable.add({rowNum:rowNum, rowInfo:rowInfo});
    }
    msgUtil.showSuccess("syncSheetData");
  }

  /**
   * Sync Part Start
   */
   const db = new Dexie('sheetData');

   // Declare tables, IDs and indexes
   db.version(1).stores({
     syncQueue: '++id, syncDate, syncType, syncInfo'
   });
 
  thisUtil.addSyncQueue = async function(syncInfo) {
    await db.syncQueue.add({syncDate:(new Date()), syncType:syncInfo.syncType, syncInfo:syncInfo})
    thisUtil.showSyncQueueNum();   
  }

  thisUtil.showSyncQueueNum = async function() {
    var queueNum = await db.syncQueue.count();
    if(queueNum!==0) {
      $("#btnSync").find('.badge').text(queueNum);
    }
    else {
      $("#btnSync").find('.badge').text('');
    }
  }

  thisUtil.syncByQueue = async function() {
    var syncList = await db.syncQueue.orderBy('id').toArray();
    for(let syncListEle of syncList) {
      let syncInfo = syncListEle.syncInfo;
      console.log(syncListEle);
      if(syncListEle.syncType === 'U') {
        var updateResult = await thisUtil.updateByIndex(syncInfo.spreadsheetId, syncInfo.sheetName, syncInfo.indexColumn, syncInfo.searchValue, syncInfo.updateColFm, syncInfo.updateColTo, syncInfo.setValueArr);
        if(updateResult!=null) {//代表更新成功
          await db.syncQueue.delete(syncListEle.id);
          thisUtil.showSyncQueueNum();
        }
      }
    }
    
  }

  /**
   * Idea from https://www.py4u.net/discuss/610987
   * @param {*} spreadsheetId 
   * @param {*} sheetName 
   * @param {*} indexColumn 
   * @param {*} searchValue 
   * @param {*} updateColFm 
   * @param {*} updateColTo 
   * @param {*} setValueArr 
   * @returns 
   * @example: updateByIndex(settingUtil.getSpreadsheetId(), settingUtil.getVocSheetName(), "B", "lope", "E", "F", ["11/8/2021 20:30:14", 5])
   */
   thisUtil.updateByIndex = async function(spreadsheetId, sheetName, indexColumn, searchValue, updateColFm, updateColTo, setValueArr) {
    try {
      var resource = {
        spreadsheetId: spreadsheetId,
        valueInputOption: "USER_ENTERED",
        includeValuesInResponse: true,
        responseValueRenderOption: "FORMATTED_VALUE",
        data: [
          {
            "range": "LOOKUP_SHEET!A1",
            "values": [
              [
                `=MATCH("${searchValue}", ${sheetName}!${indexColumn}:${indexColumn}, 0)`
              ]
            ]
          }
        ]
      };
      
      var response = await gapi.client.sheets.spreadsheets.values.batchUpdate(resource); 
      var targetRowNum = response.result.responses[0].updatedData.values[0];
  
      resource = {
        spreadsheetId: spreadsheetId,
        valueInputOption: "USER_ENTERED",
        includeValuesInResponse: true,
        responseValueRenderOption: "FORMATTED_VALUE",
        data: [
          {
            "range": `${sheetName}!${updateColFm}${targetRowNum}:${updateColTo}${targetRowNum}`,
            "values": [
              setValueArr
            ]
          }
        ]
      }
      var response = await gapi.client.sheets.spreadsheets.values.batchUpdate(resource); 
      return response.result.responses[0];
    }
    catch(e) {
      msgUtil.showError(e.toString());
    }
  }

  /**
   * Sync Part End
   */
  

  return thisUtil;
})();      
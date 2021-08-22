$('btn-need-login').hide();
$(document).ready(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.installing; // the installing worker, or undefined
      reg.waiting; // the waiting worker, or undefined
      reg.active; // the active worker, or undefined
    
      reg.addEventListener('updatefound', () => {
        // A wild service worker has appeared in reg.installing!
        const newWorker = reg.installing;
    
        newWorker.state;
        // "installing" - the install event has fired, but not yet complete
        // "installed"  - install complete
        // "activating" - the activate event has fired, but not yet complete
        // "activated"  - fully active
        // "redundant"  - discarded. Either failed install, or it's been
        //                replaced by a newer version
    
        newWorker.addEventListener('statechange', () => {
          msgUtil.showInfo('newWorker.state:'+newWorker.state);
        });
      });
    });
  }

  
  registerEvent();
  registerHelper();
  errorHandler();
  
  if(settingUtil.getApiKey()==='') {
    navUtil.navSettingShow();
  }
  else {
    navUtil.navVocabularyShow();
  }
  
});

function registerHelper() {
  Handlebars.registerHelper('eq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
}

function registerEvent() {
  
  document.getElementById("btnSettingSave").onclick = settingUtil.settingSave;

  document.getElementById("btnLoadVoc").onclick = loadVocabularyList;
  document.getElementById("btnPlay").onclick = playMp3List;
  document.getElementById("btnReload").onclick = reload;

  var divVocabularyList = $('#divVocabularyList');
  divVocabularyList.on('show.bs.collapse','.collapse', function() {
    divVocabularyList.find('.collapse.show').collapse('hide');
  });

  document.getElementById("navVocabulary").onclick = navUtil.navVocabularyShow;
  document.getElementById("navSetting").onclick = navUtil.navSettingShow;

  document.getElementById("btnSync").onclick = async () => {
    try {
      //await spendDataUtil.sendUnsendData();
      //spendDataUtil.showUnsendStatus();
    }
    catch(e) {
      msgUtil.showWarn('Save fail');
    }
  };
}


  
  var columnMap = {};
  (function() {
      columnMap.phrase = 1;
      columnMap.sentence = 2;
      columnMap.createDate = 3;
      columnMap.lastReviewDate = 4;
      columnMap.rememberSeq = 5;
      columnMap.needReview = 6;
      columnMap.pronunciation = 7;
      columnMap.pronunciationMp3 = 8;
      columnMap.definition = 9;
      columnMap.connection = 10;
      columnMap.morphology = 11;
      columnMap.translation = 12;
      columnMap.frq         = 13;
      columnMap.dictionaryLink = 14;
      columnMap.apiResponse = 15;
      columnMap.etymology = 16;
      columnMap.wordApiResponse = 17;
  })();
  
  var sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  var readText = function(text, lang) {
    return new Promise(function(resolve, reject) {
      var msg = new SpeechSynthesisUtterance();
      msg.text = text;
      msg.onend = resolve;
      msg.volume = 1;
      if(lang) {
        msg.lang = lang;   
      }
      window.speechSynthesis.speak(msg);
    });
  };
  
  var myAudio = document.createElement('audio');
  myAudio.addEventListener("loadstart", function() {
    document.getElementById('textStatus').innerText = 'loadstart';
  }); 
  myAudio.addEventListener("loadeddata", function() {
    document.getElementById('textStatus').innerText = 'loadeddata';
  }); 
  
    myAudio.volume = 0.5;
    var playMp3 = function(url) {
      return new Promise(function(resolve, reject) {
          try{
            if (!myAudio.canPlayType('audio/mpeg')) {
              alert('not support mp3');
              return;
            }
            myAudio.setAttribute('src', url);
            myAudio.addEventListener("ended", resolve, { once: true }); 
            myAudio.addEventListener("error", () => reject('Play MP3 error'), { once: true }); 
            myAudio.play();
          }
          catch(e) {
              console.error(e);
              reject();
          }
      });
    };
  
  var shuffleArr = function(array) {
    var currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }
  
  var playing = false;
  var playMp3List = async function() {
      playing = !playing;
      if(!playing) {
        document.getElementById("btnPlay").innerText = 'Play';
        return;
      }
      else {
        document.getElementById("btnPlay").innerText = 'Stop';
      }
      
      var noSleep = new NoSleep();
      noSleep.enable();
      for (const vocabularyInfo of vocabularyArr) {
        try {
          document.getElementById('textNowPlaying').innerText = vocabularyInfo.phrase;
          document.getElementById('textTranslation').innerText = vocabularyInfo.translation;

          document.getElementById(vocabularyInfo.phrase + 'VocBtn').focus();
          document.getElementById(vocabularyInfo.phrase + 'VocBtn').click();
          
          await playMp3(vocabularyInfo.pronunciationMp3);
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;
          await readText(vocabularyInfo.translation, 'zh-TW');
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;
        }
        catch(e) {
          console.error(e);
        }
      }

      playing = false;
      document.getElementById("btnPlay").innerText = 'Play';
      noSleep.disable();
  }  
  
  /**
   * 清除快取
   */
  function reload() {
    var spreadsheetId = '13fG3xpumfYRSjWPgDSIh0HIHdaqERxM-b2neeDsZlzU';
    var range = 'Vocabulary!A2:R';
    var todayStr = dateFns.format(new Date(), "YYYYMMDD");
    var timeKey = spreadsheetId + '_' + range + '_time';
    var dataKey = spreadsheetId + '_' + range + '_data';
    localStorage.removeItem(timeKey);
    localStorage.removeItem(dataKey);
  }

  async function loadGoogleSheetDataFromCache(spreadsheetId, range) {
    var todayStr = dateFns.format(new Date(), "YYYYMMDD");
    var timeKey = spreadsheetId + '_' + range + '_time';
    var dataKey = spreadsheetId + '_' + range + '_data';
    if(localStorage.getItem(timeKey) === todayStr) {
      var dataSheet = JSON.parse(localStorage.getItem(dataKey));
      return dataSheet;
    }
    //else if(isLocalhost()) {
    //  return localTestData();
    //}
    else {
      var response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      }); 
  
      var range = response.result; 
      localStorage.setItem(dataKey, JSON.stringify(range.values));
      localStorage.setItem(timeKey, todayStr);
      return range.values;
    }
  }

  var vocabularyArr;
  async function loadVocabularyList() {
    try {
      var spreadsheetId = settingUtil.getSpreadsheetId();
      var range = settingUtil.getVocSheetName()+'!A2:R';
      var sheetData = await loadGoogleSheetDataFromCache(spreadsheetId, range)
      
      let sortMode = $('[name=btnSortMode]:checked').val();
      let filterMode = $('[name=btnFilterMode]:checked').val();
      vocabularyArr = [];

      var getCellVal = function(row, columnIdx) {
        return row[columnIdx-1];
      }

      for(let row of sheetData) {
        let phrase = getCellVal(row, columnMap.phrase);
        let pronunciationMp3 = getCellVal(row, columnMap.pronunciationMp3);
        let translation = getCellVal(row, columnMap.translation).split('\n')[0];//.replace(/\n/gi, ' ');
        if(translation.startsWith('n.')) {
          translation = "名詞 " + translation.substring(2);
        }
        else if(translation.startsWith('nc.')) {
          translation = "可數名詞 " + translation.substring(2);
        }
        else if(translation.startsWith('nuc.')) {
          translation = "不可數名詞 " + translation.substring(2);
        }
        else if(translation.startsWith('v.')) {
          translation = "動詞 " + translation.substring(2);
        }
        
        if(pronunciationMp3==='') {
          continue;
        }

        let needReview     = getCellVal(row, columnMap.needReview);
        let lastReviewDate = getCellVal(row, columnMap.lastReviewDate);
        let rememberSeq    = getCellVal(row, columnMap.rememberSeq);

        if(filterMode==='none') {//沒有filter
        }
        else if(filterMode==='needReview') {
          if(needReview==="FALSE") {//只播放要review的
            continue;
          }
        }
        else if(filterMode==='notRemember') {
          if(rememberSeq!=="0") {
            continue;
          }
          debugger;
        }

        //vocabularyArr.push([phrase, pronunciationMp3, translation, getCellVal(row2, columnMap.phrase), ]);
        vocabularyArr.push({phrase:phrase,
          pronunciationMp3:pronunciationMp3,
          translation:translation,
          sentence:getCellVal(row, columnMap.sentence),
          definition:getCellVal(row, columnMap.definition),
          connection:getCellVal(row, columnMap.connection),
        })
      }
        
      if(sortMode==='createdDate') {
        //預設就是以createdDate排序
      }
      else if(sortMode==='shuffle') {
        vocabularyArr = shuffleArr(vocabularyArr);
      }
      else if(sortMode==='alphabet'){
        vocabularyArr.sort(function(row1, row2) {
          if(row1.phrase > row2.phrase) {
            return 1;
          }
          else if(row1.phrase < row2.phrase) {
            return -1;
          }
          else {
            return 0;
          }
        });
      }
      else if(sortMode==='connection'){
        vocabularyArr.sort(function(row1, row2) {
          if(row1.connection > row2.connection) {
            return 1;
          }
          else if(row1.connection < row2.connection) {
            return -1;
          }
          else {
            return 0;
          }
        });
      }
      
      var templateStr = document.getElementById("templateVocabularyList").innerHTML;
      var templateObj = Handlebars.compile(templateStr);
      var rendered = templateObj(vocabularyArr);
      
      $('#divVocabularyList').html(rendered);
    }
    catch(e) {
      console.log(e);
    }
  }

  var navUtil = (()=>{
    var thisUtil = {};
  
    thisUtil.navVocabularyShow = function() {
      document.getElementById("navVocabulary").classList.add('active');
      document.getElementById("navSetting").classList.remove('active');
  
      document.getElementById("divVocabulary").classList.remove('d-none');
      document.getElementById("divSetting").classList.add('d-none');
  
      loadVocabularyList();
    };
  
    thisUtil.navSettingShow = function() {
      document.getElementById("navVocabulary").classList.remove('active');
      document.getElementById("navSetting").classList.add('active');
  
      document.getElementById("divVocabulary").classList.add('d-none');
      document.getElementById("divSetting").classList.remove('d-none');
    };
  
    return thisUtil;
  })();  
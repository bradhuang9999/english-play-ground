var synth = window.speechSynthesis;
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

  initVoiceList();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = initVoiceList;
  }
  registerEvent();
  registerHandleBarHelper();
  errorHandler();
  
  if(settingUtil.getApiKey()==='') {
    navUtil.navSettingShow();
  }
  else {
    navUtil.navVocabularyShow();
  }
  
});

function registerHandleBarHelper() {
  Handlebars.registerHelper('eq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('wrap', function(arg1) {
    return arg1.replaceAll(`\n`, '\n<br>')    ;
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
  divVocabularyList.on('shown.bs.collapse', function(e) {
    //debugger;
    //$(e.target).prev()[0].focus();
  });

  document.getElementById("navVocabulary").onclick = navUtil.navVocabularyShow;
  document.getElementById("navSetting").onclick = navUtil.navSettingShow;
  document.getElementById("selectEngVoice").onchange = setEngVoice;
  document.getElementById("selectLocalVoice").onchange = setLocalVoice;

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

var voices = [];
var selectEngVoice = document.getElementById('selectEngVoice');
var selectLocalVoice = document.getElementById('selectLocalVoice');
var engVoice, localVoice;
function initVoiceList() {
  voices = synth.getVoices().sort(function (a, b) {
      const aname = a.name.toUpperCase(), bname = b.name.toUpperCase();
      if ( aname < bname ) return -1;
      else if ( aname == bname ) return 0;
      else return +1;
  });

  if(voices.length===0) {
    return;
  }

  var selectedIndex = selectEngVoice.selectedIndex < 0 ? 0 : selectEngVoice.selectedIndex;
  selectEngVoice.innerHTML = '';
  selectLocalVoice.innerHTML = '';
  var optionHtml = '';
  for(let voice of voices) {
    optionHtml += `\n<option data-lang='${voice.lang}' data-name='${voice.name}'>${voice.name + ' (' + voice.lang + ')' + (voice.default?' -- DEFAULT':'')}</option>`
  }

  selectEngVoice.innerHTML = optionHtml;
  selectLocalVoice.innerHTML = optionHtml;
  selectEngVoice.selectedIndex = localStorage.getItem("engVoiceVal")||0;
  selectLocalVoice.selectedIndex = localStorage.getItem("localVoiceVal")||0;
  setEngVoice();
  setLocalVoice();
}

function setEngVoice() {
  engVoice = voices[selectEngVoice.selectedIndex];
}

function setLocalVoice() {
  localVoice = voices[selectLocalVoice.selectedIndex];
}
  
  var columnMap = {};
  (function() {
    columnMap.chapter = 1;
    columnMap.phrase = 2;
    columnMap.sentence = 3;
    columnMap.createDate = 4;
    columnMap.lastReviewDate = 5;
    columnMap.rememberSeq = 6;
    columnMap.needReview = 7;
    columnMap.pronunciation = 8;
    columnMap.pronunciationMp3 = 9;
    columnMap.definition = 10;
    columnMap.connection = 11;
    columnMap.morphology = 12;
    columnMap.translation = 13;
    columnMap.frq         = 14;
    columnMap.dictionaryLink = 15;
    columnMap.apiResponse = 16;
    columnMap.etymology = 17;
    columnMap.wordApiResponse = 18;
  })();
  
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
  

  /**
   * 念出文字
   * 範例：https://mdn.github.io/web-speech-api/speak-easy-synthesis/
   * @param {*} option 
   * @returns 
   */
  var readText = function(option) {
    return new Promise(function(resolve, reject) {
      var msg = new SpeechSynthesisUtterance();
      msg.text = option.text;
      msg.onend = resolve;
      msg.volume = option.volume || 1;
      if(option.lang) {
        msg.lang = option.lang;   
      }
      if(option.rate) {
        msg.rate = option.rate;   
      }
      if(option.voice) {
        msg.voice = option.voice;
      }
      synth.speak(msg);
    });
  };
  
  
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
      
      var openedPhrase = $('#divVocabularyList .row.show [name=phrase]').val();//目前展開的單字，等一下從這一個開始
      var vocIdxFm = 0;
      if(openedPhrase!==undefined) {
        for(let vocIdx=0;vocIdx<vocabularyArr.length;vocIdx++) {
            const vocabularyInfo = vocabularyArr[vocIdx];
            if(vocabularyInfo.phrase===openedPhrase) {
              vocIdxFm = vocIdx;
            }
        }
      }

      var noSleep = new NoSleep();
      noSleep.enable();
      for(let vocIdx=vocIdxFm;vocIdx<vocabularyArr.length;vocIdx++) {
        try {
          const vocabularyInfo = vocabularyArr[vocIdx];
          //document.getElementById('textNowPlaying').innerText = vocabularyInfo.phrase;
          //document.getElementById('textTranslation').innerText = vocabularyInfo.translation;

          document.getElementById(vocabularyInfo.phrase + 'VocBtn').click();
          //document.getElementById(vocabularyInfo.phrase + 'VocBtn').focus();
          
          let spellRead = vocabularyInfo.phrase.split('').join(',');
          await readText({text:spellRead, rate:0.7});
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;

          await playMp3(vocabularyInfo.pronunciationMp3);
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;

          await readText({text:vocabularyInfo.phrase, lang:'en-US', voice:engVoice});
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;

          
          await readText({text:vocabularyInfo.translation, lang:'zh-TW', voice:localVoice});
          if(!playing) break;
          await sleep(2000);
          if(!playing) break;

        }
        catch(e) {
          msgUtil.showError(e.toString());
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
    var spreadsheetId = settingUtil.getSpreadsheetId();
    var range = settingUtil.getVocSheetName()+'!A2:S';
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
      var range = settingUtil.getVocSheetName()+'!A2:S';
      var sheetData = await loadGoogleSheetDataFromCache(spreadsheetId, range)
      
      let sortMode = $('[name=btnSortMode]:checked').val();
      let filterMode = $('[name=btnFilterMode]:checked').val();
      vocabularyArr = [];

      var getCellVal = function(row, columnIdx) {
        return row[columnIdx-1]||'';
      }

      for(let row of sheetData) {
        let phrase = getCellVal(row, columnMap.phrase);
        if(phrase==='') {
          continue;
        }
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

      var sortFunc = function(sortCol) {
        return function(row1, row2) {
          if(row1[sortCol] > row2[sortCol]) {
            return 1;
          }
          else if(row1[sortCol] < row2[sortCol]) {
            return -1;
          }
          else {
            return 0;
          }
        }
      };
        
      if(sortMode==='original'){
        //如果是原本的排序，那就不用排序
      }
      else if(sortMode==='createdDate') {
        //預設就是以createdDate排序
        vocabularyArr.sort(sortFunc('createdDate'));
      }
      else if(sortMode==='shuffle') {
        vocabularyArr = shuffleArr(vocabularyArr);
      }
      else if(sortMode==='alphabet'){
        /*
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
        */
        vocabularyArr.sort(sortFunc('phrase'));
      }
      else if(sortMode==='connection'){
        /*
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
        */
        vocabularyArr.sort(sortFunc('connection'));
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
window.onload = function() {
    document.getElementById("btnPlay").onclick = loadMySheetData;
  }
  
  var columnMap = {};
  function initColumnMap() {
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
  }
  
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
  var playMp3List = async function(mp3Arr) {
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
      for (const mp3Info of mp3Arr) {
        try {
          document.getElementById('textNowPlaying').innerText = mp3Info[0];
          document.getElementById('textTranslation').innerText = mp3Info[2];
          await playMp3(mp3Info[1]);
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;
          await readText(mp3Info[2], 'zh-TW');
          if(!playing) break;
          await sleep(1000);
          if(!playing) break;
        }
        catch(e) {
          console.error(e);
        }
      }
      noSleep.disable();
  }  
  
  async function loadGoogleSheetDataFromCache(spreadsheetId, range) {
    var todayStr = dateFns.format(new Date(), "YYYYMMDD");
    var timeKey = spreadsheetId + '_' + range + '_time';
    var dataKey = spreadsheetId + '_' + range + '_data';
    if(localStorage.getItem(timeKey) === todayStr) {
      var dataSheet = JSON.parse(localStorage.getItem(dataKey));
      return dataSheet;
    }
    else {
      var response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      }); 
  
      var mp3Arr = [];
      var range = response.result; 
      localStorage.setItem(dataKey, JSON.stringify(range.values));
      localStorage.setItem(timeKey, todayStr);
      return range;
    }
  }

  async function loadMySheetData() {
    initColumnMap();
    try {
      var spreadsheetId = '13fG3xpumfYRSjWPgDSIh0HIHdaqERxM-b2neeDsZlzU';
      var range = 'Vocabulary!A2:R';
      debugger;
      var sheetData = await loadGoogleSheetDataFromCache(spreadsheetId, range)
      
      for(let row of sheetData) {
        let phrase = row[columnMap.phrase-1];
        let pronunciationMp3 = row[columnMap.pronunciationMp3-1];
        let translation = row[columnMap.translation-1].split('\n')[0];//.replace(/\n/gi, ' ');
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
    
        let needReview = row[columnMap.needReview-1];
        if(!needReview) {//只播放要review的
          continue;
        }
        if(pronunciationMp3==='') {
          continue;
        }

        mp3Arr.push([phrase, pronunciationMp3, translation]);
      }
      
      mp3Arr = shuffleArr(mp3Arr);
      playMp3List(mp3Arr);
    }
    catch(e) {
      console.log(e);
    }
  }

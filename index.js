$('btn-need-login').hide();
window.onload = function() {
    document.getElementById("btnPlay").onclick = loadMySheetData;
    document.getElementById("btnReload").onclick = loadMySheetData;
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
    else if(isLocalhost()) {
      return localTestData();
    }
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

  async function loadMySheetData() {
    initColumnMap();
    try {
      var spreadsheetId = '13fG3xpumfYRSjWPgDSIh0HIHdaqERxM-b2neeDsZlzU';
      var range = 'Vocabulary!A2:R';
      debugger;
      var sheetData = await loadGoogleSheetDataFromCache(spreadsheetId, range)
      
      var mp3Arr = [];
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
  
  function localTestData() {
    return [
      [
          "shelve",
          "The First Nome's library was like Amos's, but a hundred times bigger, with circular rooms lined with honeycomb shelves that seemed to go on forever, like the world's largest beehive.\nSome were stacked on tables or stuffed into smaller shelves.",
          "7/27/2021 0:31:54",
          "7/30/2021 9:31:36",
          "1",
          "TRUE",
          "ʃɛlv",
          "http://res.iciba.com/resource/amp3/oxford/0/f9/11/f911a38ea4d49b5f10dc3aaf02e6ce15.mp3",
          "v. If someone shelves a plan or project, they decide not to continue with it, either for a while or permanently.\nv. If an area of ground next to or under the sea shelves, it slopes downwards.\nShelves is the plural of shelf .",
          "",
          "verb, verbal use of shelve(s) 1585–95\n1580–90; origin, originally uncertain; compare Frisian skelf not quite level",
          "v. 擱置，停止執行，暫不進行(計劃、項目)\nv. (近海或海底陸地)向下傾斜,成斜坡\n(shelf 的複數)",
          "15772",
          "Link",
          "",
          "",
          "{\"word\":\"shelve\",\"results\":[{\"definition\":\"hold back to a later time\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"defer\",\"hold over\",\"postpone\",\"prorogue\",\"put off\",\"put over\",\"remit\",\"set back\",\"table\"],\"entails\":[\"scratch\",\"reschedule\",\"cancel\",\"call off\",\"scrub\"],\"typeOf\":[\"delay\"],\"hasTypes\":[\"suspend\",\"hold\",\"probate\",\"reprieve\",\"respite\",\"call\"],\"derivation\":[\"shelver\"]},{\"definition\":\"place on a shelf\",\"partOfSpeech\":\"verb\",\"typeOf\":[\"pose\",\"set\",\"position\",\"place\",\"put\",\"lay\"],\"derivation\":[\"shelver\"],\"examples\":[\"shelve books\"]}],\"syllables\":{\"count\":1,\"list\":[\"shelve\"]},\"pronunciation\":{\"all\":\"ʃɛlv\"},\"frequency\":2.2}"
      ],
      [
          "flare",
          "Desjardins' nostrils flared, but the old dude, Iskandar, just chuckled, and said something else in that other language.\nSet's nostrils flared.",
          "7/27/2021 0:31:44",
          "7/31/2021 8:45:46",
          "1",
          "TRUE",
          "flɜr",
          "http://res.iciba.com/resource/amp3/0/0/95/b0/95b05fbb1aa74c04ca2e937d43a05f6f.mp3",
          "nc. A flare is a small device that produces a bright flame. Flares are used as signals, for example on ships.\nv. If a fire flares, the flames suddenly become larger.\nv. If something such as trouble, violence, or conflict flares, it starts or becomes more violent.\nv. If people's tempers flare, they get angry.\nv. If someone's nostrils flare or if they flare them, their nostrils become wider, often because the person is angry or upset.\nv. If something such as a dress flares, it spreads outwards at one end to form a wide shape.\nnpl. Flares are trousers that are very wide at the bottom.\nPHRASAL VERB If a disease or injury flares up, it suddenly returns or becomes painful again.",
          "",
          "1540–50; origin, originally meaning: spread out, said of hair, a ship's sides, etc; compare Old English flǣre either of the spreading sides at the end of the nose",
          "nc. 閃光信號燈;照明彈\nv. (火)突然燒旺，突然熊熊燃燒\nv. (麻煩、暴亂、衝突等)加劇，升級，愈演愈烈\nv. 發怒;發火\nv. (常因氣憤或難過而)張大(鼻孔),(鼻孔)張開\nv. (連衣裙等)底部展開，呈喇叭形展開\nnpl. 喇叭褲\nPHRASAL VERB (疾病、傷勢)突然復發，突然惡化",
          "8467",
          "Link",
          "",
          "",
          "{\"word\":\"flare\",\"results\":[{\"definition\":\"erupt or intensify suddenly\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"break open\",\"burst out\",\"erupt\",\"flare up\",\"irrupt\"],\"typeOf\":[\"deepen\",\"intensify\"],\"examples\":[\"Tempers flared at the meeting\"]},{\"definition\":\"a short forward pass to a back who is running toward the sidelines\",\"partOfSpeech\":\"noun\",\"synonyms\":[\"flare pass\"],\"typeOf\":[\"aerial\",\"forward pass\"],\"examples\":[\"he threw a flare to the fullback who was tackled for a loss\"]},{\"definition\":\"burn brightly\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"blaze up\",\"burn up\",\"flame up\"],\"typeOf\":[\"combust\",\"burn\"],\"examples\":[\"Every star seemed to flare with new intensity\"]},{\"definition\":\"a burst of light used to communicate or illuminate\",\"partOfSpeech\":\"noun\",\"synonyms\":[\"flash\"],\"typeOf\":[\"visual signal\"],\"hasTypes\":[\"very light\",\"very-light\",\"star shell\",\"bengal light\"]},{\"definition\":\"shine with a sudden light\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"flame\"],\"typeOf\":[\"beam\",\"shine\"],\"examples\":[\"The night sky flared with the massive bombardment\"]},{\"definition\":\"become flared and widen, usually at one end\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"flare out\"],\"typeOf\":[\"widen\"],\"examples\":[\"The bellbottom pants flare out\"]},{\"definition\":\"a shape that spreads outward\",\"partOfSpeech\":\"noun\",\"synonyms\":[\"flair\"],\"typeOf\":[\"shape\",\"form\"],\"examples\":[\"the skirt had a wide flare\"]},{\"definition\":\"a sudden eruption of intense high-energy radiation from the sun's surface; associated with sunspots and radio interference\",\"partOfSpeech\":\"noun\",\"synonyms\":[\"solar flare\"],\"typeOf\":[\"solar radiation\"]},{\"definition\":\"a device that produces a bright light for warning or illumination or identification\",\"partOfSpeech\":\"noun\",\"typeOf\":[\"device\"],\"hasTypes\":[\"fuzee\",\"fusee\"]},{\"definition\":\"am unwanted reflection in an optical system (or the fogging of an image that is caused by such a reflection)\",\"partOfSpeech\":\"noun\",\"typeOf\":[\"reflexion\",\"reflection\"]},{\"definition\":\"a sudden burst of flame\",\"partOfSpeech\":\"noun\",\"typeOf\":[\"fire\",\"flaming\",\"flame\"]},{\"definition\":\"a sudden outburst of emotion\",\"partOfSpeech\":\"noun\",\"typeOf\":[\"blowup\",\"gush\",\"outburst\",\"effusion\",\"ebullition\"],\"examples\":[\"she felt a flare of delight\",\"she could not control her flare of rage\"]},{\"definition\":\"a sudden recurrence or worsening of symptoms\",\"partOfSpeech\":\"noun\",\"typeOf\":[\"attack\"],\"examples\":[\"a colitis flare\",\"infection can cause a lupus flare\"]},{\"definition\":\"(baseball) a fly ball hit a short distance into the outfield\",\"partOfSpeech\":\"noun\",\"inCategory\":[\"baseball game\",\"ball\",\"baseball\"],\"typeOf\":[\"fly ball\",\"fly\"]},{\"definition\":\"reddening of the skin spreading outward from a focus of infection or irritation\",\"partOfSpeech\":\"noun\",\"typeOf\":[\"erythroderma\"]}],\"syllables\":{\"count\":1,\"list\":[\"flare\"]},\"pronunciation\":{\"all\":\"flɜr\"},\"frequency\":3.52}"
      ],
      [
          "soar",
          "The ceilings soared to twenty or thirty feet, so it didn't feel like we were underground.\nAt the edge of the palace, Isis turned into a small bird of prey and soared into the air.",
          "7/27/2021 0:31:34",
          "7/31/2021 8:46:20",
          "1",
          "TRUE",
          "soʊr",
          "http://res.iciba.com/resource/amp3/oxford/0/b3/61/b361cf4e96e21da6f3183e4d83084abc.mp3",
          "v. If the amount, value, level, or volume of something soars, it quickly increases by a great deal.\nv. If something such as a bird soars into the air, it goes quickly up into the air.\nv. Trees or buildings that soar upwards are very tall.\nv. If music soars, it rises greatly in volume or pitch.\nv. If your spirits soar, you suddenly start to feel very happy.",
          "",
          "Vulgar Latin *exaurāre, equivalent. to Latin ex- ex-1 + aur(a) air + -āre infinitive suffix\nMiddle French essorer\nMiddle English soren 1325–75",
          "v. (數量、價值、水平、規模等)急升，猛漲\nv. (鳥等)高飛，翱翔，升騰\nv. (樹木、建築等)高聳，屹立\nv. (音樂)音量猛地增大，音調陡然升高\nv. (情緒)高昂,高漲",
          "4707",
          "Link",
          "",
          "",
          "{\"word\":\"soar\",\"results\":[{\"definition\":\"rise rapidly\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"soar up\",\"soar upwards\",\"surge\",\"zoom\"],\"typeOf\":[\"lift\",\"come up\",\"arise\",\"go up\",\"move up\",\"rise\",\"uprise\"],\"hasTypes\":[\"wallow\",\"billow\"],\"examples\":[\"the dollar soared against the yen\"]},{\"definition\":\"fly by means of a hang glider\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"hang glide\"],\"entails\":[\"glide\"],\"typeOf\":[\"fly\",\"aviate\",\"pilot\"],\"derivation\":[\"soaring\"]},{\"definition\":\"fly a plane without an engine\",\"partOfSpeech\":\"verb\",\"synonyms\":[\"sailplane\"],\"inCategory\":[\"air travel\",\"aviation\",\"air\"],\"entails\":[\"fly\",\"aviate\",\"pilot\"],\"typeOf\":[\"glide\"],\"derivation\":[\"soaring\"]},{\"definition\":\"the act of rising upward into the air\",\"partOfSpeech\":\"noun\",\"synonyms\":[\"zoom\"],\"typeOf\":[\"ascending\",\"rise\",\"ascension\",\"ascent\"]},{\"definition\":\"fly upwards or high in the sky\",\"partOfSpeech\":\"verb\",\"typeOf\":[\"wing\",\"fly\"]},{\"definition\":\"go or move upward\",\"partOfSpeech\":\"verb\",\"typeOf\":[\"climb\",\"go up\",\"rise\"],\"examples\":[\"The stock market soared after the cease-fire was announced\"]}],\"syllables\":{\"count\":1,\"list\":[\"soar\"]},\"pronunciation\":{\"all\":\"soʊr\"},\"frequency\":3.15}"
      ]
  ]
  }
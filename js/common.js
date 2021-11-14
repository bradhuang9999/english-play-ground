var msgUtil = (()=>{
    var thisUtil = {};
  
    var showMsg = function(msgText, toastStyle) {    
      var msgHtml = `<div class="toast ${toastStyle}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-body">
        ${msgText}
      </div>
    </div>`;
      $('#divToastContainer').append(msgHtml);
      //var myToastEl = document.getElementById('myToastEl')
      
      var newToastDom = $('#divToastContainer .toast').last()[0];
      var newToast = new bootstrap.Toast(newToastDom);
      newToast.show();
      newToastDom.addEventListener('hidden.bs.toast', function () {
        newToastDom.remove();
      })
    };
  
    thisUtil.showSuccess = function(msgText) {
      showMsg(msgText, 'bg-success');
    };
  
    thisUtil.showInfo = function(msgText) {
      showMsg(msgText, 'bg-info');
    };
  
    thisUtil.showError = function(msgText) {
      showMsg(msgText, 'bg-danger');
    };
  
    thisUtil.showWarn = function(msgText) {
      showMsg(msgText, 'bg-warning');
    };
  
    return thisUtil
})();

function errorHandler() {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error(error);
    var string = msg.toLowerCase();
    var substring = "script error";
    //if (string.indexOf(substring) > -1){
    //  showMsg('Script Error: See Browser Console for Detail');
    //} else {
      var message = [
        'Message: ' + msg,
        'URL: ' + url,
        'Line: ' + lineNo,
        'Column: ' + columnNo,
        'Error object: ' + JSON.stringify(error)
      ].join(' - ');
  
      msgUtil.showError(message);
    //}
  
    return false;
  };
}  

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
  
var sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
// throttlers
let stream = null;
let rtc = null;
let iDBState = { running: false };
let socket = null;

function addUnthrottler(type) {
  clearUnthrottler();
  new Promise(resolve => {
    let target = document.getElementById('inframe');
    if (target && target.checked) {
      let f = document.createElement('iframe');
      f.src = "unthrottled.html";
      f.onload = _ => {
        resolve(f.contentWindow)
      };
      document.getElementById('container').appendChild(f);
    } else {
      resolve(this);
    }
  }).then(target => {
    switch(type) {
      case 'gUM':
        target.addUserMedia(); break;
      case 'rtc':
        target.addWebRTC(); break;
      case 'iDB':
        target.addIndexedDB(); break;
      case 'ws':
        target.addWebSocket(); break;
    }
  });
}

function clearUnthrottler() {
  stream = null;
  let close = document.getElementById('closeonclear').checked;
  if (rtc && close) {
    rtc.close()
  }
  rtc = null;
  let node = document.getElementById('container');

  if (!node) {
    return;
  }

  while (node.firstChild) {
    node.firstChild.remove();
  }

  iDBState.running = false;

  if (socket && close) {
    socket.close();
  }
  socket = null;
}

function addUserMedia() {
  navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(result => stream = result);
}

function addWebRTC() {
  rtc = new RTCPeerConnection();
}

function addIndexedDB() {
  iDBState.running = true;
  let req = indexedDB.open("testDB", 1);

  req.onupgradeneeded = e => {
    let db = e.target.result;
    let store = db.createObjectStore("testOS", {keyPath: "id"});
    let index = store.createIndex("index", ["col"]);
  };

  req.onsuccess = e => {
    let db = e.target.result;
    let tx = db.transaction("testOS", "readwrite");
    let store = tx.objectStore("testOS");
    let ctr = 0;

    tx.oncomplete = _ => {
      db.close();
    };

    tx.onerror = e => alert(e);

    iDBState.running = true;

    function putLoop() {
      if (!iDBState.running) {
        return;
      }

      let req = store.put({id: ctr++, col: "foo"});
      req.onsuccess = putLoop;
      req.onerror = e => alert(e);
    }

    putLoop();
  };
}

function addWebSocket() {
  socket = new WebSocket('wss://echo.websocket.org');
}

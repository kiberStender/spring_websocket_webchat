(function(){
  function select(str){
    return document.querySelector(str);
  }
  
  function alertMessage(message, type){
    let alerts = select("#alerts");

    let el = document.createElement("p")
    el.innerHTML = message
    el.classList.add(type)
    alerts.append(el)
    setTimeout(() => alerts.innerHTML = '', 5000)
  }
  
  function drawChat(chatUsername){
    return `<div class="row text-center">\n  <h3>Chat with ${chatUsername}</h3>\n</div>\n<div id="chat_messages_${chatUsername}" class="row"></div>\n<br/>\n<div class="row">\n  <div class="col-md-4"><textarea id="chat_input_${chatUsername}"></textarea></div>\n  <div class="col-md-1"><input type="button" id="chat_send_to_${chatUsername}" value="Send"/></div>\n</div>`
  }

  function getChat(chatList, chatName){
    let chatRoom = chatList.querySelector(`#chat_${chatName}`)
    if(chatRoom === null){
      let el = document.createElement("div")
      el.id = `chat_${chatName}`
      el.innerHTML = drawChat(chatName)
      el.classList.add('row')
      chatList.append(el)
      return el;
    } else {
      return chatRoom
    }
  }

  function clickSendButton(chatRoom, toWhom, stompClient, username) {
    chatRoom.querySelector(`#chat_send_to_${toWhom}`).addEventListener('click', () => {
      let msgInput = chatRoom.querySelector(`#chat_input_${toWhom}`)
      let msg = msgInput.value;

      if (msg && msg !== '') {
        stompClientSendMessage(stompClient, '/app/message', JSON.stringify({
          toWhom: toWhom,
          fromWho: username,
          message: msg
        }))
        let messages = chatRoom.querySelector(`#chat_messages_${toWhom}`);
        messages.innerHTML += `<div class="row"><div class="col-md-1">Me:</div><div class="col-md-8">${msg}</div></div>`
        msgInput.value = ''
      } else {
        alertMessage(`Message to user [${toWhom}] cannot be empty !!!`, "bg-danger")
      }
    }, true)
  }
  
  function displayMessage(chatList, stompClient, username, {fromWho, message}){
    let chatRoom = getChat(chatList, fromWho);
    let messages = chatRoom.querySelector(`#chat_messages_${fromWho}`);
    messages.innerHTML += `<div class="row"><div class="col-md-1">${fromWho}:</div><div class="col-md-8">${message}</div></div>`

    clickSendButton(chatRoom, fromWho, stompClient, username)

  }

  function displayUserList(userList, chatList, username, stompClient){
    const lis = userList.length === 0 ? "It looks like you are the only one in the chat room !!!" : userList
        .reduce((acc, item) => `${acc}<li id="user_${item}"><a href="#chat_${item}">${item}</a></a></li>`, "")

    select("#chat_user_list").innerHTML = `<ul>${lis}</ul>`

    userList.forEach(item => select(`#chat_user_list #user_${item}`).addEventListener('click', () => {
      clickSendButton(getChat(chatList, item), item, stompClient, username);
    }, true))
  }
  
  function stompSubscribe(stompClient, endpoint, callback){
    stompClient.subscribe(endpoint, callback)
    return stompClient
  }
  
  function stompClientSendMessage(stompClient, endpoint, message){
    stompClient.send(endpoint, {}, message)
    return stompClient
  }
  
  function disconnect(stompClient, username, connectBtn, disconnectBtn, clicked = false){
    connectBtn.disabled = false
    disconnectBtn.disabled = true
    if(clicked){
      stompClientSendMessage(stompClient, '/app/unregister', username)
    }
    stompClient.disconnect()
  }
  
  function connect(username){
    return new Promise((resolve, reject) => {
      let stompClient = Stomp.over(new SockJS('/websocket-chat'))
      stompClient.connect({}, (frame) => resolve(stompClient))
    })
  }
  
  //To guarantee that our page is completely loaded before we execute anything
  window.addEventListener('load', function(event){
    let chatUsersList = [];
    let chatList = select("#chat_list");
    let connectButton = select("#webchat_connect");
    let disconnectButton = select("#webchat_disconnect");

    connectButton.addEventListener('click', () => {
      let username = select("#webchat_username").value;

      if(username == null || username === ''){
        alertMessage('Name cannot be empty!!!', 'bg-danger')
      } else {
        connect(username)
            .then((stompClient) => stompSubscribe(stompClient, '/user/queue/newMember', (data) => {
              chatUsersList = JSON.parse(data.body)
              if(chatUsersList.length > 0){
                displayUserList(chatUsersList.filter(x => x != username), chatList, username, stompClient)
              } else {
                alertMessage("Username already exists!!!", "bg-danger")
                disconnect(stompClient, username, connectButton, disconnectButton)
              }
            })).then((stompClient) => stompSubscribe(stompClient, '/topic/newMember', (data) => {
              chatUsersList.push(data.body);
              displayUserList(chatUsersList.filter(x => x != username), chatList, username, stompClient)
            })).then((stompClient) => stompClientSendMessage(stompClient, '/app/register', username))
            .then((stompClient) => stompSubscribe(stompClient, `/user/${username}/msg`, (data) => {
              displayMessage(chatList, stompClient, username, JSON.parse(data.body))
            }))
            .then((stompClient) => {
              connectButton.disabled = true;
              disconnectButton.disabled = false;
              disconnectButton.addEventListener('click', () => disconnect(stompClient, username, connectButton, disconnectButton, true), true);
              return stompClient;
            }).then((stompClient) => stompSubscribe(stompClient, '/topic/disconnectedUser', (data) => {
              const userWhoLeft = data.body;
              chatUsersList = chatUsersList.filter(x => x != userWhoLeft);
              displayUserList(chatUsersList.filter(x => x != username), chatList, username, stompClient);
              alertMessage(`User [${userWhoLeft}] left the chat room!!!`, "bg-success")
            }))
      }
      }, true)
  });
})();

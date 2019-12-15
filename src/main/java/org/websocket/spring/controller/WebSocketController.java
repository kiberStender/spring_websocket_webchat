package org.websocket.spring.controller;

import java.util.Set;
import java.util.HashSet;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {
  private final SimpMessagingTemplate simpMessagingTemplate;
  private final Set<String> connectedUsers;
  
  public WebSocketController(SimpMessagingTemplate simpMessagingTemplate){
    this.simpMessagingTemplate = simpMessagingTemplate;
    connectedUsers = new HashSet<>();
  }
  
  @MessageMapping("/register")
  @SendToUser("/queue/newMember")
  public Set<String> registerUser(String webChatUsername){
    if(!connectedUsers.contains(webChatUsername)) {
      connectedUsers.add(webChatUsername);
      simpMessagingTemplate.convertAndSend("/topic/newMember", webChatUsername);
      return connectedUsers;
    } else {
      return new HashSet<>();
    }
  }
  
  @MessageMapping("/unregister")
  @SendTo("/topic/disconnectedUser")
  public String unregisterUser(String webChatUsername){
    connectedUsers.remove(webChatUsername);
    return webChatUsername;
  }

  @MessageMapping("/message")
  public void greeting(WebSocketMessage message){
    simpMessagingTemplate.convertAndSendToUser(message.toWhom, "/msg", message);
  }
}

package org.websocket.spring.controller;

public class WebSocketMessage {
  public final String toWhom;
  public final String fromWho;
  public final String message;
  
  public WebSocketMessage(final String toWhom, final String fromWho, final String message){
    this.toWhom  = toWhom;
    this.fromWho = fromWho;
    this.message = message;
  }
}

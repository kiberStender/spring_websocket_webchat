package websocket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({"org.websocket.spring"})
public class Main {

  public static void main(String[] args) {
    SpringApplication.run(Main.class, args);
  }
}

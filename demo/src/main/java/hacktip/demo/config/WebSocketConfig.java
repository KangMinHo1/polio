package hacktip.demo.config;

import hacktip.demo.config.jwt.JwtStompInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 및 STOMP 설정을 위한 Configuration 클래스
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer { // 1. STOMP 메시지 브로커 기능을 활성화


    // 5. (추가) JwtStompInterceptor를 주입받음
    private final JwtStompInterceptor jwtStompInterceptor;


    /**
     * STOMP 접속 엔드포인트(Handshake)를 등록하는 메서드
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry){

        // 2. 클라이언트가 WebSocket에 접속할 때 사용할 엔드포인트를 "/ws-stomp"로 설정
        registry.addEndpoint("/ws-stomp")

        // 3. (중요) CORS 설정: 모든 Origin에서의 접속을 허용 (개발 초기 단계)
        //    (배포 시에는 실제 프론트엔드 도메인으로 제한해야 함)
            .setAllowedOriginPatterns("*");

        // (참고) SockJS는 WebSocket을 지원하지 않는
        //       구형 브라우저를 위한 대체(fallback) 옵션입니다.
        // .withSockJS();

    }

    /**
     * STOMP 메시지 브로커의 규칙을 설정하는 메서드
     */
    public void configureMessageBroker(MessageBrokerRegistry registry){

        // 4. (중요) "메시지 발행" 주소 규칙 (클라이언트 -> 서버)
        //    - 클라이언트가 "/app"으로 시작하는 주소로 메시지를 보내면,
        //      서버의 @MessageMapping 메서드가 이를 처리합니다.
        //    - (예: /app/chat/send)
        registry.setApplicationDestinationPrefixes("/app");

        // 5. (중요) "메시지 구독" 주소 규칙 (서버 -> 클라이언트)
        //    - "/topic", "/queue"로 시작하는 주소를 "구독" 중인 클라이언트들에게
        //      메시지를 브로드캐스팅(전달)합니다.
        //    - (예: /topic/room/123)
        registry.enableSimpleBroker("/topic", "/queue");
    }

    // 6. === [추가] WebSocket의 "Inbound Channel"에 인터셉터를 등록 ===
    /**
     * 클라이언트로부터 들어오는(Inbound) STOMP 메시지 채널을 구성
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration){
        // 7. (중요) preSend 채널에 우리가 만든 JwtStompInterceptor를 등록
        //    -> STOMP 메시지가 컨트롤러(@MessageMapping)에 도달하기 전에
        //       이 인터셉터가 먼저 실행되어 JWT 인증을 수행
        registration.interceptors(jwtStompInterceptor);
    }

}

package hacktip.demo.config.jwt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import hacktip.demo.security.UserDetailsServiceImpl;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtStompInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsServiceImpl; // UserDetailsService 주입

    /**
     * STOMP 메시지가 전송되기 전에 (preSend) 호출되는 메서드
     */

    public Message<?> preSend(Message<?> message, MessageChannel channel){
        // 1. StompHeaderAccessor로 메시지 헤더에 접근
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // 2. (핵심) STOMP의 CONNECT 명령일 때만 JWT 검증 수행
        if(StompCommand.CONNECT.equals(accessor.getCommand())){
            // 3. STOMP 헤더에서 "Authorization" 토큰 추출
            //    (클라이언트는 CONNECT 시 이 헤더에 "Bearer [token]"을 담아 보내야 함)
            String bearerToken = accessor.getFirstNativeHeader("Authorization");

            // 4. JwtAuthenticationFilter의 로직과 거의 동일
            String token = jwtTokenProvider.resolveToken(bearerToken);//토큰 꺼내기
            if(StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)){

                String email = jwtTokenProvider.getEmailFromToken(token);

                // 5. (중요) UserDetailsServiceImpl을 통해 UserDetails 객체를 가져옴
                UserDetails userDetails = userDetailsServiceImpl.loadUserByUsername(email);

                // 6. (매우 중요) UserDetails 객체를 사용하여 인증 객체 생성 후 WebSocket 세션에 저장
                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                //    이후 @MessageMapping에서 Principal로 이 정보를 꺼내 쓸 수 있음
                accessor.setUser(authentication);
                log.info("STOMP user authenticated: {}", email);
            } else{
                log.warn("STOMP connection attempt failed: Invalid JWT");
                // (선택) 인증 실패 시 연결을 강제로 끊는 예외를 발생시킬 수 있으나,
                //       setUser(null) 상태로 두면 @MessageMapping에서 Principal이 null이 됨.
                //       (여기서는 예외 대신 로깅만 함)
            }
        }

        // 7. 다음 인터셉터 또는 컨트롤러로 메시지 전달
        return message;
    }
}

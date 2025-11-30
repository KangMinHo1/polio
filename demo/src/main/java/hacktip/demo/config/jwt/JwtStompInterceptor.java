package hacktip.demo.config.jwt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtStompInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // [수정 1] wrap 대신 getAccessor를 사용하여 기존 메시지의 accessor를 가져옵니다.
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // accessor가 null일 경우 방어 로직 (드문 경우)
        if (accessor == null) {
            return message;
        }

        // [수정 2] 주로 CONNECT 시점에만 토큰 검증을 수행하여 세션을 인증합니다.
        // SEND 때마다 토큰을 검사하려면 클라이언트가 모든 메시지에 헤더를 붙여야 하므로 비효율적일 수 있습니다.
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            String token = jwtTokenProvider.resolveToken(bearerToken);

            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                String email = jwtTokenProvider.getEmailFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                // [핵심] 인증 객체를 WebSocket 세션(Accessor)에 심습니다.
                // 이렇게 하면 이후 SEND 요청 시에도 Spring이 이 세션의 주인을 기억합니다.
                accessor.setUser(authentication);

                log.info("STOMP Connection Authenticated: {}", email);
            } else {
                // [수정 3] 토큰이 없거나 유효하지 않으면 연결 자체를 끊어야 합니다. (예외 발생)
                // 예외를 발생시키지 않으면 '익명 사용자'로 연결되어 버립니다.
                log.error("STOMP Connection Error: Invalid Token");
                throw new IllegalArgumentException("유효하지 않은 토큰입니다. 연결이 거부되었습니다.");
            }
        }

        return message;
    }
}
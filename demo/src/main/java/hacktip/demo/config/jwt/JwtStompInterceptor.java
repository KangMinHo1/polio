package hacktip.demo.config.jwt;

import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.security.UserDetailsServiceImpl;
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
    private final UserDetailsServiceImpl userDetailsService;

    // ... 상단 import 생략

// 1. [수정] ServiceImpl을 직접 주입받는 것은 추천하지 않지만,
//    지금처럼 디버깅이 필요할 땐 확실하게 확인하기 위해 잠시 사용할 수 있습니다.
//    (하지만 원래 코드인 UserDetailsService 인터페이스 주입이 더 좋은 패턴입니다!)

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            String token = jwtTokenProvider.resolveToken(bearerToken);

            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                String email = jwtTokenProvider.getEmailFromToken(token);

                // 여기서 UserDetails 인터페이스로 받지만, 실제로는 UserDetailsImpl 객체입니다.
                UserDetails userDetailsInterface = userDetailsService.loadUserByUsername(email);

                // [확인사살] 강제로 형변환하여 데이터가 있는지 봅니다.
                if (userDetailsInterface instanceof UserDetailsImpl) {
                    UserDetailsImpl myUserDetails = (UserDetailsImpl) userDetailsInterface;
                    log.info("============== [INTERCEPTOR DEBUG] ==============");
                    log.info("1. Email: {}", myUserDetails.getEmail());
                    log.info("2. MemberID: {}", myUserDetails.getMemberId());
                    log.info("=================================================");

                    // 인증 객체 생성
                    Authentication authentication = new UsernamePasswordAuthenticationToken(myUserDetails, null, myUserDetails.getAuthorities());
                    accessor.setUser(authentication);
                } else {
                    log.error("치명적 오류: UserDetailsImpl이 반환되지 않았습니다!");
                }
            }
        }
        return message;
    }
}
package hacktip.demo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 토큰을 검증하고,
 * 토큰이 유효할 경우 Spring Security 컨텍스트에 인증 정보를 설정하는 필터.
 * (스프링 시큐리티의 UsernamePasswordAuthenticationFilter 앞에 위치하게 됨)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter { // 2. 요청당 한 번만 실행됨

    private final JwtTokenProvider jwtTokenProvider;

    // 필터의 핵심 로직
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // 3. 요청 헤더에서 "Authorization" 헤더를 가져옴
        String bearerToken = request.getHeader("Authorization");

        // 4. "Bearer " 접두사를 제거하여 순수 토큰을 추출
        String token = jwtTokenProvider.resolveToken(bearerToken);

        // 5. 토큰이 비어있는지 확인하고, 우리 서버에서 만든 토큰이 맞는지 검증
        if(StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)){

            // 6. 토큰이 유효하면, 토큰에서 사용자 이메일(Subject)을 추출
            String email = jwtTokenProvider.getEmailFromToken(token);

            // 7. (핵심) 인증 객체(Authentication) 생성
            // - 파라미터 1: principal (사용자 식별자, 여기서는 이메일)
            // - 파라미터 2: credentials (자격 증명, 토큰 방식에선 보통 null)
            // - 파라미터 3: authorities (권한 목록, 지금은 없음 -> Collections.emptyList())
            Authentication authentication = new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

            // 8. (매우 중요) SecurityContextHolder에 인증 객체를 저장
            //    -> 이 요청이 끝날 때까지 "이 사용자는 인증된 사용자"라고 등록하는 것
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 9. 다음 필터로 요청과 응답을 전달
        // (토큰이 없거나 유효하지 않아도, 필터 체인은 계속 진행되어야 함.
        //  -> 뒤에 있는 시큐리티 필터가 "인증 안 됐네?"라며 막아줄 것임)
        filterChain.doFilter(request, response);

    }





}

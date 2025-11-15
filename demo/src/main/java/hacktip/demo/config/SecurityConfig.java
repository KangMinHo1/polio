package hacktip.demo.config;

import hacktip.demo.config.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // 1. (임포트) HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 3. HTTP 요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // (기존) 인증/회원가입/채팅 API
                        .requestMatchers("/signup", "/login", "/reissue").permitAll()
                        .requestMatchers("/chat/room/{roomId}/messages").authenticated() // (기존 채팅 API)

                        // 2. === [게시판 규칙 추가] ===
                        // (조회) GET /posts 와 GET /posts/{postId} 는 누구나(permitAll)
                        .requestMatchers(HttpMethod.GET, "/posts", "/posts/{postId}").permitAll()

                        // (작성, 수정, 삭제) POST, PATCH, DELETE는 인증(authenticated) 필요
                        .requestMatchers(HttpMethod.POST, "/posts").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/posts/{postId}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/posts/{postId}").authenticated()
                        // =========================

                        // (기존) 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
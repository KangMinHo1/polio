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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

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
                // 1. (추가) CORS 설정을 http.cors()를 통해 활성화
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // (기존) CSRF, 세션 관리 설정
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 3. HTTP 요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // (기존) 인증/회원가입/채팅 API
                        .requestMatchers("/signup", "/login", "/reissue").permitAll()
                        .requestMatchers("/chat/room/{roomId}/messages", "/me").authenticated() // (기존 채팅 API)

                        // 2. === [게시판 규칙 추가] ===
                        // (조회) GET /posts 와 GET /posts/{postId} 는 누구나(permitAll)
                        .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/{postId}").permitAll()

                        // (작성, 수정, 삭제) POST, PATCH, DELETE는 인증(authenticated) 필요
                        .requestMatchers(HttpMethod.POST, "/api/posts").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/posts/{postId}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/{postId}").authenticated()

                        // 3. === [댓글 규칙 추가] ===
                        .requestMatchers(HttpMethod.GET, "/api/posts/{postId}/comments").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/posts/{postId}/comments").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/comments/{commentId}").authenticated()
                        // .requestMatchers(HttpMethod.PUT, "/api/comments/{commentId}").authenticated() // 수정 기능 추가 시
                        // =========================

                        // (기존) 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 2. (추가) CORS 설정을 위한 Bean 등록
    /**
     * CORS (Cross-Origin Resource Sharing) 설정을 정의하는 Bean.
     * 프론트엔드(localhost:5050)요청을 허용.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. 허용할 출처(Origin) 설정
        configuration.setAllowedOrigins(Arrays.asList("http://192.168.219.103:5500", "http://localhost:5500"));
        // 2. 허용할 HTTP 메서드 설정 ("*": 모든 메서드 허용)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"));
        // 3. 허용할 HTTP 헤더 설정 ("*": 모든 헤더 허용)
        configuration.setAllowedHeaders(Arrays.asList("*"));
        // 4. (중요) 자격 증명(쿠키, 인증 헤더 등)을 포함한 요청 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 경로에 대해 위 설정 적용
        return source;
    }
}
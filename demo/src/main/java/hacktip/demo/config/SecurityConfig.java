package hacktip.demo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                // 1. CSRF 비활성화 (POST 요청을 위해 필요할 수 있음)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. JWT를 사용할거니 세션인증 방식은 사용하지 않겠다는 선언
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 3. HTTP 요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // ✅ 이 부분이 핵심입니다!
                        // "/signup" 경로는 인증 없이 누구나 접근(permitAll)할 수 있도록 허용
                        .requestMatchers("/signup", "/login").permitAll()

                        // 그 외의 모든 요청은 인증(authenticated)이 필요함
                        .anyRequest().authenticated()
                )

                // (선택) 폼 로그인, HTTP Basic 인증 비활성화 (JWT 사용 시)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // 6. <--- [추가] (가장 중요!) 우리가 만든 JWT 필터를 정식 필터 체인에 등록
                //      스프링 시큐리티의 기본 로그인 필터(UsernamePasswordAuthenticationFilter)
                //      "앞(Before)"에 우리가 만든 jwtAuthenticationFilter를 배치합니다.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}

package hacktip.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화 (POST 요청을 위해 필요할 수 있음)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. 세션 관리 정책 설정 (JWT 사용 시 STATELESS로 설정)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 3. HTTP 요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // ✅ 이 부분이 핵심입니다!
                        // "/signup" 경로는 인증 없이 누구나 접근(permitAll)할 수 있도록 허용
                        .requestMatchers("/signup").permitAll()

                        // 그 외의 모든 요청은 인증(authenticated)이 필요함
                        .anyRequest().authenticated()
                )

                // (선택) 폼 로그인, HTTP Basic 인증 비활성화 (JWT 사용 시)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

}

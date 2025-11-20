package hacktip.demo.config.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

//jwt를 생성, 검증, 정보추출 하는 전용 클래스
@Slf4j
@Component
public class JwtTokenProvider {

    //application.properties 에서 설정한 비밀 키를 주입받는다.
    @Value("${jwt.secret-key}")
    private String secretKeyString;

    // application.properties에서 설정한 토큰 만료 시간을 주입받습니다.
    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    // 1. === [추가] Refresh Token 만료 시간 주입 ===
    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // HMAC-SHA 알고리즘을 위한 SecretKey 객체. (String이 아님)
    private SecretKey secretKey;

    // @PostConstruct: Spring Bean이 생성된 후 (의존성 주입이 완료된 후)
    // 1회 실행되는 초기화 메서드입니다.
    @PostConstruct
    public void init(){
        // 1. 주입받은 Base64 인코딩된 secretKeyString을 디코딩한다.
        byte[] keyBytes = Decoders.BASE64.decode(secretKeyString);
        // 2. 디코딩된 바이트 배열을 사용하여 HMAC-SHA 키 객체를 생성한다.
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JWT secret key initialized successfully.");
    }

    /**
     * 로그인 성공 시 Access Token을 생성하는 메서드
     * @param email 사용자의 이메일 (토큰의 주체(Subject)로 사용)
     * @return 생성된 JWT Access Token 문자열
     */
    public String createAccessToken(String email, String role){
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .subject(email)// 토큰의 주체 (e.g., 사용자 이메일)
                .claim("auth", role)  // [핵심] "auth"라는 이름으로 역할 정보 저장
                .issuedAt(now) // 토큰 발급 시간
                .expiration(validity)// 토큰 만료 시간
                .signWith(secretKey, Jwts.SIG.HS256)// 사용할 서명 알고리즘과 비밀 키
                .compact();// 토큰을 문자열로 압축
    }


    // 2. === [추가] Refresh Token 생성 메서드 ===
    /**
     * 로그인 성공 시 Refresh Token을 생성하는 메서드
     * (Access Token보다 만료 시간이 훨씬 김)
     * @param email 사용자의 이메일 (토큰의 주체(Subject)로 사용)
     * @return 생성된 JWT Refresh Token 문자열
     */
    public String createRefreshToken(String email){
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenExpirationMs);// 3. 리프레시 토큰 만료 시간 사용

        return Jwts.builder()
                .subject(email) // 4. (중요) Access Token과 동일한 주체(email)를 가져야 함
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }



    /**
     * HTTP 요청 헤더에서 JWT 토큰을 추출하는 메서드
     * @param bearerToken "Bearer [token]" 형식의 문자열
     * @return "Bearer " 접두사를 제거한 순수 토큰 문자열, 또는 null
     */
    public String resolveToken(String bearerToken){
        if(bearerToken != null && bearerToken.startsWith("Bearer")){
            return bearerToken.substring(7);
        }
        return null;
    }


    /**
     * 주어진 토큰을 검증하는 메서드
     * @param token 검증할 JWT 토큰 문자열
     * @return 토큰이 유효하면 true, 아니면 false
     */
    public boolean validateToken(String token){
        try{
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e){
            log.warn("Invalid JWT signature.", e);
        } catch (ExpiredJwtException e){
            log.warn("Expired JWT token", e);
        } catch (UnsupportedJwtException e){
            log.warn("Unsupported JWT token");
        } catch (IllegalArgumentException e){
            log.warn("JWT claims string is empty.", e);
        } catch (Exception e) {
            log.warn("Invalid JWT token.", e); // 기타 모든 예외
        }
        return false;
    }

    /**
     * 토큰에서 사용자 이메일(Subject)을 추출하는 메서드
     * @param token 파싱할 JWT 토큰 문자열
     * @return 토큰의 주체(Subject)로 저장된 사용자 이메일
     */
    public String getEmailFromToken(String token){
        // secretKey를 사용하여 토큰을 파싱하고, Claims 부분을 가져온다
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload(); // payload(Claims) 부분 가져오기

        return claims.getSubject(); // Claims에서 subject(이메일) 반환
    }

    // 2. 토큰에서 Role 정보 꺼내기 (검증용)
    public String getRoleFromToken(String token){
        return Jwts.parser() //JWT를 파싱할 때 사용하는 빌더 객체를 생성합니다.
                .verifyWith(secretKey) //JWT 서명을 검증할 비밀 키를 지정합니다.
                .build() //위에서 설정한 검증 옵션으로 파서 객체를 완성(build) 합니다.
                .parseSignedClaims(token) //실제로 JWT 토큰을 파싱하고 서명을 검증합니다.
                .getPayload() //JWT에서 payload(클레임)를 꺼내는 단계입니다.
                .get("auth", String.class); //payload 안에서 "auth"라는 특정 클레임 값을 꺼냅니다.
    }



}

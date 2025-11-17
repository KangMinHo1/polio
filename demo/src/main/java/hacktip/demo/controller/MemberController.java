package hacktip.demo.controller;

import hacktip.demo.dto.*;// 1. dto 패키지 와일드카드 임포트 (TokenInfo 포함)
import hacktip.demo.dto.MemberDto.MemberLoginRequestDto;
import hacktip.demo.dto.MemberDto.MemberSignUpRequestDto;
import hacktip.demo.dto.MemberDto.MemberSignUpResponseDto;
import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.service.MemberService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie; // 2. Cookie 임포트
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<MemberSignUpResponseDto> signUp(@Valid @RequestBody MemberSignUpRequestDto request){
        MemberSignUpResponseDto memberSignUpResponseDto = memberService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(memberSignUpResponseDto);
    }

    //로그인
    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@Valid @RequestBody MemberLoginRequestDto request, HttpServletResponse response){
        // 5. Service 호출 (반환 타입이 TokenInfo로 변경됨)
        TokenInfo tokenInfo = memberService.login(request);

        // 6. (추가) Refresh Token을 HttpOnly 쿠키에 추가
        addRefreshTokenToCookie(tokenInfo.getRefreshToken(), tokenInfo.getRefreshTokenExpirationMs(), response);

        // 7. (수정) Access Token은 기존처럼 DTO에 담아 Body로 응답
        return ResponseEntity.ok(new TokenResponseDto(tokenInfo.getAccessToken())); //200 OK와 함께 토큰 응답
    }

    // 3. === [로그아웃 엔드포인트 추가] ===
    /**
     * 로그아웃
     * (DB에서 RT 삭제 + 브라우저의 RT 쿠키 만료)
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal UserDetailsImpl userDetails, HttpServletResponse response){
        String email = userDetails.getUsername(); // UserDetails에서 이메일 추출

        // 1. (DB) 서비스 호출하여 DB에서 Refresh Token 삭제
        memberService.logout(email);

        // 2. (Cookie) 클라이언트(브라우저)의 HttpOnly 쿠키 삭제
        //     (만료 시간을 0으로 설정한 같은 이름의 쿠키를 덮어씌움)
        expireRefreshTokenCookie(response);

        // 3. 200 OK와 함께 성공 메시지 응답
        return ResponseEntity.ok("로그아웃 되었습니다.");
    }

    // 6. === [쿠키 만료 헬퍼 메서드 추가] ===
    /**
     * Refresh Token 쿠키를 만료시키는 헬퍼 메서드
     * @param response (쿠키를 담을 응답 객체)
     */
    private void expireRefreshTokenCookie(HttpServletResponse response) {
        // 7. "refreshToken" 쿠키를 생성하되, 만료 시간(MaxAge)을 0으로 설정
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/"); // (중요) 기존 쿠키와 path가 동일해야 함
        cookie.setMaxAge(0);// 8. (핵심) 만료 시간을 0초로 설정

        response.addCookie(cookie); // 9. 응답에 만료 쿠키 추가
    }

    // 2. === [토큰 재발급 엔드포인트 추가] ===
    /**
     * Access Token 재발급
     * (HttpOnly 쿠키에 담긴 Refresh Token을 @CookieValue로 읽어옴)
     */
    @PostMapping("/reissue")
    public ResponseEntity<TokenResponseDto> reissue(@CookieValue("refreshToken") String refreshToken){// 3. "refreshToken" 쿠키 값을 읽어서 String refreshToken 변수에 할당
        // 4. 서비스를 호출하여 새로운 AT 발급
        TokenResponseDto tokenResponseDto = memberService.reissueToken(refreshToken);

        // 5. 새로운 AT를 Body에 담아 200 OK 응답
        return ResponseEntity.ok(tokenResponseDto);
    }


    /**
     * Refresh Token을 HttpOnly 쿠키에 추가하는 헬퍼 메서드
     * @param refreshToken     (실제 토큰 값)
     * @param expirationMs     (토큰 만료 시간 - ms)
     * @param response         (쿠키를 담을 응답 객체)
     */
    private void addRefreshTokenToCookie(String refreshToken, long expirationMs, HttpServletResponse response){
        // 8. 쿠키 만료 시간을 (ms -> s)로 변환
        long maxAgeInSeconds = expirationMs / 1000;

        Cookie cookie = new Cookie("refreshToken", refreshToken);// 9. (중요) Javascript에서 접근 불가
        cookie.setHttpOnly(true);// 10. “이 쿠키는 /로 시작하는 모든 요청에 자동으로 포함되어 서버로 전송된다”
        cookie.setPath("/");// 11. 쿠키의 유효 시간 (초 단위)
        cookie.setMaxAge((int) maxAgeInSeconds);// 12. (선택) HTTPS 환경에서만 쿠키 전송 (배포 시 활성화)

        response.addCookie(cookie); // 13. 응답에 쿠키 추가

    }
}

package hacktip.demo.controller;

import hacktip.demo.dto.*;// 1. dto 패키지 와일드카드 임포트 (TokenInfo 포함)
import hacktip.demo.dto.MemberDto.MemberLoginRequestDto;
import hacktip.demo.dto.MemberDto.MemberSignUpRequestDto;
import hacktip.demo.dto.MemberDto.MemberSignUpResponseDto;
import hacktip.demo.dto.MemberDto.ResponseUserDataDto;
import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.service.MemberService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie; // 2. Cookie 임포트
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MemberController {

    private final MemberService memberService;

    //회원가입
    @PostMapping("/signup")
    public ResponseEntity<MemberSignUpResponseDto> signUp(@Valid @RequestBody MemberSignUpRequestDto request){
        MemberSignUpResponseDto memberSignUpResponseDto = memberService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(memberSignUpResponseDto);
    }

    //회원 삭제
    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<String> deleteMember(@PathVariable Long memberId, @AuthenticationPrincipal UserDetails userDetails, HttpServletResponse response){
        UserDetailsImpl authenticatedUser = (UserDetailsImpl) userDetails;

        memberService.deleteMember(memberId, authenticatedUser);

        //계정이 삭제되었으니 브라우저에 남아있는 Refresh Token 쿠키도 삭제
        if(authenticatedUser.getMemberId().equals(memberId)){
            expireRefreshTokenCookie(response);
        }

        return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
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


    /**
     * 로그아웃
     * (DB에서 RT 삭제 + 브라우저의 RT 쿠키 만료)
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal UserDetails userDetails, HttpServletResponse response){
        String email = userDetails.getUsername();

        // 1. (DB) 서비스 호출하여 DB에서 Refresh Token 삭제
        memberService.logout(email);

        // 2. (Cookie) 클라이언트(브라우저)의 HttpOnly 쿠키 삭제
        //     (만료 시간을 0으로 설정한 같은 이름의 쿠키를 덮어씌움)
        expireRefreshTokenCookie(response);

        // 3. 200 OK와 함께 성공 메시지 응답
        return ResponseEntity.ok("로그아웃 되었습니다.");
    }

    //자신의 정보 요청
    @GetMapping("/me")
    public ResponseEntity<ResponseUserDataDto> getMe(@AuthenticationPrincipal UserDetails userDetails){
        // 서비스 계층에 UserDetails를 전달하여 사용자 정보를 조회합니다.
        ResponseUserDataDto responseDto = memberService.getCurrentUser((UserDetailsImpl) userDetails);
        return ResponseEntity.ok(responseDto);
    }

    //사용자 이름으로 기술스택 가져오기
    @GetMapping("/members/{userName}/stacks")
    public ResponseEntity<List<String>> getStacksByUserName(@PathVariable String userName){
        List<String> stacks = memberService.getStacksByUserName(userName);
        return ResponseEntity.ok(stacks);
    }

    //모든 유저 정보 일부 가져오기
    @GetMapping("/users") // 최종 URL: /api/users
    public ResponseEntity<List<ResponseUserDataDto>> getAllUsers() {
        List<ResponseUserDataDto> users = memberService.findAllUsers();
        return ResponseEntity.ok(users);
    }

    //자신의 기술 스택 갱신
    @PutMapping("/members/me/stacks")
    public ResponseEntity<Void> updateMemberStacks(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UpdateMemberStacksDto request) {
        memberService.updateMemberStacks(userDetails.getUsername(), request.getStackNames());
        return ResponseEntity.ok().build();
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

package hacktip.demo.controller;

import hacktip.demo.dto.MemberLoginRequestDto;
import hacktip.demo.dto.MemberSignUpRequestDto;
import hacktip.demo.dto.MemberSignUpResponseDto;
import hacktip.demo.dto.TokenResponseDto;
import hacktip.demo.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<TokenResponseDto> login(@Valid @RequestBody MemberLoginRequestDto request){
        TokenResponseDto tokenResponseDto = memberService.login(request);
        return ResponseEntity.ok(tokenResponseDto); //200 OK와 함께 토큰 응답
    }
}

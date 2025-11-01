package hacktip.demo.service;

import hacktip.demo.config.JwtTokenProvider;
import hacktip.demo.domain.Member;
import hacktip.demo.dto.MemberLoginRequestDto;
import hacktip.demo.dto.MemberSignUpRequestDto;
import hacktip.demo.dto.MemberSignUpResponseDto;
import hacktip.demo.dto.TokenResponseDto;
import hacktip.demo.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 4. JwtTokenProvider 의존성 주입 (final + @RequiredArgsConstructor)
    private final JwtTokenProvider jwtTokenProvider;

    // 회원가입
    @Transactional
    public MemberSignUpResponseDto signUp(MemberSignUpRequestDto request){
        String encodedPassword = passwordEncoder.encode(request.getPassword()); //비밀번호 암호화
        Member entity = request.toEntity(encodedPassword); // 엔티티 생성

        //이메일 중복 검사
        if(memberRepository.existsByEmail(entity.getEmail())){
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다,");
        }
        //이름 중복 검사
        if(memberRepository.existsByName(entity.getName())){
            throw new IllegalArgumentException("이미 사용 중인 이름입니다.");
        }

        Member savedMember = memberRepository.save(entity); // DB에 엔티티 저장

        return new MemberSignUpResponseDto(savedMember.getUserId(), savedMember.getEmail(), savedMember.getName());
    }

    //로그인
    @Transactional
    public TokenResponseDto login(MemberLoginRequestDto request){

        // 1. 이메일 기반으로 회원 조회
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(()->new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 비밀번호 일치 여부 확인
        if(!passwordEncoder.matches(request.getPassword(), member.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. 비밀번호가 일치하면 JWT Access Token 생성
        String accessToken = jwtTokenProvider.createAccessToken(member.getEmail());

        // 4. 토큰을 DTO에 담아 반환
        return new TokenResponseDto(accessToken);
    }
}

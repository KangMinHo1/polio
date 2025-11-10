package hacktip.demo.service;

import hacktip.demo.config.jwt.JwtTokenProvider;
import hacktip.demo.domain.Member;
import hacktip.demo.domain.RefreshToken;
import hacktip.demo.dto.*;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 4. JwtTokenProvider 의존성 주입 (final + @RequiredArgsConstructor)
    private final JwtTokenProvider jwtTokenProvider;

    // 6. RefreshTokenRepository 주입
    private final RefreshTokenRepository refreshTokenRepository;

    // 7. application.properties에서 RT 만료 시간 주입
    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

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

        return new MemberSignUpResponseDto(savedMember.getMemberId(), savedMember.getEmail(), savedMember.getName());
    }

    /**
     * 로그인 처리 (AT, RT 생성 및 RT 저장)
     * @param request 로그인 요청 DTO
     * @return AT, RT, RT 만료 시간이 담긴 TokenInfo DTO
     */
    @Transactional
    public TokenInfo login(MemberLoginRequestDto request){

        // 1. 이메일 기반으로 회원 조회
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(()->new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 비밀번호 일치 여부 확인
        if(!passwordEncoder.matches(request.getPassword(), member.getPassword())){
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. (수정) Access Token, Refresh Token 생성
        String accessToken = jwtTokenProvider.createAccessToken(member.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(member.getEmail());

        // 4. (추가) Refresh Token DB에 저장 (또는 갱신)
        //    (사용자 이메일(PK)을 기준으로 토큰을 찾음)
        Optional<RefreshToken> existingToken = refreshTokenRepository.findById(member.getEmail());

        if(existingToken.isPresent()){
            // 10. 기존 토큰이 있다면, 새 RT로 값(value)만 갱신
            existingToken.get().updateToken(refreshToken);
            refreshTokenRepository.save(existingToken.get());
        } else {
            RefreshToken newRefreshToken = new RefreshToken(member.getEmail(), refreshToken);
            refreshTokenRepository.save(newRefreshToken);
        }

        // 5. (수정) TokenInfo DTO에 모든 토큰 정보와 만료 시간을 담아 반환
        return new TokenInfo(accessToken, refreshToken, refreshTokenExpirationMs);
    }

    // 2. === [토큰 재발급 메서드 추가] ===
    /**
     * Refresh Token을 기반으로 새로운 Access Token을 재발급
     * @param refreshToken (쿠키에서 추출한 RT)
     * @return 새로운 Access Token이 담긴 DTO
     */
    @Transactional
    public TokenResponseDto reissueToken(String refreshToken){

        // 1. (검증 1) Refresh Token 유효성 검증 (만료, 서명 등)
        if(!jwtTokenProvider.validateToken(refreshToken)){
            // (보안) 유효하지 않은 RT(만료, 위조 등)가 감지되면,
            // DB에서 해당 RT를 즉시 삭제하여 2차 탈취 피해를 방지하는 로직을 추가할 수 있습니다.
            refreshTokenRepository.findByTokenValue(refreshToken).ifPresent(refreshTokenRepository::delete);
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다.");
        }

        // 2. (검증 2) Refresh Token에서 사용자 이메일(Email) 추출
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);

        // 3. (검증 3) DB에 저장된 Refresh Token과 대조
        RefreshToken storedRefreshToken = refreshTokenRepository.findById(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자와 매핑된 Refresh Token이 없습니다. (로그아웃되었거나 탈취됨)"));

        // 4. (검증 4) (매우 중요) 쿠키의 RT와 DB의 RT가 일치하는지 확인
        if(!storedRefreshToken.getTokenValue().equals(refreshToken)){
            // (보안) DB의 값과 다르다는 것은, 이전에 발급된 RT(탈취된 RT)일 가능성이 높음
            //       즉시 DB에서 해당 RT를 삭제하고 예외 발생
            refreshTokenRepository.delete(storedRefreshToken);
            throw new IllegalArgumentException("Refresh Token이 일치하지 않습니다. (탈취 시도 감지)");
        }

        // --- 모든 검증 통과 ---

        // 5. 새로운 Access Token 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(email);

        // 6. 새 Access Token을 DTO에 담아 반환
        return new TokenResponseDto(newAccessToken);
    }
}

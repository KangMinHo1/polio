package hacktip.demo.service;

import hacktip.demo.config.jwt.JwtTokenProvider;
import hacktip.demo.domain.*;
import hacktip.demo.dto.*;
import hacktip.demo.dto.MemberDto.MemberLoginRequestDto;
import hacktip.demo.dto.MemberDto.MemberSignUpRequestDto;
import hacktip.demo.dto.MemberDto.MemberStackDto;
import hacktip.demo.dto.MemberDto.MemberSignUpResponseDto;
import hacktip.demo.dto.MemberDto.ResponseUserDataDto;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.repository.MemberStackRepository;
import hacktip.demo.repository.RefreshTokenRepository;
import hacktip.demo.repository.TechStackRepository;
import hacktip.demo.security.UserDetailsImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    private final TechStackRepository techStackRepository;
    private final MemberStackRepository memberStackRepository;

    // 7. application.properties에서 RT 만료 시간 주입
    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // 회원가입
    @Transactional
    public MemberSignUpResponseDto signUp(MemberSignUpRequestDto request){
        String encodedPassword = passwordEncoder.encode(request.getPassword()); //비밀번호 암호화
        

        //이메일 중복 검사
        if(memberRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        //이름 중복 검사
        if(memberRepository.existsByName(request.getName())){
            throw new IllegalArgumentException("이미 사용 중인 이름입니다.");
        }

        // 3. [보안] 관리자 가입 막기 (선택 사항)
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("관리자 권한으로 가입할 수 없습니다.");
        }

        // 4. [수정] Service에서 Entity 조립 (DTO.toEntity 삭제 대응)
        Member entity = Member.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .name(request.getName())
                .role(request.getRole()) // 역할 주입
                .build();

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
        String accessToken = jwtTokenProvider.createAccessToken(member.getEmail(), member.getRole().getKey());
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

    // 1. === [로그아웃 메서드 추가] ===
    /**
     * 로그아웃 처리
     * @param email (인증된 사용자의 이메일)
     */
    @Transactional
    public void logout(String email){
        // 1. 이메일(PK)을 사용하여 DB에서 Refresh Token 조회
        Optional<RefreshToken> refreshTokenOptional = refreshTokenRepository.findById(email);

        if(refreshTokenOptional.isPresent()){
            refreshTokenRepository.delete(refreshTokenOptional.get());
        } else{
            // 클라이언트가 AT를 삭제했으므로 그냥 성공 처리.
        }
    }

    //로그인한 회원의 이름과 역할 제공
    public ResponseUserDataDto getCurrentUser(UserDetailsImpl userDetails){
        // 1. [수정] MemberStack 엔티티 리스트 조회
        List<MemberStack> memberStackEntities = memberStackRepository.findByMember_MemberId(userDetails.getMemberId());
        // 2. [수정] MemberStack 엔티티 리스트를 MemberStackDto 리스트로 변환
        List<MemberStackDto> memberStackDto = memberStackEntities.stream()
                .map(MemberStackDto::new)
                .collect(Collectors.toList());
        return new ResponseUserDataDto(userDetails.getMemberId(), userDetails.getName(), userDetails.getRole(), memberStackDto);
    }

    // 사용자의 이름으로 기술스택 가져오기
    public List<String> getStacksByUserName(String userName){
        List<MemberStack> stacks = memberStackRepository.findByMember_Name(userName);
        return stacks.stream()
                .map(stack -> stack.getTechStack().getStackName())
                .toList();

    }

    //모든 유저 정보 일부 가져오기
    @Transactional(readOnly = true)
    public List<ResponseUserDataDto> findAllUsers() {
        // 1. DB에서 모든 Member 엔티티를 가져옵니다.
        List<Member> allMembers = memberRepository.findAll();

        // 2. 각 Member를 ResponseUserDataDto로 변환합니다.
        return allMembers.stream()
                .map(member -> {
                    // [수정] 각 멤버의 기술 스택을 DTO로 변환
                    List<MemberStack> memberStackEntities = memberStackRepository.findByMember_MemberId(member.getMemberId());
                    List<MemberStackDto> memberStackDtos = memberStackEntities.stream()
                            .map(MemberStackDto::new)
                            .collect(Collectors.toList());
                    return new ResponseUserDataDto(member.getMemberId(), member.getName(), member.getRole(), memberStackDtos);
                })
                .collect(Collectors.toList());
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
        // 5. [수정] Access Token 재발급 시 Role 정보가 필요함!
        //    -> 이메일로 Member를 다시 조회해서 Role을 가져와야 합니다.
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 5. 새로운 Access Token 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(email, member.getRole().getKey());

        // 6. 새 Access Token을 DTO에 담아 반환
        return new TokenResponseDto(newAccessToken);
    }

    @Transactional
    public void updateMemberStacks(String email, List<String> stackNames) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 1. 기존 기술 스택 모두 삭제
        memberStackRepository.deleteByMember(member);

        // 2. [핵심] 삭제 작업을 DB에 즉시 반영 (flush)
        //    이것을 호출하지 않으면, 아래의 save와 순서가 꼬여 Unique Constraint 오류가 발생할 수 있음
        memberStackRepository.flush();

        // 2. [수정] 요청받은 기술 스택 목록에서 중복을 제거
        //    List를 Set으로 변환하면 중복된 요소가 자동으로 제거됩니다.
        List<String> distinctStackNames = stackNames.stream().distinct().collect(Collectors.toList());

        // 3. 중복이 제거된 기술 스택 목록을 DB에 추가
        for (String stackName : distinctStackNames) {
            TechStack techStack = techStackRepository.findByStackName(stackName)
                    .orElseGet(() -> techStackRepository.save(new TechStack(stackName)));
 
            MemberStack memberStack = new MemberStack(member, techStack);
            memberStackRepository.save(memberStack);
        }
    }
}

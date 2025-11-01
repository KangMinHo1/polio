package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.dto.MemberSignUpRequestDto;
import hacktip.demo.dto.MemberSignUpResponseDto;
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

}

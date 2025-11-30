package hacktip.demo.service;

import hacktip.demo.dto.PopularTechStackDto;
import hacktip.demo.dto.TechStackDto;
import hacktip.demo.repository.MemberStackRepository;
import hacktip.demo.repository.TechStackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TechStackService {

    private final TechStackRepository techStackRepository;
    private final MemberStackRepository memberStackRepository; // [추가]

    public List<TechStackDto> getAllTechStacks() {
        return techStackRepository.findAll().stream()
                .map(techStack -> new TechStackDto(techStack.getStackId(), techStack.getStackName()))
                .collect(Collectors.toList());
    }

    /**
     * [신규] 인기 기술 스택 목록 조회
     * @return 기술 스택 이름과 사용자 수를 담은 DTO 리스트
     */
    public List<PopularTechStackDto> getPopularTechStacks() {
        // 2단계에서 만든 Repository 메서드를 그대로 호출하여 결과를 반환합니다.
        return memberStackRepository.findPopularTechStacks();
    }
}

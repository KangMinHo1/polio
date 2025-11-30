package hacktip.demo.repository;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.MemberStack;
import hacktip.demo.dto.PopularTechStackDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MemberStackRepository extends JpaRepository<MemberStack, Long> {
    // 2. [핵심] 특정 회원의 기술 스택 목록 조회
    //    해석: findBy(찾아라) + Member(멤버 필드의) + _ (속성 탐색) + MemberId(멤버ID가 일치하는)
    List<MemberStack> findByMember_MemberId(Long memberId);
    List<MemberStack> findByMember_Name(String name);

    void deleteByMember(Member member);

    // [추가] 인기 기술 스택 통계 조회
    @Query("SELECT new hacktip.demo.dto.PopularTechStackDto(ts.stackName, COUNT(ms.member)) " +
           "FROM MemberStack ms " +
           "JOIN ms.techStack ts " +
           "GROUP BY ts.stackName " +
           "ORDER BY COUNT(ms.member) DESC")
    List<PopularTechStackDto> findPopularTechStacks();
}

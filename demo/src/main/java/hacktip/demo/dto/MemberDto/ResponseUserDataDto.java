package hacktip.demo.dto.MemberDto;

import hacktip.demo.domain.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;


@AllArgsConstructor
@Getter
@NoArgsConstructor
public class ResponseUserDataDto {

    private Long id;
    private String name;
    private Role role;
    List<MemberStackDto> memberStacks; // [수정] 엔티티 대신 DTO를 사용
}

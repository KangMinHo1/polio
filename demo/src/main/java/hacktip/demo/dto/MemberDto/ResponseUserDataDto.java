package hacktip.demo.dto.MemberDto;

import hacktip.demo.domain.MemberStack;
import hacktip.demo.domain.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;


@AllArgsConstructor
@Getter
@NoArgsConstructor
public class ResponseUserDataDto {

    private String name;
    private Role role;
    List<MemberStack> memberStack;
}

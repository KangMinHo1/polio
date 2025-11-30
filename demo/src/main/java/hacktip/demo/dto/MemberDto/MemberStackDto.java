package hacktip.demo.dto.MemberDto;

import hacktip.demo.domain.MemberStack;
import lombok.Getter;

@Getter
public class MemberStackDto {
    private final Long stackId;
    private final String stackName;

    public MemberStackDto(MemberStack memberStack) {
        this.stackId = memberStack.getTechStack().getStackId();
        this.stackName = memberStack.getTechStack().getStackName();
    }
}
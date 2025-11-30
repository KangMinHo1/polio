package hacktip.demo.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class UpdateMemberStacksDto {
    private List<String> stackNames;
}

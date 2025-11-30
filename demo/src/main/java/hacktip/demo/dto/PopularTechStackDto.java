package hacktip.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PopularTechStackDto {
    private String stackName;
    private long userCount;
}
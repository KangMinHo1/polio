package hacktip.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class GeminiApiConfig {
    // SpringBootApplication 클래스 내부에 추가하거나 별도 Config 클래스에 작성
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

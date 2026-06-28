package Capstone.Accounts.Figen;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;


@FeignClient(name = "accounts-service", url = "https://budgetwise-secure.onrender.com/person")
public interface fig {

    @GetMapping("/validate")
    public String validateToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token);

}

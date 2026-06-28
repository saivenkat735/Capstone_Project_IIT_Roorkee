package Capstone.TransactionHistory.Figen;

import Capstone.TransactionHistory.DTO.Person;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "accounts-service", url = "https://budgetwise-secure.onrender.com/person")
public interface SecureFigen {

    @GetMapping("/validate")
    public String validateToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token);

    @GetMapping("/getById/{personId}")
    public Person getById(@PathVariable long personId);
}

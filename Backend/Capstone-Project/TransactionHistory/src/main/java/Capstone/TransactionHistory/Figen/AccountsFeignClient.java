package Capstone.TransactionHistory.Figen;

import Capstone.TransactionHistory.DTO.AccountDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "ACCOUNTS-SERVICE", url = "https://budgetwise-accounts.onrender.com/api/accounts")
public interface AccountsFeignClient {
    @GetMapping("/{accountId}")
    ResponseEntity<AccountDTO> getAccountById(@PathVariable Long Id);

    @GetMapping("/person/{personId}")
    public List<AccountDTO> getAccountsByPerson(@PathVariable Long personId);

    @PutMapping("/{accountId}/balance")
    ResponseEntity<?> updateBalance(@PathVariable Long accountId, @RequestParam Long amount, @RequestParam("operation") String operation);


} 
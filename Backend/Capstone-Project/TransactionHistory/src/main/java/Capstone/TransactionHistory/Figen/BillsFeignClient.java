package Capstone.TransactionHistory.Figen;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "bills-service", url = "https://budgetwise-bills1.onrender.com/bills")
public interface BillsFeignClient {
    @GetMapping("/fixed-expenses/{accountId}")
    Long getTotalFixedExpenses(@PathVariable Long accountId);
} 
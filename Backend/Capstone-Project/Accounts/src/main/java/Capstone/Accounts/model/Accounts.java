package Capstone.Accounts.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Accounts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    private String accountName;
    private String userName;
    private Long personId;
    private String cardType;
    private Long balance;
    private boolean active = true;
}

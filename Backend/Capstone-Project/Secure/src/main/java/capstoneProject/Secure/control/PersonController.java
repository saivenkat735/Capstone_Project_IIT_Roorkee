package capstoneProject.Secure.control;

import capstoneProject.Secure.config.CustomUserDetails;
import capstoneProject.Secure.model.Person;
import capstoneProject.Secure.repo.UserRepository;
import capstoneProject.Secure.service.AuthService;
import capstoneProject.Secure.service.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/person")
@CrossOrigin(origins = "https://budgetwise-frontend-fuuo.onrender.com", allowCredentials = "true")
public class PersonController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<String> registerPerson(@RequestBody Person user) {
        try {
            if (authService.isUserRegistered(user.getUsername())) { // Check if user is already registered
                return ResponseEntity.status(HttpStatus.CONFLICT).body("User already registered");
            }

            user = authService.saveUser(user);
            String token = authService.generateToken(user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during registration");
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Person person) {
        Person existingPerson = userRepo.findByUsername(person.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        if (passwordEncoder.matches(person.getPassword(), existingPerson.getPassword())) {
            Map<String, Object> claims = new HashMap<>();
            claims.put("personId", existingPerson.getId());
            claims.put("username", existingPerson.getUsername());
            claims.put("role", "USER");
            
            String token = jwtService.generateToken(String.valueOf(existingPerson.getId()));
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("personId", existingPerson.getId());
            response.put("username", existingPerson.getUsername());
            
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validateToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        try {
            // Extract the token from the Authorization header
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

            // Validate the token
            authService.validateToken(token);

            // Extract username from the token
            String username = jwtService.extractUsername(token);

            // Return username if token is valid
            return ResponseEntity.ok(username);
        } catch (JwtException | IllegalArgumentException e) {
            // Return error message if token is invalid or expired
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }

    }
    @GetMapping("/getById/{personId}")
    public Person getById(@PathVariable long personId){
        return userRepo.findById(personId).get();
    }

}

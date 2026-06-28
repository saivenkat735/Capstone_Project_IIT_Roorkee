package com.example.GateWay.config;

import com.example.GateWay.filter.AuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Autowired
    private AuthenticationFilter authFilter;

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("secure-service", r -> r
                        .path("/person/**")
                        .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri("https://budgetwise-secure.onrender.com"))
                .route("accounts-service", r -> r
                        .path("/api/accounts/**")
                        .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri("https://budgetwise-accounts.onrender.com"))
                .route("transaction-service", r -> r
                        .path("/TransactionHistory/**")
                        .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri("https://budgetwise-transaction.onrender.com"))
                .route("bills-service", r -> r
                        .path("/bills/**")
                        .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri("https://budgetwise-bills1.onrender.com"))
                .route("category-service", r -> r
                        .path("/category/**")
                        .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri("https://budgetwise-category.onrender.com"))
                .route("ai-service", r -> r
                        .path("/ai/**")
                        .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri("http://localhost:8000"))
                .build();
    }
} 
package com.gestoracad.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ServicioLimiteIntentosTest {

    private final ServicioLimiteIntentos service = new ServicioLimiteIntentos();

    @Test
    @DisplayName("Permite hasta el máximo de intentos dentro de la ventana")
    void allowsUpToMaxAttempts() {
        String key = "login:10.0.0.1";
        assertThat(service.tryConsume(key, 3, 60_000)).isTrue();
        assertThat(service.tryConsume(key, 3, 60_000)).isTrue();
        assertThat(service.tryConsume(key, 3, 60_000)).isTrue();
        assertThat(service.currentCount(key, 60_000)).isEqualTo(3);
    }

    @Test
    @DisplayName("Bloquea al superar el máximo de intentos")
    void blocksAfterMaxAttempts() {
        String key = "login:10.0.0.2";
        for (int i = 0; i < 3; i++) {
            assertThat(service.tryConsume(key, 3, 60_000)).isTrue();
        }
        assertThat(service.tryConsume(key, 3, 60_000)).isFalse();
    }

    @Test
    @DisplayName("Aísla los contadores por clave (IP)")
    void isolatesCountersByKey() {
        service.tryConsume("login:10.0.0.3", 1, 60_000);
        assertThat(service.tryConsume("login:10.0.0.4", 1, 60_000)).isTrue();
        assertThat(service.tryConsume("login:10.0.0.3", 1, 60_000)).isFalse();
    }

    @Test
    @DisplayName("Libera intentos cuando expira la ventana")
    void releasesAttemptsAfterWindow() throws InterruptedException {
        String key = "login:10.0.0.5";
        service.tryConsume(key, 1, 30);
        assertThat(service.tryConsume(key, 1, 30)).isFalse();
        Thread.sleep(60);
        assertThat(service.tryConsume(key, 1, 30)).isTrue();
    }

    @Test
    @DisplayName("reset limpia el contador de una clave")
    void resetClearsCounter() {
        String key = "login:10.0.0.6";
        service.tryConsume(key, 1, 60_000);
        service.reset(key);
        assertThat(service.tryConsume(key, 1, 60_000)).isTrue();
    }
}

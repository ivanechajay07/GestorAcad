package com.gestoracad.security;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Controlador de límite de peticiones en memoria (ventana deslizante).
 * Suficiente para instancias únicas; en despliegues multi-nodo se recomienda un
 * almacén compartido (Redis) o un API Gateway.
 */
@Component
public class ServicioLimiteIntentos {

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public boolean tryConsume(String key, int maxAttempts, long windowMillis) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMillis) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxAttempts) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }

    public void reset(String key) {
        attempts.remove(key);
    }

    public int currentCount(String key, long windowMillis) {
        Deque<Long> timestamps = attempts.get(key);
        if (timestamps == null) {
            return 0;
        }
        long now = System.currentTimeMillis();
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMillis) {
                timestamps.pollFirst();
            }
            return timestamps.size();
        }
    }
}

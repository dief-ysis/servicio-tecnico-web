# Contribución — servicio-tecnico-web

## Estrategia de ramas (GitHub Flow)

- `main` siempre está desplegable. Nadie hace push directo.
- Toda feature o fix va en una rama corta:
  - `feat/<nombre>` — nueva funcionalidad
  - `fix/<nombre>` — corrección de bug
  - `chore/<nombre>` — mantenimiento
  - `docs/<nombre>` — documentación

## Convención de commits (Conventional Commits)

```
feat: descripción breve del cambio
fix: descripción breve del bug corregido
chore: tarea de mantenimiento
```

## Checklist de Pull Request

- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` compila sin errores
- [ ] `.env.example` actualizado si se agregan variables
- [ ] Sin secretos en el código

# Tuned springs

Springs are for chrome and the cursor, not headlines.

## Tokens

```text
spring-soft    stiffness 180  damping 22  mass 1    ≈ 480ms settle
spring-snappy  stiffness 380  damping 28  mass 1    ≈ 280ms settle
spring-stop    stiffness 260  damping 32  mass 1    almost no overshoot
```

CSS stand-in when you cannot integrate a spring solver:

```text
spring-soft    cubic-bezier(0.22, 1.2, 0.36, 1)
spring-snappy  cubic-bezier(0.22, 1.4, 0.36, 1)
```

Cap overshoot at 1.03 scale or 6px. If it visibly bounces twice, the spring is wrong.

## Allowed

- cursor settle after a click
- toggle, pill, checkbox
- a plate that locks into the well

## Forbidden

- hero type
- camera zoom (use linear or expo-out over the whole shot)
- more than one spring on screen at a time

# Mezquit — Tokens de color y reglas de uso

Contrastes calculados con WCAG 2.x. AA exige 4.5:1 para texto normal, 3:1 para texto grande y bordes funcionales.

```css
:root {
  --mezquit-sage:             #A3B18A; /* SOLO decorativo */
  --mezquit-timberwolf:       #DAD7CD; /* superficies secundarias */
  --mezquit-fern:             #567F55; /* hover acción primaria (4.60:1 con blanco) */
  --mezquit-hunter:           #3A5A40; /* acción primaria (7.7:1 con blanco) */
  --mezquit-brunswick:        #344E41; /* títulos (9.1:1 sobre blanco) */
  --mezquit-surface:          #FFFFFF;
  --mezquit-surface-secondary:#F7F6F4;
  --mezquit-ink:              #1E2B24; /* cuerpo (14.7:1 sobre blanco) */
  --mezquit-border:           #7E8C74; /* solo sobre blanco */
  --mezquit-accent:           #E0A526; /* solo como relleno, texto ink encima */
  --mezquit-success:          #2E6B3F;
  --mezquit-error:            #B3261E;
  --mezquit-warning:          #B45309;
  --mezquit-info:             #2B5F8A;
  --disc-d: #B84A3E;
  --disc-i: #D9A33A;
  --disc-s: #588157;
  --disc-c: #3F6E96;
}
```

## Reglas obligatorias

- Sage: nunca texto ni borde funcional (2.3:1 sobre blanco).
- Accent: nunca texto; como relleno usar ink encima (6.7:1).
- Hunter + brunswick: nunca para distinguir estados/categorías (1.17:1 entre sí).
- Inputs: siempre sobre surface blanca.
- Éxito/error: siempre ícono + texto, nunca solo color.

## Gráficas de reportes

- Niveles bajo→alto: timberwolf → sage → fern → hunter.
- DISC: etiquetar cada barra con su letra.
- No usar accent en gráficas.

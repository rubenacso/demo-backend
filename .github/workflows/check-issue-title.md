---
on:
  issues:
    types:
      - opened
permissions:
  contents: read
  actions: read
  issues: write
  pull-requests: read
engine: copilot
safe-outputs:
  add-comment:
    max: 1
---

# check-issue-title

Comprueba que el título de la issue sigue las siguientes convenciones:

- Debe estar escrito en español.
- No debe contener caracteres especiales ni emojis.
- Debe ser claro y conciso, describiendo brevemente el propósito de la issue.
- Debe comenzar con un verbo en infinitivo que llame a la acción que se realizará.

Si el título no cumple algunas de las convenciones, añade un comentario a la issue indicando los problemas encontrados y sugiriendo una corrección.

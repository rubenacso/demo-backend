---
name: Issue title checker
description: Check if the issue title follows the specified conventions and add a comment if it doesn't.
on:
  issues:
    types:
      - opened
permissions:
  contents: read
  issues: read
engine: copilot
strict: true
network:
  allowed:
    - defaults
tools:
  github:
    toolsets:
      - issues
safe-outputs:
  update-issue:
    status:
    target: "*"
    max: 3
  add-comment:
    target: "*"
    max: 3
---

# Issue title checker

Comprueba que el título de la issue sigue las siguientes convenciones:

- Debe estar escrito en español.
- No debe contener caracteres especiales ni emojis.
- Debe ser claro y conciso, describiendo brevemente el propósito de la issue.
- Debe comenzar con un verbo en infinitivo que llame a la acción que se realizará.

Si el título no cumple algunas de las convenciones, añade un comentario a la issue indicando los problemas encontrados y sugiriendo una corrección.

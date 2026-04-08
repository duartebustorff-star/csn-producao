---
name: ficha-produto
description: >
  Gera ficha técnica de produto por modelo de carroçaria CSN. Usa esta skill quando precisar de documentação comercial por tipo de carroçaria, quando o utilizador mencionar "ficha técnica", "ficha de produto", "product datasheet", "catálogo", "especificação do modelo". Alimenta CSN Connect e propostas.
---

# Ficha de Produto

**Código interno:** CSN-L4-COM-FP-2026
**Nível ISA-95:** L4-BPL (COM)
**Camada:** C3 (Agente Comercial)
**Persona de saída:** Marta (C2)

## Objectivo

Gerar ficha técnica comercial por modelo/tipo de carroçaria CSN. Usada em propostas, CSN Connect, e material de vendas para concessionários.

## Tipos de carroçaria CSN

1. **Basculante trilateral** (3.5T–8.5T)
2. **Basculante traseiro** (3.5T–8.5T)
3. **Estrado fixo** (3.5T–8.5T)
4. **Caixa aberta com taipais** (3.5T–8.5T)
5. **Caixa fechada** (3.5T–7.5T)

## Conteúdo da ficha

### Identificação
- Nome do modelo
- Código interno CSN
- Gama de chassis compatíveis (marcas/modelos/PMA)

### Especificação técnica
- Material: tipo de aço (S355J2 estrutura, S235JR painéis)
- Dimensões disponíveis: min–max (C × L × A)
- Peso próprio típico (gama kg)
- Capacidade de carga útil (gama kg por chassis)
- Espessura chão/laterais/traseira

### Normas e certificações
- EN 1090-2 EXC2 + Marcação CE
- EN ISO 3834-3
- EN 12642 código L / XL (se certificado)
- UNECE R73, R58, R48 compliance

### Opções disponíveis
- Kit hidráulico (basculantes)
- Portas laterais (abertura 270°)
- Olhais de amarração EN 12640
- Extensões de taipais
- Protecções laterais integradas
- Spray suppression kit

### Imagem
- Render 3D ou foto de referência
- Desenho dimensional esquemático

## Output

- PDF A4 (1-2 páginas) com layout comercial CSN
- Versão web (HTML) para CSN Connect
- Código: CSN-L4-COM-FP-[tipo]-[versão]

## Regra Bandeira

Pesos na ficha são GAMAS (ex: "680–780 kg"), nunca valor único — varia com opções e dimensões. Capacidade de carga é calculada por chassis específico, não genérica.
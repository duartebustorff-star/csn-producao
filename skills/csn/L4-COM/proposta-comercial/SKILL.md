---
name: proposta-comercial
description: >
  Gera propostas comerciais profissionais para fabrico de carroçarias. Usa esta skill sempre que o utilizador pedir para fazer uma proposta, orçamento, cotação, quote, ou mencionar "proposta para cliente", "orçamento basculante", "cotação caixa aberta", "proposta comercial", "fazer proposta", "enviar preço". Também quando mencionar um cliente e um tipo de carroçaria no mesmo contexto. Activa mesmo para pedidos informais como "manda preço ao cliente X" ou "quanto é que lhe digo".
---

# Proposta Comercial CSN Technic

## Contexto

CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal. Tipos: basculantes (tri/uni/bi), caixas abertas, estrados, plataformas. Clientes: empresas de terraplanagens, demolições, transporte inertes, resíduos, stands de comerciais.

## Quando usar

- Pedido de proposta/orçamento/cotação
- Menção de cliente + tipo de carroçaria
- "Quanto custa", "manda preço", "faz proposta"
- Resposta a lead comercial

## Informação necessária (perguntar se faltar)

1. **Cliente**: nome, empresa, NIF (se disponível)
2. **Veículo**: marca, modelo, PBT, entre-eixos, cabine, rodado
3. **Carroçaria**: tipo (basculante/caixa/estrado), dimensões (CxLxA)
4. **Acessórios**: grades, porta traseira, cobertura, escada, caixa ferramentas
5. **Quantidade**: número de unidades
6. **Prazo**: data entrega desejada

## Estrutura da proposta

### Secção 1 — Cabeçalho
- Logo CSN Technic (referência)
- Número da proposta: `PROP-{ANO}-{SEQUENCIAL}` (ex: PROP-2026-047)
- Data de emissão
- Validade: 30 dias (padrão)

### Secção 2 — Destinatário
- Nome / Empresa / NIF / Morada / Contacto

### Secção 3 — Objecto
Descrição clara do que é proposto:
> "Fabrico e montagem de carroçaria [TIPO] em aço [S235JR/S355/Hardox] com dimensões [CxLxA]mm para chassis [MARCA MODELO], PBT [X]kg."

### Secção 4 — Especificação técnica
Tabela com:
| Componente | Material | Espessura | Acabamento |
|-----------|----------|-----------|------------|
| Fundo | Hardox 450 | 4mm | — |
| Laterais | S235JR | 3mm | Primário + RAL |
| Porta traseira | S235JR | 3mm | Primário + RAL |
| Estrutura | S355JR | perfil 60x40x3 | Primário |

### Secção 5 — Acessórios incluídos
Lista com bullet points de todos os acessórios

### Secção 6 — Preço
```
Carroçaria [TIPO] [DIM]mm ........... €X.XXX,XX
Acessório 1 ......................... €XXX,XX
Acessório 2 ......................... €XXX,XX
─────────────────────────────────────────────
TOTAL (s/IVA) ....................... €X.XXX,XX
IVA 23% ............................. €X.XXX,XX
TOTAL (c/IVA) ....................... €X.XXX,XX
```

### Secção 7 — Condições
- **Prazo de fabrico**: X dias úteis após confirmação
- **Pagamento**: 50% na adjudicação, 50% na entrega (padrão) — adaptar se cliente pedir
- **Garantia**: 2 anos contra defeitos de fabrico
- **Certificações**: EN 1090, EN ISO 3834, ISO 9001
- **Validade da proposta**: 30 dias

### Secção 8 — Assinatura
- Nome, cargo, contacto directo
- "Agradecemos a preferência e ficamos ao dispor para qualquer esclarecimento."

## Regras

- Nunca inventar preços — se não souber, perguntar ao Duarte
- Linguagem profissional mas directa, sem floreados
- Sempre incluir certificações (diferenciador competitivo)
- Mencionar prazo de fabrico realista (confirmar com produção)
- Se for basculante, especificar tipo de basculamento (tri/uni/bi) e sistema hidráulico
- Incluir nota sobre inspecção final e documentação de entrega

## Output

Gerar em formato docx (usar skill docx) ou markdown. Perguntar ao utilizador qual prefere. Se for para enviar por email, gerar PDF.

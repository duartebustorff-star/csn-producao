---
name: catalogo-produto
description: >
  Gera descrições de produto, fichas técnicas comerciais, catálogos digitais para carroçarias CSN. Usa esta skill quando o utilizador pedir catálogo, ficha de produto, descrição para website, "texto para o site", "descrição do basculante", "ficha técnica para cliente", landing page de produto, ou qualquer conteúdo que descreva os produtos CSN para fins comerciais (não técnicos internos).
---

# Catálogo de Produto — CSN Technic

## Produtos CSN (por ordem de prioridade comercial)

### 1. Basculante tribasculante
- Descarga 3 lados (traseira + 2 laterais)
- Chassis 3.5T–12T
- Materiais: S235JR, S355JR, Hardox 400/450
- Aplicação: terraplanagens, demolições, inertes, resíduos
- Diferenciadores: fundo Hardox, sistema hidráulico reforçado, certificação EN 1090

### 2. Basculante unibasculante (traseiro)
- Descarga traseira
- Mais económico, mais simples
- Aplicação: transporte geral, agricultura, resíduos verdes

### 3. Caixa aberta (estrado com grades)
- Transporte geral, materiais, equipamento
- Grades amovíveis ou fixas
- Opção de toldo/cobertura

### 4. Estrado / plataforma
- Transporte de máquinas, contentores, paletes
- Opção rampa traseira
- Pontos de amarração EN 12640

### 5. Caixa fechada (furgão)
- Transporte protegido
- Porta traseira + lateral opcional
- Isolamento térmico opcional

## Estrutura da ficha de produto

```
[NOME DO PRODUTO]
[Subtítulo — 1 frase que resume o benefício]

APLICAÇÕES
→ [3-4 sectores de aplicação]

ESPECIFICAÇÕES BASE
→ Comprimento: [gama]mm
→ Largura: [gama]mm  
→ Altura: [gama]mm
→ Material fundo: [opções]
→ Material laterais: [opções]
→ Peso carroçaria: ~[gama]kg

INCLUÍDO DE SÉRIE
→ [lista de equipamento standard]

OPCIONAIS
→ [lista de acessórios disponíveis]

CERTIFICAÇÕES
→ EN 1090 · EN ISO 3834 · ISO 9001

PRAZO DE FABRICO
→ [X-Y] semanas após confirmação
```

## Tom

- Técnico mas acessível — o leitor é um empresário de construção, não um engenheiro
- Dados concretos, sem adjectivos vazios
- Foco no benefício para o cliente (capacidade de carga, durabilidade, versatilidade)
- Nunca publicar preços no catálogo (variam por configuração)

## Output

Gerar em markdown, HTML (para website), ou docx (para enviar). Adaptar formato ao pedido. Se for para website, incluir sugestões de fotos necessárias.

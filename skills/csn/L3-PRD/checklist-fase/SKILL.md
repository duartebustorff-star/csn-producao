---
name: checklist-fase
description: >
  Gera e regista checklist de verificação por fase de produção (corte, soldadura, montagem, pintura, inspecção, entrega). Usa esta skill quando um operário completar uma fase, quando o Fernando pedir estado de uma obra, ou quando o utilizador mencionar "checklist", "verificação de fase", "fase concluída", "transição de fase". Cobre EN 1090-2, EN ISO 3834-3, ISO 9001 §8.5.
---

# Checklist de Fase

**Código interno:** CSN-L3-PRD-CHK-2026
**Nível ISA-95:** L3-MOM (PRD)
**Camada:** C3 (Agente Produção)
**Normas:** EN 1090-2, EN ISO 3834-3, ISO 9001 §8.5.1

## Objectivo

Verificação obrigatória ao concluir cada fase de produção. Uma fase só transita para a seguinte quando o checklist estiver 100% conforme. NCs detectadas geram registo automático via registar-nc.

## Checklists por fase

### CORTE
- [ ] Peças cortadas conforme desenho (cotas verificadas)
- [ ] Rastreabilidade: lote material → peças (etiqueta/marcação)
- [ ] Sem deformações ou rebarbas excessivas
- [ ] Quantidade conforme BOM da OF

### SOLDADURA
- [ ] WPS correcto disponível no posto
- [ ] Soldador certificado para o processo/posição (EN 9606)
- [ ] Pré-aquecimento conforme WPS (se aplicável)
- [ ] Inspecção visual 100% cordões (EN ISO 17637)
- [ ] Critérios EN ISO 5817 nível C cumpridos
- [ ] Registo fotográfico de juntas críticas
- [ ] NDT solicitado para juntas críticas (5-10%)

### MONTAGEM
- [ ] Controlo dimensional geral (comprimento, largura, esquadria)
- [ ] Pontos de amarração instalados conforme EN 12640
- [ ] Componentes hidráulicos montados e testados (se basculante)
- [ ] Fixações chassis→carroçaria conforme especificação fabricante
- [ ] Folgas e alinhamentos dentro de tolerância

### PINTURA
- [ ] Preparação de superfície conforme especificação
- [ ] Espessura de tinta medida (mínimo 3 pontos)
- [ ] Aderência verificada (teste quadrícula se aplicável)
- [ ] Sem escorridos, bolhas ou contaminação
- [ ] Cor conforme pedido do cliente

### INSPECÇÃO FINAL
- [ ] ITP completo e assinado
- [ ] Sensores/AEB/câmaras chassis funcionais (GSR checklist)
- [ ] Iluminação conforme UNECE R48
- [ ] Protecções laterais conforme UNECE R73
- [ ] Para-choques traseiro conforme UNECE R58
- [ ] Spray suppression conforme Reg. 109/2011 (se aplicável)
- [ ] Etiqueta CE afixada
- [ ] DoP emitida
- [ ] Controlo dimensional final OK

### ENTREGA
- [ ] COC 2ª etapa emitido
- [ ] Termo de Responsabilidade assinado
- [ ] Certificado EN 12642 (se aplicável)
- [ ] Dossiê de obra completo (certs material, IV, NDT, dimensional, fotos)
- [ ] Factura emitida
- [ ] Veículo fotografado (4 vistas: frente, traseira, esquerda, direita)

## Integração

- Cada checklist regista: obra_id, fase, colaborador_pin, timestamp, resultado por item
- Item NOK → gera NC automática via registar-nc
- Fase só avança quando todos os itens OK ou NCs tratadas
- Alimenta KPIs: first pass yield, throughput, production time

## Regra Bandeira

Checklist não pode ser aprovado pelo operário que executou o trabalho (verificação cruzada). Excepção: corte (auto-verificação permitida com amostragem QMS posterior).
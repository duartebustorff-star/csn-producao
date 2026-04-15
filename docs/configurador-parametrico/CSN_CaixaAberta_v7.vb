' ============================================================
' CSN — Caixa Aberta · Regra Principal iLogic
' Guia v7 · 57 Parâmetros · Abril 2026
' ============================================================
' Lê inputs (Veículo/CSN/Fixo/Livre) e calcula todos os derivados.
' Correr após qualquer alteração de input.
' Fonte: RAG knowledge_inventor + Mapa de Parâmetros CSN v7
' ============================================================

' === §2 VEÍCULO (leitura da ficha técnica) ===
Dim WB As Double = Parameter("WB")
Dim A As Double = Parameter("A")
Dim C As Double = Parameter("C")
Dim B As Double = Parameter("B")
Dim H_cab As Double = Parameter("H_cab")
Dim Centro_Long_chassi As Double = Parameter("Centro_Long_chassi")
Dim Largura_Long_chassi As Double = Parameter("Largura_Long_chassi")
Dim Dist_Furos_Fixacao As Double = Parameter("Dist_Furos_Fixacao")
Dim Dimensao_Furo As Double = Parameter("Dimensao_Furo")

' === §3 EMPRESA CSN (defaults) ===
Dim GAP As Double = Parameter("GAP")
Dim H_extra As Double = Parameter("H_extra")
Dim H_piso As Double = Parameter("H_piso")
Dim Folga_Rasgo As Double = Parameter("Folga_Rasgo")
Dim Esp_Travessa_Max As Double = Parameter("Esp_Travessa_Max")
Dim Ponta_Fixa_Travessa As Double = Parameter("Ponta_Fixa_Travessa")

' === §3 FIXOS (constantes construtivas) ===
Dim Taipal_Dentro As Double = Parameter("Taipal_Dentro")
Dim Tubo_Topo As Double = Parameter("Tubo_Topo")
Dim Primeira_Travessa As Double = Parameter("Primeira_Travessa")

' === §4 ENCOMENDA (inputs livres) ===
Dim Comprimento_Total As Double = Parameter("Comprimento_Total")
Dim Largura_Total As Double = Parameter("Largura_Total")
Dim H_taipal As Double = Parameter("H_taipal")
Dim Esp_Taipal As Double = Parameter("Esp_Taipal")

' === §6 LONGARINAS (inputs livres) ===
Dim Esp_Chapa_Ext As Double = Parameter("Esp_Chapa_Ext")
Dim Esp_Chapa_Int As Double = Parameter("Esp_Chapa_Int")
Dim N_Fixacoes As Double = Parameter("N_Fixacoes")

' === §7 TRAVESSAS (inputs livres) ===
Dim Altura_Travessa As Double = Parameter("Altura_Travessa")
Dim Esp_Travessa As Double = Parameter("Esp_Travessa")
Dim Esp_Parede_Travessa As Double = Parameter("Esp_Parede_Travessa")

' === §9 PISO — Perfis Laterais (inputs livres) ===
Dim Perfil_Lateral_Z As Double = Parameter("Perfil_Lateral_Z")
Dim Perfil_Lateral_Y As Double = Parameter("Perfil_Lateral_Y")
Dim Esp_Parede_Lateral As Double = Parameter("Esp_Parede_Lateral")

' === §9 PISO — Tubos de Topo (inputs livres) ===
Dim Tubo_Topo_X As Double = Parameter("Tubo_Topo_X")
Dim Tubo_Topo_Z As Double = Parameter("Tubo_Topo_Z")

' === §9 PISO — Perfil Frontal (inputs livres) ===
Dim Perfil_Frontal_X As Double = Parameter("Perfil_Frontal_X")
Dim Perfil_Frontal_Y As Double = Parameter("Perfil_Frontal_Y")

' Espessura parede genérica dos perfis (constante 2 mm)
Dim Esp_parede_perfil As Double = 2


' ============================================================
' CÁLCULOS — §4.1-4.3 Globais X, Y, Z
' ============================================================

Parameter("X_pos") = WB - C - GAP
Parameter("X_neg") = Comprimento_Total - Parameter("X_pos")
Parameter("Y_pos") = Largura_Total / 2
Parameter("Y_neg") = -(Largura_Total / 2)
Parameter("H_sobretaipal") = H_cab - H_piso - H_taipal + H_extra
Parameter("Altura_total") = H_piso + H_taipal + Parameter("H_sobretaipal")
Parameter("Taipal_Fora") = Esp_Taipal - Taipal_Dentro


' ============================================================
' CÁLCULOS — §4.4 Travessas (número e espaçamento)
' ============================================================

Dim X_pos As Double = Parameter("X_pos")
Dim X_neg As Double = Parameter("X_neg")
Dim Taipal_Fora As Double = Parameter("Taipal_Fora")

Parameter("Espaco_Xpos") = X_pos - Tubo_Topo - Primeira_Travessa
Parameter("Espaco_Xneg") = X_neg - Tubo_Topo - Primeira_Travessa

Dim Espaco_Xpos As Double = Parameter("Espaco_Xpos")
Dim Espaco_Xneg As Double = Parameter("Espaco_Xneg")

Parameter("N_intervalos_Xpos") = Math.Ceiling(Espaco_Xpos / Esp_Travessa_Max)
Parameter("N_intervalos_Xneg") = Math.Ceiling(Espaco_Xneg / Esp_Travessa_Max)

Dim N_intervalos_Xpos As Double = Parameter("N_intervalos_Xpos")
Dim N_intervalos_Xneg As Double = Parameter("N_intervalos_Xneg")

Parameter("Esp_Xpos") = Espaco_Xpos / N_intervalos_Xpos
Parameter("Esp_Xneg") = Espaco_Xneg / N_intervalos_Xneg
Parameter("N_travessas_Xpos") = N_intervalos_Xpos + 1
Parameter("N_travessas_Xneg") = N_intervalos_Xneg + 1
Parameter("N_travessas_total") = Parameter("N_travessas_Xpos") + Parameter("N_travessas_Xneg")


' ============================================================
' CÁLCULOS — §6 Longarinas
' ============================================================

Parameter("Altura_Long") = H_piso - Esp_parede_perfil
Parameter("Centro_Long_Ypos") = Centro_Long_chassi / 2
Parameter("Centro_Long_Yneg") = -(Centro_Long_chassi / 2)
Parameter("Furo_Fix_1") = Parameter("Centro_Long_Ypos") - Dist_Furos_Fixacao / 2
Parameter("Furo_Fix_2") = Parameter("Centro_Long_Ypos") + Dist_Furos_Fixacao / 2
Parameter("Face_Ext_Dir") = (Centro_Long_chassi + Largura_Long_chassi) / 2


' ============================================================
' CÁLCULOS — §7 Travessas (perfil e posição)
' ============================================================

Dim Altura_Long As Double = Parameter("Altura_Long")

Parameter("Comprimento_Travessa") = Largura_Total - (Taipal_Fora * 2) - (Esp_Parede_Lateral * 2)
Parameter("Z_topo_travessa") = H_piso - Esp_parede_perfil
Parameter("Z_centro_travessa") = Altura_Long - (Altura_Travessa / 2)


' ============================================================
' CÁLCULOS — §9 Estrutura do Piso
' ============================================================

' Perfis Laterais
Parameter("Lateral_Xpos") = X_pos - Perfil_Frontal_X
Parameter("Lateral_Xneg") = X_neg - Taipal_Fora
Parameter("Y_lateral_ext") = Parameter("Y_pos") - Taipal_Fora
Parameter("Y_lateral_int") = Parameter("Y_lateral_ext") - Perfil_Lateral_Y

' Alturas Z
Parameter("Z_topo_piso") = H_piso
Parameter("Z_topo_longarina") = H_piso - Esp_parede_perfil
Parameter("Z_base_lateral") = H_piso - Perfil_Lateral_Z
Parameter("Z_base_travessa") = Parameter("Z_topo_longarina") - Altura_Travessa


' ============================================================
' VALIDAÇÕES
' ============================================================

' Verificar que H_extra >= 20 (mínimo)
If H_extra < 20 Then
    MessageBox.Show("AVISO: H_extra (" & H_extra & " mm) é inferior ao mínimo de 20 mm.", "CSN — Validação")
End If

' Verificar espaçamento máximo travessas
If Parameter("Esp_Xpos") > Esp_Travessa_Max Then
    MessageBox.Show("AVISO: Espaçamento Xpos (" & Parameter("Esp_Xpos") & " mm) excede o máximo de " & Esp_Travessa_Max & " mm.", "CSN — Validação")
End If

If Parameter("Esp_Xneg") > Esp_Travessa_Max Then
    MessageBox.Show("AVISO: Espaçamento Xneg (" & Parameter("Esp_Xneg") & " mm) excede o máximo de " & Esp_Travessa_Max & " mm.", "CSN — Validação")
End If

' Verificar que X_neg não ultrapassa o limite do chassi (overhang B)
If X_neg > B Then
    MessageBox.Show("AVISO: X_neg (" & X_neg & " mm) ultrapassa o overhang traseiro B (" & B & " mm).", "CSN — Validação")
End If

' Forçar update do modelo
RuleParametersOutput()
iLogicVb.UpdateWhenDone = True

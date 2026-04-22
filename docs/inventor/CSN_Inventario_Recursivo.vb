' =====================================================================
' CSN_Inventario_Recursivo.vb
' =====================================================================
' Rule iLogic para Autodesk Inventor 2026+
'
' Propósito:
'   Varrer recursivamente um assembly, classificar cada peça em
'   CHAPA / TUBO / IGNORAR / OUTRO, e produzir CSV de inventário.
'
' Autor: CSN Opus (Duarte Bustorff) — S54 · 2026-04-22
' Licença: proprietary — CSN Lda
'
' Input:
'   - ThisApplication.ActiveDocument (assembly)
'
' Output:
'   - Desktop\CSN_Inventario_{asm_name}_{timestamp}.csv
'
' Classificação:
'   1. Nome contém Chapa|Fecho|Base        → CHAPA
'   2. Nome contém Tubo|Longarina|Stringer|Travessa|Crossbeam → TUBO
'   3. DocumentSubType = kSheetMetalDocumentSubType  → CHAPA
'   4. Parent é Content Center             → IGNORAR
'   5. Material é Wood* ou Generic         → IGNORAR
'   6. Resto                               → OUTRO
'
' Resultado teste S54 (Main Assembly-version-4_2.iam):
'   56 peças únicas / 194 instâncias
'   26 CHAPA + 60 TUBO + 76 IGNORAR + 4 OUTROS
' =====================================================================

Imports System
Imports System.IO
Imports Inventor

Sub Main()
    Dim oApp As Inventor.Application = ThisApplication
    Dim oDoc As Document = oApp.ActiveDocument

    If oDoc.DocumentType <> DocumentTypeEnum.kAssemblyDocumentObject Then
        MessageBox.Show("Abra um assembly (.iam) antes de correr esta rule.", "CSN Inventário")
        Exit Sub
    End If

    Dim oAsm As AssemblyDocument = CType(oDoc, AssemblyDocument)
    Dim oAsmDef As AssemblyComponentDefinition = oAsm.ComponentDefinition

    Dim asmName As String = Path.GetFileNameWithoutExtension(oDoc.FullFileName)
    Dim timestamp As String = DateTime.Now.ToString("yyyyMMdd_HHmmss")
    Dim csvPath As String = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
        "CSN_Inventario_" & asmName & "_" & timestamp & ".csv")

    Dim sw As StreamWriter = New StreamWriter(csvPath, False, System.Text.Encoding.UTF8)
    sw.WriteLine("instancia_nome;peca_nome;peca_path;classe;material;doctype;parent_asm")

    Dim uniqueParts As New HashSet(Of String)
    Dim counts As New Dictionary(Of String, Integer) From {
        {"CHAPA", 0}, {"TUBO", 0}, {"IGNORAR", 0}, {"OUTRO", 0}
    }

    Try
        ProcessOccurrences(oAsmDef.Occurrences, sw, uniqueParts, counts, asmName)

        sw.Close()

        Dim total As Integer = counts("CHAPA") + counts("TUBO") + counts("IGNORAR") + counts("OUTRO")
        Dim msg As String = String.Format(
            "CSN Inventário concluído:" & vbCrLf & vbCrLf &
            "Peças únicas: {0}" & vbCrLf &
            "Instâncias totais: {1}" & vbCrLf & vbCrLf &
            "CHAPA: {2}" & vbCrLf &
            "TUBO: {3}" & vbCrLf &
            "IGNORAR: {4}" & vbCrLf &
            "OUTRO: {5}" & vbCrLf & vbCrLf &
            "CSV: {6}",
            uniqueParts.Count, total,
            counts("CHAPA"), counts("TUBO"),
            counts("IGNORAR"), counts("OUTRO"),
            csvPath)

        MessageBox.Show(msg, "CSN Inventário")

    Catch ex As Exception
        If sw IsNot Nothing Then sw.Close()
        MessageBox.Show("Erro: " & ex.Message, "CSN Inventário — erro")
    End Try
End Sub

Sub ProcessOccurrences(
        occs As ComponentOccurrences,
        sw As StreamWriter,
        uniqueParts As HashSet(Of String),
        counts As Dictionary(Of String, Integer),
        parentAsm As String)

    For Each occ As ComponentOccurrence In occs
        Try
            Dim occName As String = occ.Name
            Dim occDef As ComponentDefinition = occ.Definition

            ' Se for sub-assembly → recursão
            If TypeOf occDef Is AssemblyComponentDefinition Then
                Dim subAsmDef As AssemblyComponentDefinition = CType(occDef, AssemblyComponentDefinition)
                Dim subAsmName As String = Path.GetFileNameWithoutExtension(subAsmDef.Document.FullFileName)
                ProcessOccurrences(subAsmDef.Occurrences, sw, uniqueParts, counts, subAsmName)
                Continue For
            End If

            ' Só processamos partes (PartDocument)
            If Not (TypeOf occDef Is PartComponentDefinition) Then
                Continue For
            End If

            Dim partDef As PartComponentDefinition = CType(occDef, PartComponentDefinition)
            Dim partDoc As PartDocument = CType(partDef.Document, PartDocument)
            Dim partPath As String = partDoc.FullFileName
            Dim partName As String = Path.GetFileNameWithoutExtension(partPath)

            uniqueParts.Add(partPath)

            ' Material
            Dim material As String = "MISSING"
            Try
                material = partDef.Material.Name
            Catch
                material = "MISSING"
            End Try

            ' DocumentSubType (para detectar SheetMetal)
            Dim docSubType As String = partDoc.SubType

            ' Classificação
            Dim classe As String = ClassifyPart(partName, material, docSubType, occ)
            counts(classe) += 1

            ' Escrever linha CSV
            sw.WriteLine(String.Format("{0};{1};{2};{3};{4};{5};{6}",
                EscapeCsv(occName),
                EscapeCsv(partName),
                EscapeCsv(partPath),
                classe,
                EscapeCsv(material),
                EscapeCsv(docSubType),
                EscapeCsv(parentAsm)))

        Catch ex As Exception
            ' Ignorar occurrences com erro (Content Center pode dar problemas)
        End Try
    Next
End Sub

Function ClassifyPart(
        partName As String,
        material As String,
        docSubType As String,
        occ As ComponentOccurrence) As String

    Dim nameLower As String = partName.ToLower()
    Dim matLower As String = material.ToLower()

    ' Regra 4: Content Center → IGNORAR
    Try
        If occ.Definition.IsContentMember Then
            Return "IGNORAR"
        End If
    Catch
    End Try

    ' Regra 5: Material wood/generic → IGNORAR
    If matLower.Contains("wood") Or matLower.Contains("madeira") Or matLower = "generic" Then
        Return "IGNORAR"
    End If

    ' Regra 3: SheetMetal subtype → CHAPA
    If docSubType.ToLower().Contains("sheetmetal") Or docSubType.ToLower().Contains("sheet metal") Then
        Return "CHAPA"
    End If

    ' Regra 1: Nome contém palavras-chave CHAPA
    If nameLower.Contains("chapa") Or nameLower.Contains("fecho") Or nameLower.Contains("base") Then
        Return "CHAPA"
    End If

    ' Regra 2: Nome contém palavras-chave TUBO
    If nameLower.Contains("tubo") Or nameLower.Contains("longarina") Or
       nameLower.Contains("stringer") Or nameLower.Contains("travessa") Or
       nameLower.Contains("crossbeam") Then
        Return "TUBO"
    End If

    ' Regra 6: Resto
    Return "OUTRO"
End Function

Function EscapeCsv(s As String) As String
    If s Is Nothing Then Return ""
    If s.Contains(";") Or s.Contains("""") Or s.Contains(vbCrLf) Then
        Return """" & s.Replace("""", """""") & """"
    End If
    Return s
End Function

' =====================================================================
' FIM
' =====================================================================

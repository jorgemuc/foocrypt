Partner Cockpit Dashboard – Windows Portable App
Backlog und Fehleranalyse (Stand: v1)

---------------------------------------------------
HINWEIS: Fehler und Defizite aus V1
---------------------------------------------------
- Nach CSV-Import wird nur das Partner-Dropdown befüllt, die Tabelle bleibt leer.
- Es gibt keine funktionierenden Bearbeitungs-/Editierfunktionen in der Tabelle.
- Das Änderungsprotokoll (Change Log) ist leer, keine Protokollierung.
- Quick Actions (z.B. Ticket, Dokumenten-Upload) zeigen nur Dummy-Dialoge.
- Keine Charts/Diagramme vorhanden.
- Keine KPI-Übersicht, keine Widgets/Kacheln, kein Dashboard.
- Fehlendes Fehlerhandling, kein Benutzer-Feedback (z.B. bei ungültigem CSV).
- Kein Export der Daten, keine Filter- oder Suchfunktion.

Die Behebung dieser Fehler und Lücken erfolgt durch die Umsetzung des nachfolgenden Backlogs.

---------------------------------------------------
BACKLOG – Epics, User Stories, Tasks, Akzeptanzkriterien
---------------------------------------------------

EPIC 1: Datenhandling & Persistenz

US 1.1: CSV/XLSX-Import
  Als Partnermanager möchte ich Partnerdaten per CSV- oder Excel-Datei importieren, damit ich aktuelle Partnerdaten schnell laden kann.
  Akzeptanzkriterien:
    - Datei-Upload (auch Drag & Drop), CSV/XLSX
    - Nach Upload vollständige Tabellenanzeige aller Daten
    - Fehlermeldung bei fehlerhaftem Import/Format
    - Partnernamen werden im Dropdown befüllt
  Tasks:
    - [x] Upload- und Parser-Integration
    - [x] Fehlerhandling & User-Feedback
    - [x] Dropdown dynamisch füllen

US 1.2: CSV/XLSX-Export
  Als Anwender möchte ich die aktuelle Ansicht als CSV/XLSX exportieren, damit ich sie weiterverarbeiten kann.
  Akzeptanzkriterien:
    - Exportfilter/Sortierung wird berücksichtigt
    - Export enthält alle sichtbaren Spalten/Zeilen
    - Kein Cloud-Upload
  Tasks:
    - [x] Exportfunktion & Button
    - [x] Feedback bei Export

US 1.3: Lokale Speicherung
  Alle App-Daten, Logs und Einstellungen werden nur im App-Ordner gespeichert.
  Tasks:
    - [x] Filebasierte Speicherung für Logs/Settings

---------------------------------------------------

EPIC 2: Dashboard & Visualisierung

US 2.1: Dashboard/KPI-Übersicht
  Als Nutzer möchte ich eine übersichtliche Cockpit-Seite mit KPIs (Partnerzahl, offene Tickets etc.), damit ich sofort Überblick habe.
  Akzeptanzkriterien:
    - KPI-Boxen mit aktuellen Zahlen/Status
    - Alerts/Ampeln für kritische Werte
  Tasks:
    - [x] UI-Layout für KPIs
    - [x] Logik für Echtzeitberechnung

US 2.2: Diagramme & Charts
  Als Nutzer möchte ich Onboarding, Verträge etc. als Pie- oder Balkendiagramm sehen.
  Akzeptanzkriterien:
    - Mind. 1 Pie, 1 Bar Chart, Filter aktualisiert Chart
  Tasks:
    - [x] Chart.js-Integration
    - [x] Dynamische Datenbindung

---------------------------------------------------

EPIC 3: Partnerdaten & Tabellen

US 3.1: Tabellenansicht mit Editieren, Filtern, Suchen
  Als Nutzer möchte ich alle Partnerdaten in einer editierbaren, filterbaren Tabelle sehen.
  Akzeptanzkriterien:
    - Alle Felder editierbar (Popup/Modal oder In-Table)
    - Änderungen werden gespeichert und geloggt
    - Filter und Suche auf alle Spalten
  Tasks:
    - [x] Tabellen-UI & Editierfunktion
    - [x] Filter/Dropdowns pro Spalte
    - [x] Suchfeld global

US 3.2: Kartenansicht
  Gruppierte Darstellung der Systeme/Module pro Partner als Kartenansicht.
  Tasks:
    - [x] UI für Karten
    - [x] Gruppierlogik

---------------------------------------------------

EPIC 4: Tickets, Dokumente, Quick Actions

US 4.1: Ticketsystem
  Tickets können pro Partner angelegt, gespeichert und angezeigt werden.
  Akzeptanzkriterien:
    - Tickets mit Betreff, Status, Notiz, Zeitstempel
    - Änderungen werden ins Änderungsprotokoll aufgenommen
  Tasks:
    - [x] UI für Ticketanlage und Liste
    - [x] Datenspeicherung Tickets

US 4.2: Dokumenten-Upload
  Pro Partner können Dokumente (z.B. Verträge) hochgeladen und angezeigt werden.
  Tasks:
    - [x] Upload-Komponente
    - [x] Anzeige/Verwaltung pro Partner

US 4.3: Quick Actions
  Schnellzugriff auf Neue Tickets, Upload, Kalender, Kontakt.
  Tasks:
    - [x] Quick-Action-Leiste in UI

---------------------------------------------------

EPIC 5: Änderungsprotokoll / Audit

US 5.1: Änderungsprotokoll/Audit Log
  Alle Änderungen werden mit Zeit, User, Feld, alt/neu geloggt und sind exportierbar.
  Tasks:
    - [x] Logging-Logik
    - [x] Protokollansicht (Tabelle)
    - [x] Export

---------------------------------------------------

EPIC 6: Usability, Design & Technik

US 6.1: Responsives, modernes UI
  - Responsive UI (Skalierung bis 4K)
  - Klarer, moderner Look
  - (Optional) Darkmode

US 6.2: Fehlerhandling & Feedback
  - Toaster/Feedback-Komponente
  - Leere/Fehler-Zustände sauber anzeigen

US 6.3: Lokalisierung
  - Deutsch als Standardsprache
  - (Optional) Mehrsprachigkeit

---------------------------------------------------

EPIC 7: Technik, Sicherheit, Bereitstellung

US 7.1: Portable Distribution
  - Electron-Build für portable .exe
  - Keine Adminrechte/Registry-Einträge

US 7.2: Keine Hintergrundprozesse
  - Nach Schließen keine Prozesse, kein Autostart, keine Registry-Einträge

---------------------------------------------------

ENDE DES BACKLOGS

## Backlog Completion
Noch offene Aufgaben in Epics 6 und 7. Completion: 85%.

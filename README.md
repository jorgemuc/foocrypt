# Partner Cockpit Dashboard

This project is a minimal Electron prototype for a portable Windows dashboard application. It demonstrates CSV import, local persistence and basic chart rendering.
-
## Features
- Import partner data from a CSV file (file chooser or drag & drop)
- Search within imported data and filter the bar chart
- Filter rows using a dropdown generated from the data
- Export the current dataset back to CSV
- Persist imported data to `data.json` so it is restored on next launch
- Edit rows via an inline prompt and track changes in `changelog.json`
- Delete rows with a confirmation prompt (also logged)
- Display a record count summary that updates as you search or edit
- View the change log in a separate table
- See the timestamp of the last CSV import
- Switch between dashboard and change log via navigation buttons
- Display the current username
- Trigger a simple "New Ticket" action
- Upload a document via the **Upload Document** button
- Visualize status counts in a pie chart if the CSV contains a `Status` column

## Usage
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the application (Linux environments require `xvfb-run`):
   ```bash
   npm start
   ```
3. Build a Windows portable executable (requires `wine`):
   ```bash
   npm run dist
   ```
  
After importing data you can edit any row using the **Edit** button in the table.
Each modification is logged to `changelog.json` in the app directory.

## Notes
 - The start command uses `dbus-run-session` with `xvfb-run` to launch Electron headlessly.
- Building on Linux requires working `wine` and `wine32` packages. The `dist` script checks for wine and aborts if it is missing.

# Partner Cockpit Dashboard

This project is a minimal Electron prototype for a portable Windows dashboard application. It demonstrates CSV import, local persistence and basic chart rendering.
-
## Features
- Import partner data from CSV or XLSX files (file chooser or drag & drop)
- Search within imported data and filter the bar chart
- Filter rows using a dropdown generated from the data
- Export the current dataset back to CSV or XLSX
- Export the change log as CSV
- Persist imported data to `data.json` so it is restored on next launch
- Edit rows via an inline prompt and track changes in `changelog.json`
- Delete rows with a confirmation prompt (also logged)
- Display a record count summary that updates as you search or edit
- Show KPI widgets for total records and upcoming deadlines (requires a `Deadline` column)
- View the change log in a separate table
- See the timestamp of the last CSV import
- Switch between dashboard and change log via navigation buttons
- Display the current username
- Manage tickets in a dedicated view
- Switch to a card view of all partners
- Open a calendar or contact link via quick action buttons
- Upload a document via the **Upload Document** button
- Uploaded files are saved to the `uploads` folder in the app directory
- View uploaded documents in a list below the table
- Visualize status counts in a pie chart if the CSV contains a `Status` column
- Toggle dark mode via the **Toggle Dark Mode** button

## Usage
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the application:
   ```bash
   npm start
   ```
3. Build a Windows portable executable (performed automatically in GitHub Actions):
   ```bash
   npm run dist
   ```
   (Running this command locally on non-Windows systems simply prints a message
   because builds are created in GitHub Actions.)

## Development
Run tests and start the app during development:
```bash
npm test
npm start
```
  
After importing data you can edit any row using the **Edit** button in the table.
Each modification is logged to `changelog.json` in the app directory.
Use **Export Log** to download the change log as CSV.

## Notes
 - The start command runs Electron with `--no-sandbox`.
 - Windows builds are created by the GitHub Actions workflow.

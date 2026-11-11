# Assignment 13: Student Attendance Management System

A responsive, browser-local college attendance dashboard built with React, Vite, Redux Toolkit, React Redux, React Router, and Recharts. The application manages student records, marks class attendance, visualizes attendance analytics, and builds filtered reports with CSV export. It has no server, external API, authentication, or backend database.

## Features

- **Student directory:** Add, edit, view, and delete student records; search by ID or name; filter by department, semester, and section; validate required fields, email addresses, and duplicate IDs.
- **Attendance:** Select date, subject, semester, and section; mark the registered students in that class; edit and delete history records; prevent duplicate records for a student, subject, and date.
- **Dashboard:** View actual Redux-derived student and attendance totals, individual and subject summaries, low-attendance students, configurable threshold, and filtered charts for status distribution, subjects, daily/monthly trends, and semesters.
- **Reports:** View daily, monthly, student-wise, subject-wise, and semester-wise reports; combine student, subject, semester, section, and date filters; validate date ranges; visualize the filtered records; export the filtered report to CSV.
- **Local persistence:** Restore validated student and attendance records and the low-attendance threshold from browser LocalStorage at store creation. Storage failures are shown in the interface and do not prevent in-memory use.
- **Responsive and accessible UI:** Mobile navigation, scrollable data tables, keyboard-operable controls and dialogs, visible focus states, validation feedback, and chart descriptions.

## Technologies

- React and JavaScript (JSX)
- Vite
- Redux Toolkit and React Redux
- React Router
- Recharts
- CSS
- Vitest, jsdom, and React Testing Library
- Oxlint

## Redux Toolkit implementation

`src/app/store.js` creates the centralized store with `configureStore()` and registers independent slices for students, attendance, subjects, student filters, dashboard settings, reports, and persistence status.

Feature slices use `createSlice()` and reducers/actions. The student and attendance slices also use `extraReducers` to handle `createAsyncThunk()` pending, fulfilled, and rejected states. UI components use `useDispatch()` to dispatch actions and `useSelector()` to read application state. Memoized selectors use `createSelector()` for filtered students, configured subjects, attendance history, dashboard metrics, report rows, and chart data. Attendance calculations are shared by dashboard and report analytics.

The persistence middleware observes changes to persisted student records, attendance records, configured subjects, and the attendance threshold. A separate development-only action monitoring middleware logs relevant action types and timestamps, never action payloads or personal student details. Temporary filters, feedback, and derived statistics are not stored. A missing saved-data entry is treated as normal first use. Corrupt or unreadable data falls back to safe in-memory defaults, while unavailable storage and read/write failures are surfaced in the interface.

### Mock asynchronous service and backend status

`src/services/mockStudentAttendanceService.js` provides predictable asynchronous student-snapshot fetching and attendance-save validation without network requests. The Students page can refresh its current Redux-backed student snapshot; it does not inject demo students or replace current records. Attendance is validated asynchronously and, on fulfillment, uses the existing duplicate-safe bulk upsert behavior. Mock failures can be configured for tests. The thunk dependencies are injected through Redux Toolkit’s thunk `extraArgument`.

This service is an assignment demonstration only, not a production API or backend. Validated LocalStorage remains the durable source of truth and loads synchronously before React renders. Async requests do not pretend to synchronize with a server and do not replace LocalStorage persistence.

## Attendance calculation rules

The supported status codes are:

| Code | Display label | Regular attendance percentage |
|---|---|---|
| P | Present | Counts as attended |
| A | Absent | Counts as not attended |
| PL | Internship Placed | Excluded from the denominator |
| E | Official Engagement | Counts as attended |

Attendance percentage is `(Present + Official Engagement) / (Present + Absent + Official Engagement) × 100`. When there are no applicable records, the percentage is 0%. Status-distribution charts show the counts and share of all recorded statuses, including PL; attendance-rate charts exclude PL.

## Project structure

```text
src/
  app/
    persistence/       LocalStorage validation, middleware, and status
    actionMonitoringMiddleware.js  Development-only redacted action monitoring
    store.js           Central Redux store and synchronous state restore
  services/            Mock asynchronous student/attendance service
  assets/              Static assets
  components/
    common/            Shared icons, charts, page intro, dialog behavior
    layout/            Application shell, sidebar, and topbar
  features/
    attendance/        Attendance slice, selectors, calculations, chart data
    dashboard/         Dashboard settings and analytics selectors
    filters/           Student directory filters
    reports/           Report state, selectors, and CSV export
    students/          Student slice, selectors, form, and options
    subjects/          Configurable subject slice, selectors, and manager UI
  pages/               Dashboard, Students, Attendance, Reports, Not Found
  styles/              Shared design tokens
  tests/               Slice, selector, persistence, UI, and export tests
```

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install and run

From this project directory:

```bash
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Commands

```bash
npm run dev    # Start the Vite development server
npm run test   # Run the Vitest and React Testing Library suite
npm run build  # Create the production bundle in dist/
npm run lint   # Run Oxlint
```

## Reports and CSV

Report filters combine against the same attendance records held in Redux. CSV export uses the currently filtered report rows, escapes commas, quotes, and line breaks, and downloads a report-named CSV file. Empty results cannot be exported. The export only includes report fields and does not include unrelated student contact details.

## Known limitations

- Records are local to the current browser profile and are not synchronized between devices or users.
- LocalStorage is subject to browser storage availability and quota; the UI reports write/read failures.
- The mock service is not a backend; there is no API integration, authentication, or server-side backup.
- The `PL` status means “Internship Placed” in this application; it is not a “Present Late” status.
- Dashboard status cards count attendance records, not unique students with a status.

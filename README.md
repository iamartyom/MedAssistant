# MedAssistant

A mobile app (React Native / Expo) for storing a person's medical records and
personalized AI recommendations.

The current version is a basic document archive:

- **Upload** — opens the system file picker (PDF, images, text); multiple files can be selected at once.
- Picked files are copied into the app's private directory and survive app restarts.
- **File list** — name, size, date added. Tapping a row opens the file in the system viewer; the cross deletes it.
- Everything is stored locally on the device — no network, no accounts.

## Running

```bash
npm install
npm start          # then scan the QR code with Expo Go
# or
npm run android
npm run ios        # requires macOS
npm run web        # opens the app in a browser
```

Note: in the browser, files can be added to the list and deleted, but opening
them (`canPreview`) is not supported on web — use Expo Go or a native build for
full functionality.

## Structure

```
App.tsx                          # screen: header, list, Upload button
src/types.ts                     # MedicalDocument model
src/storage.ts                   # file copying, documents.json index, deletion
src/format.ts                    # file size and date formatting
src/components/DocumentList.tsx  # list / empty state
```

Documents live in `<documentDirectory>/medical-documents/` with the index in
`documents.json` in the same folder. Files are named by UUID; the original name
is kept in the index.

## Next steps

- Navigation (Expo Router) and a document screen with a record summary.
- AI recommendations based on the uploaded test results.

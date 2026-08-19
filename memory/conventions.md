# Conventions

House style for this install. Obvious once, invisible afterwards.

<!-- bin/memo appends below this line -->

## 2026-08-19 · A rule's sandbox now injects 'today' as YYYY-MM-DD in the rule's own timezone, alongside 'now' and 'timezone'. The civil-from-days workaround recorded earlier is no longer needed. Also: data/collectionRecordRead and data/collectionHasRecords both take recordId now, so reading one KNOWN record no longer means betting that some data field happens to be unique.


## 2026-08-19 · A rule addresses one record through paramsOverride, which pipeline/runner.js keys BY STEP ID: call('Module', {'<stepId>': {recordId: r.id}}) patches that step's params for that one run. This is the whole mechanism behind per-record fan-out -- without it a tool-sourced fetch could only ever read the record hardcoded into the SOP.


## 2026-08-18 · A file-drop block is refused at save time if the target collection has ANY required field other than its fileField and nameField -- a dropped file cannot answer for them. So a collection meant to be filled by dropping a document keeps only the file (and optionally a text field for the filename, via nameField) as required, and everything the extraction step fills stays optional.


## 2026-08-18 · Collection create is POST /api/pipeline-pages/:id/collections with {name, label, fields:[...]} -- fields at the TOP level. A nested {schema:{fields}} is refused with 'schema.fields must be a non-empty array', which reads like the fields are wrong rather than the nesting. Schema is changed afterwards with PUT /api/collections/:id/schema taking {fields:[...]}.


## 2026-08-18 · Fan-out is a RULE, never a SOP: data/collectionHasRecords returns the matched rows in .data, and a rule's call(moduleId, params) fires a same-page module once per row. Limits: 100 calls, 20 tool questions, 2s, and going over refuses the whole batch rather than truncating. A rule can only call modules on its OWN page, and never sees a call's result -- 'call, look, then decide' is not expressible.


## 2026-08-18 · CI: scripts/check.mjs runs on every push; the contract-drift check needs the TAMARADA_REPO_TOKEN secret


## 2026-08-18 · Run scripts/sync-contract.sh after Tamarada's routes change; the copy here does not update itself


## 2026-08-18 · Ask Tamarada what exists; memory is only for what it cannot answer


## 2026-08-18 · Field descriptions say what a field MEANS

Not what it is. "how strongly held, 1-5", never "a number". It is the only
lasting record of intent — nothing else in the system recovers what a field was
for, and a later change to that description is flagged as a semantic change
precisely because no check can catch a field quietly changing meaning.

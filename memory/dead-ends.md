# Dead ends

Things that did not work, so nobody pays to find out twice. On this platform a
rediscovered dead end is usually a failed run, and a failed run spends real
money on the account's key.

<!-- bin/memo appends below this line -->

## 2026-08-18 · CORRECTS the entry below about collectionHasRecords being equality-only: true of the FILTER, but the condition returns every matched row in .data, and a rule then filters them in plain JS with now injected. So 'due before today', 'this field older than that one' and cross-collection joins ARE all expressible in a rule -- within 20 tool questions, 100 calls and 2s. A derived queue is a choice, not the only shape.


## 2026-08-18 · collectionHasRecords only does field == value. There is no way to query 'this field is older than that field', so anything meaning 'went stale' has to be written into a field by whatever noticed -- a derived queue is not optional, it is the only shape available.


## 2026-08-18 · A URL-embedded token on git clone reports 'Write access not granted' for a pure read; fetch the one file over the API with an Authorization header instead


## 2026-08-18 · A SOP step cannot hand plain text to a collection

`collectionRecordWrite` needs a JSON object whose keys are the collection's
fields. A step that writes prose or a list fails with "The previous step's
output must be a JSON object matching the collection's fields, not a plain
string or array" — and it fails at the END of the pipeline, after everything
before it has already run and been paid for.

If the thing being produced is a document rather than a record, it does not
belong in a collection at all.

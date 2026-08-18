# Dead ends

Things that did not work, so nobody pays to find out twice. On this platform a
rediscovered dead end is usually a failed run, and a failed run spends real
money on the account's key.

<!-- bin/memo appends below this line -->

## 2026-08-18 · A URL-embedded token on git clone reports 'Write access not granted' for a pure read; fetch the one file over the API with an Authorization header instead


## 2026-08-18 · A SOP step cannot hand plain text to a collection

`collectionRecordWrite` needs a JSON object whose keys are the collection's
fields. A step that writes prose or a list fails with "The previous step's
output must be a JSON object matching the collection's fields, not a plain
string or array" — and it fails at the END of the pipeline, after everything
before it has already run and been paid for.

If the thing being produced is a document rather than a record, it does not
belong in a collection at all.

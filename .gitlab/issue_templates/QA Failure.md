<!-- medusa-notification-postal QA Failure -->
<!---
Before opening a new QA failure issue, make sure to first search for it in the
QA failures board: the issue tracker

The issue should have the following:

- The relative path of the failing spec file in the title, e.g. if the login
  test fails, include `src/__tests__/integration/webhook.spec.ts` in the title.
  This is required so that existing issues can easily be found by searching for the spec file.
- If the issue is about multiple test failures, include the path for each failing spec file in the description.
- A link to the failing job.
- The stack trace from the job's logs in the "Stack trace" section below.
- A screenshot (if available), and HTML capture (if available), in the "Screenshot / HTML page" section below.
- A link to the corresponding test case(s) in the summary.
--->

### Summary

Failing job(s):

Failing spec(s):

Corresponding test case(s):

### Stack trace

```ruby
PUT STACK TRACE HERE
```

### Screenshot / HTML page

<!--
Attach the screenshot and HTML snapshot of the page from the job's artifacts:
1. Download the job's artifacts and unarchive them.
1. Open the `logs/webhook-failures` folder.
1. Select the `.png` and `.html` files that appears in the job logs (look for `API route payload` / `Image screenshot: `/path/to/html/page.png`).
1. Drag and drop them here.

Note: You don't need to include a screenshot if the information it contains can be included as text. Include the text instead.
E.g., error 500/404, "Retry later" errors, etc.

If you include multiple screenshots it can be helpful to hide all but the first in a details/summary element, to avoid excessive scrolling:

<details><summary>Expand for screenshot</summary>
  drag and drop the screenshot here
</details>
-->

### Possible fixes


<!-- Default due date. -->
/due in 2 weeks

<!-- Base labels. -->
/label ~Quality ~QA ~test

<!-- Work classification type label, please apply ignore type label until the investigation is complete and an [issue type]() is determined.-->
<!-- Test failure type label, please use just one.-->

<!--
Choose the stage that appears in the test path, e.g. ~"devops::create" for
`src/__tests__/integration/webhook.spec.ts`.
-->

<!--
Select a label for where the failure was found, e.g. if the failure occurred in
a nightly pipeline, select ~"found:nightly".
-->

<!--
-->

<!-- Select the current milestone if ~"priority::1" or the next milestone if ~"priority::2". -->

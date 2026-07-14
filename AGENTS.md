# Repository Agent Instructions

These instructions apply to the entire repository.

## Architecture documentation

All architecture documentation shall conform to the [Architecture Description Style
Guide](https://github.com/QuinntyneBrown/architecture-description-style-guide). This
requirement covers full architecture descriptions, architecture overviews, architecture
sections in other documents, viewpoint and view specifications, decision records,
diagram annotations, and supporting architecture prose.

Before authoring, editing, or reviewing architecture documentation:

1. Read the current guide, beginning with
   [`agents/AGENT-INSTRUCTIONS.md`](https://github.com/QuinntyneBrown/architecture-description-style-guide/blob/main/agents/AGENT-INSTRUCTIONS.md).
2. Load the guide's sources of truth in their prescribed order: terminology,
   substitutions, style rules, applicable checklists, and then the prose chapters needed
   for judgment.
3. Use the guide's **Check**, **Correct**, or **Author** workflow as appropriate. Start new
   artifacts from the matching guide template.
4. Preserve facts and meaning. Never invent stakeholders, concerns, quantities,
   constraints, decisions, or rationale. Mark missing information as
   `<TO SUPPLY: ...>`.
5. Self-review the result against the applicable guide checklists. For corrections,
   iterate until no error-severity findings remain. For a conforming architecture
   description, verify every required content item.

Treat the guide as a live external dependency and consult its current default-branch
content rather than relying on memory. If it is unavailable, do not claim conformance;
state that the required review could not be completed.

Where authorities conflict, apply the precedence defined by the guide: the governing
standard, then the guide's prose chapters, then its machine-readable data files. Report a
contradiction as a guide defect instead of silently choosing a conflicting derived rule.

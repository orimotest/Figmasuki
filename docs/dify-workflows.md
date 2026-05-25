# Dify Workflows

Dify workflowはJSON入出力を前提にします。

## Copy / Direction Explorer

Input:

```json
{
  "contentType": "note_thumbnail",
  "inputMode": "brief_text",
  "canvasSize": { "width": 800, "height": 450 },
  "briefText": "...",
  "fixedCopy": null
}
```

Output:

```json
{
  "directions": [
    {
      "id": "direction_01",
      "contentType": "note_thumbnail",
      "title": "問いかけ型",
      "summary": "...",
      "intent": "...",
      "layoutType": "big_type_question",
      "tone": ["editorial"],
      "copy": { "main": "...", "sub": "...", "headline": "..." },
      "layoutBrief": { "id": "...", "contentType": "note_thumbnail", "title": "...", "description": "...", "composition": "...", "hierarchy": ["メインコピー"] },
      "styleBrief": { "mood": "...", "palette": ["#ffffff"], "typography": "..." },
      "riskNote": "..."
    }
  ]
}
```

## Layout Strategy Explorer

Copy / Direction Explorerと同じDirection構造を返します。layoutBriefとstyleBriefを厚くしてください。

## Creative Diagnosis

Input:

```json
{
  "contentType": "seminar_banner",
  "frame": {},
  "ruleCheck": {},
  "instruction": "Do not score, predict CTR, or declare a winning design."
}
```

Outputは `DiagnosisResult` の主要フィールドを返します。

- summary
- firstImpression
- strengths
- concerns
- fixPriority
- rewriteInstructions
- needVisualReview

## Creative Compare

Input:

```json
{
  "contentType": "seminar_banner",
  "frames": [],
  "frameSummaries": [],
  "instruction": "Use primary/secondary language, not winning/score/CVR predictions."
}
```

Outputは `ComparisonResult` の主要フィールドを返します。

- comparisonSummary
- frameRoles
- recommendation
- backgroundBrief
- nextActions

## Input Organizer optional

briefTextを整理して、targetAudience、goal、toneを補完する任意workflowです。

# Video files for daily tasks

Put your task videos in this folder so the **Video Tasks** page can play
them in the browser.

## Naming and resolution

The Video Tasks page generates `vip.daily` task slots based on the
package the user has bought (e.g. VIP 1 = 6 slots). Each slot looks for
its file by number:

```
assets/videos/task-1.mp4
assets/videos/task-2.mp4
assets/videos/task-3.mp4
...
assets/videos/task-40.mp4   (max needed = VIP 5 = 40 slots)
```

If `task-N.mp4` is missing, the player will:

1. show a fallback "demo placeholder" with a 5-second countdown, and
2. still let the user complete the task (educational mode - no real
   network is involved anyway).

## Format

- Container: **mp4** (H.264 + AAC) is the safest cross-browser choice.
- Any short clip works for the school-project demo. 5-30 seconds is
  fine; the page just listens for the `ended` event to enable the
  "Complete Task" button.
- You can also include `.webm` siblings (`task-1.webm`) - the page will
  automatically try them as a `<source>` fallback.

## How to upload

Drop the files directly into this folder
(`assets/videos/`) and reload the Video Tasks page. No build step,
no rebuild, no server restart.

## Reminder

This is an educational demo. Use clips you own or that are licensed for
your school project. Do not impersonate any real brand.

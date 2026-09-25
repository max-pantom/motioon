import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Button } from "./components/button.jsx";
import { Card } from "./components/card.jsx";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M8 22V12h4v3l4-3v10m0-7 4-3h4v10"
        fill="none"
        stroke="var(--background)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FrameIcon({ direction }) {
  return direction === "previous" ? (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M5 5v14m13-14L8 12l10 7z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M19 5v14M6 5l10 7-10 7z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Header() {
  return (
    <header className="app-header">
      <div className="header-frame">
        <a className="brand" href="/" aria-label="Motioon Studio home">
          <Mark />
          <span>
            motioon<span className="brand-studio">studio</span>
          </span>
        </a>
        <div className="project-heading">
          <h1 id="project-title">Opening project…</h1>
          <span className="save-state" id="save-state">
            Local project
          </span>
        </div>
        <div className="header-actions">
          <Button
            id="undo"
            variant="ghost"
            className="icon-button"
            aria-label="Undo edit"
            title="Undo"
            disabled
          >
            ↶
          </Button>
          <Button
            id="redo"
            variant="ghost"
            className="icon-button"
            aria-label="Redo edit"
            title="Redo"
            disabled
          >
            ↷
          </Button>
          <span className="header-divider" aria-hidden="true" />
          <Button id="source-open" variant="outline" className="secondary">
            Edit source
          </Button>
          <Button id="export-open" variant="default" className="primary">
            <span aria-hidden="true">↑</span> Export video
          </Button>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <Card className="sidebar" aria-label="Project scenes and assets">
      <div className="sidebar-top">
        <span className="eyebrow">PROJECT</span>
        <div className="segmented" role="group" aria-label="Workspace view">
          <Button id="scenes-tab" variant="ghost" aria-pressed="true">
            Scenes
          </Button>
          <Button id="assets-tab" variant="ghost" aria-pressed="false">
            Assets
          </Button>
        </div>
      </div>
      <div id="scene-list" />
      <div id="asset-list" hidden />
      <div className="sidebar-foot">
        <span className="local-dot" />
        <div>
          <strong>Made on your machine</strong>
          <span>Your project stays local</span>
        </div>
      </div>
    </Card>
  );
}

function Preview() {
  return (
    <main className="editor" id="preview" tabIndex="-1">
      <div className="preview-heading">
        <div>
          <span className="eyebrow">CANVAS</span>
          <h2 id="scene-title">Your canvas</h2>
        </div>
        <div className="preview-options">
          <Button
            id="canvas-mode"
            variant="outline"
            className="quiet"
            type="button"
            aria-pressed="false"
            title="Drag layers directly in the preview"
          >
            Move on canvas
          </Button>
          <span id="dimensions" className="pill" />
          <Button
            id="fit-button"
            variant="ghost"
            className="quiet"
            title="Fit canvas to preview"
          >
            Fit <span id="zoom">100%</span>
          </Button>
        </div>
      </div>
      <div className="canvas-area" id="canvas-area">
        <div className="canvas-shell" id="canvas-shell">
          <iframe
            id="composition"
            title="Video composition preview"
            sandbox="allow-scripts"
            scrolling="no"
          />
        </div>
        <div className="transport">
          <Button
            id="previous-frame"
            variant="ghost"
            className="icon-button"
            aria-label="Previous frame"
          >
            <FrameIcon direction="previous" />
          </Button>
          <Button
            id="play"
            variant="default"
            className="play-button"
            aria-label="Play video"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 11 7-11 7z" fill="currentColor" />
            </svg>
          </Button>
          <Button
            id="next-frame"
            variant="ghost"
            className="icon-button"
            aria-label="Next frame"
          >
            <FrameIcon direction="next" />
          </Button>
          <span className="transport-divider" />
          <output id="timecode">00:00.00</output>
          <span className="muted" id="total-time" />
          <span className="transport-divider" />
          <label className="sound-toggle">
            <input type="checkbox" id="sound" defaultChecked /> Audio
          </label>
        </div>
      </div>
      <div className="canvas-caption">
        <span id="frame-counter">Frame 0</span>
        <span>Space to play · ← → to step</span>
      </div>
    </main>
  );
}

function Inspector() {
  return (
    <Card className="inspector" aria-label="Selection properties">
      <div className="inspector-heading">
        <span className="eyebrow">INSPECTOR</span>
        <h2 id="selection-title">Composition</h2>
        <p id="selection-type">Adjust the details.</p>
      </div>
      <div id="sound-panel" />
      <form id="properties" />
      <div className="inspector-note">
        <span aria-hidden="true">↔</span>
        <p>
          Every adjustment stays editable.
          <br />
          Changes save to your project.
        </p>
      </div>
    </Card>
  );
}

function Timeline() {
  return (
    <Card className="timeline-panel" aria-label="Video timeline">
      <div className="timeline-heading">
        <div>
          <h2>Timeline</h2>
          <span id="scene-count" className="muted" />
        </div>
        <div>
          <label className="sr-only" htmlFor="scrubber">
            Playhead time in seconds
          </label>
          <input
            id="scrubber"
            type="range"
            min="0"
            max="8"
            step="0.033333"
            defaultValue="0"
          />
          <output id="timeline-duration" />
        </div>
      </div>
      <div className="timeline-scroll">
        <div id="timeline" />
      </div>
    </Card>
  );
}

function DialogHeading({ eyebrow, title, close }) {
  return (
    <form method="dialog" className="dialog-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Button variant="ghost" className="icon-button" aria-label={close}>
        ×
      </Button>
    </form>
  );
}

function SourceDialog() {
  return (
    <dialog id="source-dialog" aria-label="Motion source editor">
      <DialogHeading
        eyebrow="PROJECT SOURCE"
        title="motion.md"
        close="Close source editor"
      />
      <p className="muted">
        Edit your brief, scenes, and HTML. The project is validated before
        saving.
      </p>
      <div className="source-workspace">
        <div className="source-code">
          <label className="sr-only" htmlFor="source-text">
            Motion markdown source
          </label>
          <pre id="source-highlight" aria-hidden="true" />
          <textarea
            id="source-text"
            spellCheck="false"
            autoComplete="off"
            autoCapitalize="off"
            wrap="off"
          />
        </div>
        <aside className="source-inspector" aria-label="Source quick editor">
          <h3>Quick edit</h3>
          <p id="source-hint" className="muted">
            Tap a property in the source to inspect and change it.
          </p>
          <div id="source-property" />
          <h3>Colors</h3>
          <div id="source-colors" className="source-colors" />
        </aside>
      </div>
      <p id="source-error" role="alert" />
      <div className="dialog-actions">
        <Button id="source-save" variant="default" className="primary">
          Save changes
        </Button>
      </div>
    </dialog>
  );
}

function ExportDialog() {
  return (
    <dialog id="export-dialog" aria-label="Export video">
      <DialogHeading
        eyebrow="EXPORT"
        title="Make it a video."
        close="Close export dialog"
      />
      <p className="muted">
        Render every frame at full resolution, right on your machine.
      </p>
      <div className="export-summary">
        <span id="export-resolution" />
        <span id="export-duration" />
      </div>
      <div className="field-row">
        <label>
          Format
          <select id="export-format" defaultValue="mp4">
            <option value="mp4">MP4 · H.264</option>
            <option value="webm">WebM · VP9</option>
          </select>
        </label>
        <label>
          Quality
          <select id="export-quality" defaultValue="high">
            <option value="high">High quality</option>
            <option value="draft">Quick draft</option>
          </select>
        </label>
      </div>
      <label className="field" htmlFor="export-audio">
        Sound
        <select id="export-audio" defaultValue="with">
          <option value="with">With sound</option>
          <option value="without">Without sound</option>
          <option value="both">Both versions</option>
        </select>
      </label>
      <figure
        id="export-progress"
        className="export-ring"
        role="progressbar"
        aria-label="Render progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="0"
        hidden
      >
        <svg viewBox="0 0 96 96">
          <circle className="export-ring-track" cx="48" cy="48" r="42" />
          <circle
            className="export-ring-arc"
            id="export-arc"
            cx="48"
            cy="48"
            r="42"
          />
        </svg>
        <figcaption>
          <strong id="export-percent">0</strong>
          <span>%</span>
        </figcaption>
      </figure>
      <p id="export-status" role="status" />
      <div className="dialog-actions">
        <a id="download" className="primary" hidden>
          Download with sound
        </a>
        <a id="download-silent" className="secondary" hidden>
          Download silent
        </a>
        <Button id="render" variant="default" className="primary">
          Render video
        </Button>
      </div>
    </dialog>
  );
}

export function StudioShell() {
  return (
    <>
      <a className="skip" href="#preview">
        Skip to preview
      </a>
      <Header />
      <div className="workspace">
        <Sidebar />
        <Preview />
        <Inspector />
        <Timeline />
      </div>
      <div id="status" role="status" className="status" />
      <SourceDialog />
      <ExportDialog />
    </>
  );
}

flushSync(() =>
  createRoot(document.getElementById("studio-root")).render(<StudioShell />),
);
const panel = document.createElement("script");
panel.src = "/sound-panel.js";
panel.onload = () => {
  const editor = document.createElement("script");
  editor.type = "module";
  editor.src = "/studio.js";
  document.body.append(editor);
};
document.body.append(panel);

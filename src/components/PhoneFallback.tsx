import { useState } from "react";
import { ArrowUpRight, Check, Copy, Desktop } from "@phosphor-icons/react";
import { BrandMark } from "./BrandMark";

/**
 * The prototype is a three-column operations console and needs a laptop-sized screen.
 * On a phone, show what it is and how to get to it, instead of a broken layout.
 */
export function PhoneFallback() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard access can be refused. The address bar still works.
    }
  };

  return (
    <main className="phone">
      <header className="phone__brand">
        <BrandMark />
        <span>Neuron Shift</span>
      </header>

      <svg className="phone__diagram" viewBox="0 0 320 132" role="img" aria-label="A power path from the utility feed through two redundant UPS units to the racks">
        <g className="phone__rails">
          <path d="M24 66 H96" />
          <path d="M96 66 H120 V30 H168" />
          <path d="M96 66 H120 V102 H168" />
          <path d="M168 30 H192 V66 H240" />
          <path d="M168 102 H192 V66 H240" />
          <path d="M240 66 H264 V44 H296" />
          <path d="M240 66 H264 V88 H296" />
        </g>
        <g className="phone__flow">
          <path d="M24 66 H96" />
          <path d="M96 66 H120 V30 H168"/>
          <path d="M96 66 H120 V102 H168" />
          <path d="M168 30 H192 V66 H240"/>
          <path d="M168 102 H192 V66 H240" />
          <path d="M240 66 H264 V44 H296" />
          <path d="M240 66 H264 V88 H296" />
        </g>
        <g className="phone__nodes">
          <rect x="12" y="58" width="24" height="16" rx="3" />
          <rect x="84" y="58" width="24" height="16" rx="3" />
          <rect x="156" y="22" width="24" height="16" rx="3" className="is-owed" />
          <rect x="156" y="94" width="24" height="16" rx="3" />
          <rect x="228" y="58" width="24" height="16" rx="3" />
          <rect x="284" y="36" width="24" height="16" rx="3" className="is-condition" />
          <rect x="284" y="80" width="24" height="16" rx="3" />
        </g>
      </svg>

      <h1>What a night-shift operator inherits, and what they still owe.</h1>
      <p className="phone__lede">
        A concept prototype for data center operations. A shift handoff that keeps the reasoning behind each decision,
        AI that answers on the asset instead of in a chat box, and approvals whose friction scales with how hard they are to undo.
      </p>

      <ul className="phone__ideas">
        <li><i className="swatch swatch--owed" aria-hidden="true" /><span><b>Red</b> means a person owes a decision.</span></li>
        <li><i className="swatch swatch--condition" aria-hidden="true" /><span><b>Amber</b> means equipment needs watching.</span></li>
        <li><i className="swatch swatch--flow" aria-hidden="true" /><span><b>Deciding</b> clears the red and hands the call to the next shift.</span></li>
      </ul>

      <div className="phone__notice">
        <Desktop size={18} weight="duotone" />
        <p>The prototype is an operations console built for a laptop or desktop screen. Open this link there for a two-minute guided tour.</p>
      </div>

      <div className="phone__actions">
        <a className="button button--primary button--large" href="/case-study.html">
          Read the case study <ArrowUpRight size={15} weight="bold" />
        </a>
        <button className="button button--secondary button--large" onClick={copyLink}>
          {copied ? <Check size={15} weight="bold" /> : <Copy size={15} weight="bold" />}
          {copied ? "Link copied" : "Copy link for later"}
        </button>
      </div>

      <footer className="phone__foot">Independent concept prototype, not affiliated with Teserac. All values are simulated.</footer>
    </main>
  );
}

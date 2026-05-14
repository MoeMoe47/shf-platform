# SHS Truth Spine V1

This folder is the no-drift shared truth layer for V1.

## Purpose

Connect:

Hub action → SHS event → normalized record → verification package → reconciliation result → Oracle truth package → trust envelope → reporting readiness → audit/export proof.

## No-drift rule

This folder does not change page layout, CSS, mock structure, or routing. Pages can adopt this layer one at a time.

## First target page

`src/pages/hub/PartnerActionQueueV2.jsx`

## LocalStorage keys

- `shs_truth_spine_records_v1`
- `shs_truth_spine_events_v1`

## V1 definition of done

A Hub referral action updates a shared Truth Spine record, creates a traceable event, updates Oracle readiness, and becomes readable by Referral Tracker and Hub Reports.

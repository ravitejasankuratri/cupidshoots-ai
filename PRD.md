# PRD.md — CupidShoots.ai (Step 1: Discovery Complete)

## One-Sentence Pitch
CupidShoots.ai turns singles meetups into mutual-match experiences — attendees leave compliments anonymously, and when both people liked each other, they each receive a personalized love poem connecting them.

---

## Founder Vision
Remove the courage barrier at in-person singles events. People notice each other but never connect due to fear or bad timing. CupidShoots bridges that gap without making the event feel like a phone-staring exercise — everything happens async, after the event ends.

---

## Users

### Primary Customer (pays): Meetup Organizer
- Runs singles events (weekly/monthly)
- Wants to offer a memorable, differentiated experience
- Pain: nothing makes their event sticky or shareable after it ends

### End User (free via organizer): Event Attendee
- Single adult attending a social event
- Pain: sees interesting people but can't approach them
- Desire: low-stakes way to signal interest without public rejection

---

## Core Pains Solved
1. Approach anxiety — no face-to-face required to signal interest
2. Missed connections — async capture means timing doesn't matter
3. One-sided awkwardness — mutual reveal only; no rejection humiliation
4. Phone distraction — form submitted before/after, not during event

---

## MVP Feature Set

### Phase 1 (Hackathon — ship by June 29)
- [ ] Organizer: signup/login, create event, set event end time, get 6-char code
- [ ] Attendee: enter event code → enter own name + sticker number + email → add ≥3 compliments (target name, number, message) → submit
- [ ] System: at event end_time → find mutual compliments → generate poem per person via Bedrock → send via SES
- [ ] Organizer dashboard: event status, match count, compliment count

### Phase 2 (Post-hackathon)
- Stripe billing for organizers (per-event or monthly plan)
- Custom branding per event (organizer logo in emails)
- Attendee opt-in to future events by same organizer
- Analytics: engagement rate, match rate, avg compliments per attendee
- SMS delivery option (SNS)

---

## Success Metrics (MVP)
| Metric | Target |
|--------|--------|
| Events created | ≥1 real event tested |
| Compliment submission rate | >80% of attendees submit |
| Match rate | >20% of attendees get ≥1 match |
| Email delivery | 100% of matches notified |
| End-to-end demo working | Yes by June 28 |

---

## Core User Flows

### Organizer Flow
```
Sign up → Log in → Create Event (name, date, end_time) 
→ Receive 6-char event code → Share code at meetup 
→ Dashboard: monitor submissions → Event ends → System processes → See match results
```

### Attendee Flow
```
Visit cupidshoots.ai → Enter event code → Enter own name + sticker number + email
→ Add Compliment 1 (target name, number, message)
→ Add Compliment 2
→ Add Compliment 3 [minimum met — submit unlocked]
→ Submit → Confirmation screen ("Sealed until midnight ✉️")
→ [At event end] → Receive poem email if matched
```

### System Flow (async)
```
EventBridge fires at event.end_time 
→ Lambda: query mutual compliments 
→ For each match pair: call Bedrock → generate 2 poems 
→ SES: send poem email to each person 
→ Mark event status = 'completed'
```

---

## Open Questions
- [ ] What happens if attendee submits wrong number for target? (MVP: no lookup, trust input)
- [ ] Do we show match count to attendees before the event ends? (MVP: no)
- [ ] Organizer pricing model? (Phase 2 decision)
- [ ] What if event has <6 total attendees? Still run matching.

---

## Timeline
| Date | Milestone |
|------|-----------|
| June 26 | DB schema live, organizer create-event flow |
| June 27 | Attendee form, match processor, Bedrock poems |
| June 28 | SES emails, organizer dashboard, E2E test |
| June 29 | Architecture diagram, demo video, submit by 5pm PDT |

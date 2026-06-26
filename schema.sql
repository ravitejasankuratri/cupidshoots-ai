-- CupidShoots.ai — Aurora DSQL Schema
-- Run once via AWS Console Query Editor after terraform apply provisions the cluster.

CREATE TABLE organizers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id),
  event_code   CHAR(6) UNIQUE NOT NULL,
  event_name   VARCHAR(255) NOT NULL,
  venue        VARCHAR(255),
  event_date   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  status       VARCHAR(20) DEFAULT 'active'
                 CHECK (status IN ('active', 'processing', 'completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_code ON events(event_code);
CREATE INDEX idx_events_end_time ON events(end_time, status);

CREATE TABLE submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id),
  attendee_name    VARCHAR(255) NOT NULL,
  attendee_number  INTEGER NOT NULL,
  attendee_email   VARCHAR(255) NOT NULL,
  compliment_count INTEGER DEFAULT 0,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, attendee_number)
);

CREATE INDEX idx_submissions_event ON submissions(event_id);

CREATE TABLE compliments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  event_id      UUID NOT NULL REFERENCES events(id),
  from_number   INTEGER NOT NULL,
  to_name       VARCHAR(255) NOT NULL,
  to_number     INTEGER NOT NULL,
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_number != to_number)
);

CREATE INDEX idx_compliments_event_from ON compliments(event_id, from_number);
CREATE INDEX idx_compliments_event_to ON compliments(event_id, to_number);

CREATE TABLE matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id),
  person_a_submission UUID NOT NULL REFERENCES submissions(id),
  person_b_submission UUID NOT NULL REFERENCES submissions(id),
  poem_for_a          TEXT,
  poem_for_b          TEXT,
  matched_at          TIMESTAMPTZ DEFAULT NOW(),
  emails_sent         BOOLEAN DEFAULT FALSE,
  emails_sent_at      TIMESTAMPTZ
);

-- Verify: should return 5 rows
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

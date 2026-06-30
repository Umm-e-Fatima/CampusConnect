-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- UNIVERSITIES
CREATE TABLE IF NOT EXISTS universities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email_domain  VARCHAR(100) NOT NULL UNIQUE,
  city          VARCHAR(100),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id     UUID REFERENCES universities(id) ON DELETE SET NULL,
  full_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  gender            VARCHAR(20) CHECK (gender IN ('female', 'male', 'prefer_not_to_say')),
  department        VARCHAR(150),
  semester          SMALLINT CHECK (semester BETWEEN 1 AND 12),
  women_only_mode   BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  otp_code          VARCHAR(6),
  otp_expires_at    TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE,
  role              VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_id);

-- COURSES
CREATE TABLE IF NOT EXISTS courses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  course_code   VARCHAR(30) NOT NULL,
  course_name   VARCHAR(255) NOT NULL,
  department    VARCHAR(150),
  semester      SMALLINT CHECK (semester BETWEEN 1 AND 12),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (university_id, course_code)
);

CREATE INDEX IF NOT EXISTS idx_courses_code       ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_university ON courses(university_id);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  device_info  VARCHAR(255),
  ip_address   INET,
  is_active    BOOLEAN DEFAULT TRUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- RESOURCES (Notes / Past Papers)
CREATE TABLE IF NOT EXISTS resources (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  resource_type  VARCHAR(30) CHECK (resource_type IN ('notes', 'past_paper', 'other')),
  semester       SMALLINT,
  year           SMALLINT,
  file_url       VARCHAR(500) NOT NULL,
  cloudinary_id  VARCHAR(255) NOT NULL,
  file_size_kb   INTEGER,
  download_count INTEGER DEFAULT 0,

  -- Listing type: gift is free, borrow/buy are paid (Week 4 feature)
  listing_type   VARCHAR(10) DEFAULT 'gift' CHECK (listing_type IN ('gift', 'borrow', 'buy')),
  price          NUMERIC(8,2),               -- per-day for borrow, flat for buy
  delivery_mode  VARCHAR(10) DEFAULT 'online' CHECK (delivery_mode IN ('online', 'offline', 'both')),

  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_course   ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON resources(uploaded_by);

-- BOOK LISTINGS
CREATE TABLE IF NOT EXISTS book_listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id),
  title         VARCHAR(255) NOT NULL,
  author        VARCHAR(255),
  course_id     UUID REFERENCES courses(id) ON DELETE SET NULL,
  condition     VARCHAR(20) CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  listing_type  VARCHAR(10) NOT NULL CHECK (listing_type IN ('paid', 'gift', 'borrow')),
  price         NUMERIC(8,2),
  women_only    BOOLEAN DEFAULT FALSE,
  status        VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'pending', 'completed', 'cancelled')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_university ON book_listings(university_id);
CREATE INDEX IF NOT EXISTS idx_books_seller     ON book_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_books_status     ON book_listings(status);

-- BOOK REQUESTS + PIN HANDOFF
CREATE TABLE IF NOT EXISTS book_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_code        VARCHAR(6),
  pin_expires_at  TIMESTAMPTZ,
  pin_confirmed   BOOLEAN DEFAULT FALSE,

  -- Borrow tracking (only used when listing_type = 'borrow')
  borrow_days     SMALLINT,
  borrow_due_date TIMESTAMPTZ,

  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'pin_issued', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_requests_listing   ON book_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_requester ON book_requests(requester_id);

-- RESOURCE REQUESTS + PIN/PAYMENT HANDOFF (used starting Week 4)
CREATE TABLE IF NOT EXISTS resource_requests (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id          UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  requester_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_mode        VARCHAR(10) CHECK (delivery_mode IN ('online', 'offline')),
  borrow_days          SMALLINT,
  pin_code             VARCHAR(6),
  pin_expires_at       TIMESTAMPTZ,
  seller_confirmed     BOOLEAN DEFAULT FALSE,
  download_token       VARCHAR(255),
  download_expires_at  TIMESTAMPTZ,
  download_used        BOOLEAN DEFAULT FALSE,
  status               VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'pin_issued', 'completed', 'cancelled')),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_requests_resource  ON resource_requests(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_requester ON resource_requests(requester_id);

-- QUESTIONS (Anonymous QnA)
CREATE TABLE IF NOT EXISTS questions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  upvote_count INTEGER DEFAULT 0,
  is_resolved  BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_course ON questions(course_id);

-- ANSWERS
CREATE TABLE IF NOT EXISTS answers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  upvote_count INTEGER DEFAULT 0,
  is_accepted  BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- UPVOTES
CREATE TABLE IF NOT EXISTS upvotes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('question', 'answer')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);


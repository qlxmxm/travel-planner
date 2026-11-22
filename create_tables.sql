-- ============================================================
--  여행 계획 플래너  DB 테이블 생성 (16개)  /  MySQL 8.0.16 이상
--  사용법: Workbench에서 스키마(예시스키마 : travel_planner)를 먼저 선택(더블클릭)한 뒤
--          이 파일 전체를 열어 번개 버튼(⚡)으로 실행합니다.
--  - 이미 있는 테이블은 건너뜁니다(IF NOT EXISTS).
--  - 틀리게 만들어서 다시 만들려면 맨 아래 [초기화] 부분을 먼저 실행하세요.
--  - 순서가 중요합니다 (FK가 가리키는 테이블이 먼저 만들어져야 함). 순서를 바꾸지 마세요.
--  팀 결정 반영: 금액 컬럼은 int / journals.p_id, journals.loc 는 NULL 허용
--               장소 리뷰는 한 사람이 한 장소에 여러 개 가능 (UNIQUE 없음)
--  DEFAULT CHARSET=utf8mb4; => 테이블에 한글, 영어, 이모지를 모두 저장할 수 있는 UTF-8
--  ENGINE=InnoDB => ON DELETE CASCADE, CHECK, 트랜잭션(commit, rollback)을 지원합니다. (생략 가능하나 혹시나 사용하는 버전들이 다를 수 있으니)
-- ============================================================

SET NAMES utf8mb4; -- 한글 인코딩

-- ---------- 1. 로그인 ----------
CREATE TABLE IF NOT EXISTS users (
    u_id       INT          NOT NULL AUTO_INCREMENT,
    u_email    VARCHAR(100) NOT NULL,
    u_name     VARCHAR(100) NOT NULL,
    u_pw       VARCHAR(255) NOT NULL,
    u_pwtest   VARCHAR(255) NULL,                 -- 테스트용 (제출 전 삭제)
    u_token    VARCHAR(255) NULL,
    u_create   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (u_id),
    UNIQUE KEY uq_users_email (u_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 2. 장소 (location 은 plan_details 가 참조하므로 먼저) ----------
CREATE TABLE IF NOT EXISTS location (
    l_id        INT           NOT NULL AUTO_INCREMENT,
    l_category  VARCHAR(20)   NOT NULL,
    l_name      VARCHAR(100)  NOT NULL,
    l_add       VARCHAR(200)  NOT NULL,
    l_telno     VARCHAR(20)   NULL,
    l_start     VARCHAR(100)  NULL,               -- 맛집=오픈시간 / 숙소=체크인
    l_end       VARCHAR(100)  NULL,               -- 맛집=마감시간 / 숙소=체크아웃
    l_intro     TEXT          NULL,
    l_city      VARCHAR(50)   NOT NULL,
    l_image     VARCHAR(255)  NULL,
    l_lat       DECIMAL(10,7) NULL,
    l_lng       DECIMAL(10,7) NULL,
    PRIMARY KEY (l_id),
    CONSTRAINT ck_location_category CHECK (l_category IN ('맛집', '관광명소', '숙소'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 3. 여행계획 ----------
CREATE TABLE IF NOT EXISTS plans (
    p_id      INT          NOT NULL AUTO_INCREMENT,
    u_id      INT          NOT NULL,
    p_title   VARCHAR(100) NOT NULL,
    loc       VARCHAR(100) NOT NULL,
    p_start   DATETIME     NOT NULL,
    p_end     DATETIME     NOT NULL,
    p_status  TINYINT      NOT NULL,
    PRIMARY KEY (p_id),
    CONSTRAINT fk_plans_user FOREIGN KEY (u_id) REFERENCES users (u_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invite (
    i_id      INT          NOT NULL AUTO_INCREMENT,
    p_id      INT          NOT NULL,
    i_code    VARCHAR(50)  NOT NULL,
    i_create  DATETIME     NOT NULL,
    i_expire  DATETIME     NOT NULL,
    i_used    TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (i_id),
    CONSTRAINT fk_invite_plan FOREIGN KEY (p_id) REFERENCES plans (p_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_members (
    pm_id  INT          NOT NULL AUTO_INCREMENT,
    p_id   INT          NOT NULL,
    u_id   INT          NOT NULL,
    role   VARCHAR(100) NOT NULL,
    PRIMARY KEY (pm_id),
    CONSTRAINT fk_pm_plan FOREIGN KEY (p_id) REFERENCES plans (p_id),
    CONSTRAINT fk_pm_user FOREIGN KEY (u_id) REFERENCES users (u_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hashtag (
    h_id    INT          NOT NULL AUTO_INCREMENT,
    h_name  VARCHAR(100) NOT NULL,
    PRIMARY KEY (h_id),
    UNIQUE KEY uq_hashtag_name (h_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_hashtag (
    ph_id  INT NOT NULL AUTO_INCREMENT,
    p_id   INT NOT NULL,
    h_id   INT NOT NULL,
    PRIMARY KEY (ph_id),
    CONSTRAINT fk_ph_plan FOREIGN KEY (p_id) REFERENCES plans (p_id),
    CONSTRAINT fk_ph_hashtag FOREIGN KEY (h_id) REFERENCES hashtag (h_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_details (
    pd_id       INT          NOT NULL AUTO_INCREMENT,
    p_id        INT          NOT NULL,
    l_id        INT          NULL,
    visit_time  DATETIME     NOT NULL,
    orders      INT          NOT NULL,
    memo        VARCHAR(255) NULL,
    PRIMARY KEY (pd_id),
    CONSTRAINT fk_pd_plan     FOREIGN KEY (p_id) REFERENCES plans (p_id),
    CONSTRAINT fk_pd_location FOREIGN KEY (l_id) REFERENCES location (l_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 4. 예산 ----------
CREATE TABLE IF NOT EXISTS budgets (
    b_id      INT      NOT NULL AUTO_INCREMENT,
    p_id      INT      NOT NULL,
    b_budget  INT      NOT NULL,
    b_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    b_add     INT      NULL,
    PRIMARY KEY (b_id),
    CONSTRAINT fk_budgets_plan FOREIGN KEY (p_id) REFERENCES plans (p_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
    e_id       INT          NOT NULL AUTO_INCREMENT,
    b_id       INT          NOT NULL,
    e_content  VARCHAR(255) NOT NULL,
    e_amount   INT          NOT NULL,
    e_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (e_id),
    CONSTRAINT fk_expenses_budget FOREIGN KEY (b_id) REFERENCES budgets (b_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 5. 여행기 ----------
CREATE TABLE IF NOT EXISTS journals (
    j_id      INT          NOT NULL AUTO_INCREMENT,
    p_id      INT          NULL,                  -- 계획이 지워져도 여행기는 남음
    u_id      INT          NOT NULL,
    j_title   VARCHAR(100) NOT NULL,
    j_intro   VARCHAR(100) NULL,
    j_photo   VARCHAR(255) NULL,
    p_create  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    loc       VARCHAR(100) NULL,
    PRIMARY KEY (j_id),
    CONSTRAINT fk_journals_plan FOREIGN KEY (p_id) REFERENCES plans (p_id) ON DELETE SET NULL,
    CONSTRAINT fk_journals_user FOREIGN KEY (u_id) REFERENCES users (u_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS journals_item (
    ji_id       INT          NOT NULL AUTO_INCREMENT,
    j_id        INT          NOT NULL,
    ji_day      INT          NOT NULL DEFAULT 1,
    ji_order    INT          NOT NULL DEFAULT 0,
    ji_time     DATETIME     NULL,
    ji_title    VARCHAR(100) NOT NULL,
    ji_content  TEXT         NULL,
    ji_photo    VARCHAR(255) NULL,
    ji_rating   TINYINT      NULL,
    PRIMARY KEY (ji_id),
    CONSTRAINT fk_ji_journal FOREIGN KEY (j_id) REFERENCES journals (j_id) ON DELETE CASCADE,
    CONSTRAINT ck_ji_day_min     CHECK (ji_day >= 1),
    CONSTRAINT ck_ji_rating_range CHECK (ji_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS journals_comment (
    jc_id       INT      NOT NULL AUTO_INCREMENT,
    j_id        INT      NOT NULL,
    u_id        INT      NOT NULL,
    jc_content  TEXT     NOT NULL,
    jc_create   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (jc_id),
    CONSTRAINT fk_jc_journal FOREIGN KEY (j_id) REFERENCES journals (j_id) ON DELETE CASCADE,
    CONSTRAINT fk_jc_user    FOREIGN KEY (u_id) REFERENCES users (u_id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS journals_like (
    j_id       INT      NOT NULL,
    u_id       INT      NOT NULL,
    jl_create  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (j_id, u_id),
    CONSTRAINT fk_jl_journal FOREIGN KEY (j_id) REFERENCES journals (j_id) ON DELETE CASCADE,
    CONSTRAINT fk_jl_user    FOREIGN KEY (u_id) REFERENCES users (u_id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS journals_hashtag (
    j_id  INT NOT NULL,
    h_id  INT NOT NULL,
    PRIMARY KEY (j_id, h_id),
    CONSTRAINT fk_jh_journal FOREIGN KEY (j_id) REFERENCES journals (j_id) ON DELETE CASCADE,
    CONSTRAINT fk_jh_hashtag FOREIGN KEY (h_id) REFERENCES hashtag (h_id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 6. 장소 리뷰 ----------
CREATE TABLE IF NOT EXISTS location_reviews (
    lr_id       INT      NOT NULL AUTO_INCREMENT,
    l_id        INT      NOT NULL,
    u_id        INT      NOT NULL,
    lr_rating   TINYINT  NOT NULL,
    lr_content  TEXT     NULL,
    lr_create   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lr_update   DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (lr_id),
    CONSTRAINT fk_lr_location FOREIGN KEY (l_id) REFERENCES location (l_id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_user     FOREIGN KEY (u_id) REFERENCES users (u_id)    ON DELETE CASCADE,
    CONSTRAINT ck_lr_rating   CHECK (lr_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  확인:  SHOW TABLES;   → 16개가 나와야 합니다.
-- ============================================================


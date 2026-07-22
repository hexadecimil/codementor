-- =====================================================================
-- CodeMentor - Schéma de base de données
-- TPI 2026 - Thibaud Gamez (n° 151446)
--
-- Conventions de nommage :
--   t_xxx     : table d'entité
--   pk_xxx    : clé primaire
--   fk_xxx    : clé étrangère
--   uk_xxx    : contrainte d'unicité
-- =====================================================================

DROP DATABASE IF EXISTS codementor;
CREATE DATABASE codementor
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE codementor;


-- =====================================================================
-- t_user : utilisateurs authentifiés via OAuth GitHub
-- =====================================================================
CREATE TABLE t_user (
    pk_user       INT AUTO_INCREMENT PRIMARY KEY,
    github_id     INT UNSIGNED NOT NULL UNIQUE COMMENT 'ID GitHub immuable',
    access_token  VARCHAR(255) NOT NULL        COMMENT 'Token OAuth chiffré côté application (AES-256-GCM)',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;


-- =====================================================================
-- t_project : projets liés à un dépôt GitHub
-- =====================================================================
CREATE TABLE t_project (
    pk_project       INT AUTO_INCREMENT PRIMARY KEY,
    fk_user          INT          NOT NULL,
    github_repo_url  VARCHAR(255) NOT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_user
        FOREIGN KEY (fk_user) REFERENCES t_user(pk_user) ON DELETE CASCADE,
    CONSTRAINT uk_user_repo UNIQUE (fk_user, github_repo_url)
) ENGINE = InnoDB;


-- =====================================================================
-- t_analysis : une exécution d'analyse complète sur un projet
-- =====================================================================
CREATE TABLE t_analysis (
    pk_analysis      INT AUTO_INCREMENT PRIMARY KEY,
    fk_project       INT NOT NULL,
    commit_sha       CHAR(40)         COMMENT 'SHA-1 du commit analysé (40 chars hex)',
    status           ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
    files_total      INT UNSIGNED     COMMENT 'Total fichiers pertinents (rempli après fetch arbo)',
    code_overview    TEXT             COMMENT 'Synthèse globale générée par l''IA',
    mermaid_diagram  TEXT             COMMENT 'Code Mermaid de la structure projet',
    error_message    TEXT             COMMENT 'Message d''erreur si status = failed',
    analysis_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_project
        FOREIGN KEY (fk_project) REFERENCES t_project(pk_project) ON DELETE CASCADE
) ENGINE = InnoDB;


-- =====================================================================
-- t_analyzed_file : un fichier traversé lors d'une analyse
-- =====================================================================
CREATE TABLE t_analyzed_file (
    pk_analyzed_file INT AUTO_INCREMENT PRIMARY KEY,
    fk_analysis      INT          NOT NULL,
    file_path        VARCHAR(500) NOT NULL COMMENT 'Chemin relatif dans le dépôt',
    language         VARCHAR(30)           COMMENT 'Langage détecté (js, ts, py, java...)',
    file_summary     TEXT                  COMMENT 'Résumé IA du fichier',
    CONSTRAINT fk_analyzed_file_analysis
        FOREIGN KEY (fk_analysis) REFERENCES t_analysis(pk_analysis) ON DELETE CASCADE
) ENGINE = InnoDB;


-- =====================================================================
-- t_detected_error : une erreur détectée dans un fichier analysé
-- La correction suggérée par l'IA est intégrée ici (cardinalité 0..1)
-- via fix_description / fix_suggested_code nullables.
-- =====================================================================
CREATE TABLE t_detected_error (
    pk_detected_error  INT AUTO_INCREMENT PRIMARY KEY,
    fk_analyzed_file   INT NOT NULL,
    line_number        INT UNSIGNED COMMENT 'Numéro de ligne au moment de l''analyse',
    error_type         ENUM('syntax','logic','security','performance','style','deprecation') NOT NULL,
    severity           ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    description        TEXT NOT NULL COMMENT 'Explication de l''erreur',
    code_snippet       TEXT          COMMENT 'Extrait de code fautif (contexte de quelques lignes)',
    fix_description    TEXT          COMMENT 'Explication de la correction proposée (null si aucune)',
    fix_suggested_code TEXT          COMMENT 'Code corrigé proposé (null si aucune correction)',
    CONSTRAINT fk_detected_error_analyzed_file
        FOREIGN KEY (fk_analyzed_file) REFERENCES t_analyzed_file(pk_analyzed_file) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Avatares para estudiantes y docentes.
-- Se almacena una imagen optimizada como data URL en formato texto.
ALTER TABLE tb_estudiantes
    ADD COLUMN avatar TEXT NULL;

ALTER TABLE tb_docentes
    ADD COLUMN avatar TEXT NULL;

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,         -- Chave primária com auto incremento
    nome VARCHAR(255) NOT NULL,    -- Nome do usuário (obrigatório)
    senha VARCHAR(255) NOT NULL, -- Senha do usuário (obrigatório)
    email VARCHAR(255) NOT NULL,    -- E-mail do usuário (obrigatório)
    CONSTRAINT usuario_email_unico UNIQUE (email) -- Garantir que o e-mail seja único
);

CREATE TABLE questao (
    idquestao SMALLSERIAL PRIMARY KEY,  -- Identificador único da questão
    modulo SMALLINT NOT NULL,  -- Nome do módulo ao qual a questão pertence
    enunciado TEXT NOT NULL,       -- Texto da questão
    alternativa BOOLEAN NOT NULL   -- Resposta correta da questão (true ou false)
);

CREATE TABLE tentativa (
    idtentativa SMALLSERIAL PRIMARY KEY, -- Identificador único da tentativa
    userid SMALLINT NOT NULL,            -- Identificador do usuário que fez a tentativa
    modulo SMALLINT NOT NULL,   -- Nome do módulo ao qual a tentativa pertence
    idquestao1 SMALLINT NOT NULL,        -- Identificador da primeira questão
    idquestao2 SMALLINT NOT NULL,        -- Identificador da segunda questão
    idquestao3 SMALLINT NOT NULL,        -- Identificador da terceira questão
    resposta1 BOOLEAN NOT NULL,     -- Resposta fornecida pelo usuário para a primeira questão
    resposta2 BOOLEAN NOT NULL,     -- Resposta fornecida pelo usuário para a segunda questão
    resposta3 BOOLEAN NOT NULL,     -- Resposta fornecida pelo usuário para a terceira questão
    nota FLOAT,                     -- Nota final obtida pelo usuário na tentativa
    FOREIGN KEY (userid) REFERENCES users(id), -- Chave estrangeira para o ID do usuário
    FOREIGN KEY (idquestao1) REFERENCES questao(idquestao), -- Chave estrangeira para a primeira questão
    FOREIGN KEY (idquestao2) REFERENCES questao(idquestao), -- Chave estrangeira para a segunda questão
    FOREIGN KEY (idquestao3) REFERENCES questao(idquestao)  -- Chave estrangeira para a terceira questão
);
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const randomToken = require('random-token');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

const talkerDocument = ('./talker.json');

// Requisito 1
app.get('/talker', async (req, res) => {
  const talker = await fs.readFile(talkerDocument, 'utf-8');
  return res.status(200).json(JSON.parse(talker));
});

// Requisito 2
app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const speakers = await fs.readFile(talkerDocument, 'utf-8');
  const talkers = JSON.parse(speakers);
  const talkerId = talkers.find((talker) => talker.id === parseInt(id, 10));
  if (!talkerId) {
    return res.status(404).send({ message: 'Pessoa palestrante não encontrada' });
  }
  return res.status(200).json(talkerId);
});

// Requisito 3
function validationLogin(req, res, next) {
  const { email, password } = req.body;
  const regex = /[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[com]+/i;
  if (!email) return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  if (!regex.test(email)) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  if (!password) return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  if (password.length < 6) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  next();
}

app.post('/login', validationLogin, (req, res) => {
  const token = randomToken(16);
  return res.status(200).json({ token });
});

// Requisito 4
function tokenValidation(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).json({ message: 'Token não encontrado' });
  if (authorization.length < 16) return res.status(401).json({ message: 'Token inválido' });
  next();
}

function nameValidation(req, res, next) {
  const { name } = req.body;
  if (name === undefined || name === ' ') {
    return res.status(400).json({ message: 'O campo "name" é obrigatório' });
  }
  if (name.length < 3) {
    return res.status(400).json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }
  next();
}

function ageValidation(req, res, next) {
  const { age } = req.body;
  if (age === undefined || age === ' ') {
    return res.status(400).json({ message: 'O campo "age" é obrigatório' });
  }
  if (age < 18) {
    return res.status(400).json({ message: 'A pessoa palestrante deve ser maior de idade' });
  }
  next();
}

function talkValidation(req, res, next) {
  const { talk } = req.body;
  if (!talk || !talk.watchedAt || (!talk.rate && talk.rate !== 0)) {
    return res.status(400).json({
      message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios',
    });
  }
  next();
}

function watchedAtAndRateValidation(req, res, next) {
  const { talk } = req.body;
  const dateRegex = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/;
  if (!dateRegex.test(talk.watchedAt)) {
    return res.status(400).json({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  if (!Number.isInteger(talk.rate) || talk.rate < 1 || talk.rate > 5) {
    return res.status(400).json({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
  }
  next();
}

app.post('/talker',
  tokenValidation,
  nameValidation,
  ageValidation,
  talkValidation,
  watchedAtAndRateValidation, async (req, res) => {
  const { name, age, talk } = req.body;
  const speakers = await fs.readFile(talkerDocument, 'utf-8');
  const talkers = JSON.parse(speakers);
  const id = talkers.length + 1;
  const newSpeakers = [...talkers, { name, age, id, talk }];
  await fs.writeFile(talkerDocument, JSON.stringify(newSpeakers));
  return res.status(201).json({ name, age, id, talk });
});

app.put('/talker/:id',
  tokenValidation,
  nameValidation,
  ageValidation,
  talkValidation,
  watchedAtAndRateValidation, async (req, res) => {
  const { id } = req.params;
  const { name, age, talk } = req.body;
  const speakers = await fs.readFile(talkerDocument, 'utf-8');
  const talkers = JSON.parse(speakers);
  const talkerIndex = talkers.findIndex((t) => t.id === Number(id));
  talkers[talkerIndex] = { 
    ...talkers[talkerIndex], name, age, talk,
  };
  await fs.writeFile(talkerDocument, JSON.stringify(talkers));

  return res.status(200).json(talkers[talkerIndex]);
});

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

app.get('/talker', async (req, res) => {
  const talker = await fs.readFile('./talker.json', 'utf-8');
  res.status(200).json(JSON.parse(talker));
});

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const speakers = await fs.readFile('./talker.json', 'utf-8');
  const talkers = JSON.parse(speakers);
  const talkerId = talkers.find((talker) => talker.id === parseInt(id, 10));
  if (!talkerId) {
    return res.status(404).send({ message: 'Pessoa palestrante não encontrada' });
  }
  return res.status(200).json(talkerId);
});

function validationLogin(req, res, next) {
  console.log(req.body);
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

app.post('/login', validationLogin, (_req, res) => {
  const token = randomToken(16);
  return res.status(200).json({ token });
});

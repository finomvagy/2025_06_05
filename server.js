require('dotenv').config();
const express = require('express');
const jwt     = require('jsonwebtoken');
const { sequelize, Op, User, Quiz, Question, Answer, Attempt, AttemptAnswer } = require('./DB');

const app    = express();
const SECRET = process.env.SECRETKEY || 'defaultsecretkey'; 

app.use(express.json());
app.use(express.static('public')); // Assumes index.html, script.js, style.css are in 'public' folder

function Auth() {
  return (req, res, next) => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'Hibás vagy hiányzó token' });
    const token = h.split(' ')[1];
    try {
      req.user = jwt.verify(token, SECRET);
      next();
    } catch {
      return res.status(403).json({ message: 'Érvénytelen token' });
    }
  };
}

// — Auth & User —
app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ message: 'A felhasználónév és jelszó megadása kötelező.' });
  }
  try {
    if (await User.findOne({ where: { username } })) {
      return res.status(400).json({ message: 'Ez a felhasználónév már foglalt.' });
    }
    const u = await User.create({ username, password });
    res.status(201).json({ message: 'Sikeres regisztráció', id: u.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a regisztráció során.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Felhasználónév és jelszó megadása kötelező.' });
  }
  try {
    const u = await User.findOne({ where: { username } });
    if (!u || u.password !== password) {
      return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó.' });
    }
    const token = jwt.sign({ id: u.id, username: u.username }, SECRET, { expiresIn: '3h' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a bejelentkezés során.' });
  }
});

app.get('/users/me', Auth(), async (req, res) => {
  try {
    const u = await User.findByPk(req.user.id, { attributes: ['id','username'] });
    if (!u) return res.status(404).json({ message: 'Felhasználó nem található.' });
    res.json(u);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba.' });
  }
});

app.get('/users/me/attempts', Auth(), async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { userId: req.user.id },
      include: [{ model: Quiz, attributes: ['id','title'] }],
      attributes: ['id','quizId','score','completedAt','startedAt'],
      order: [
        [sequelize.literal('`completedAt` IS NULL'), 'DESC'],
        ['completedAt','DESC'],
        ['startedAt','DESC']
      ]
    });
    res.json(attempts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a kitöltések listázásakor.' });
  }
});

// — Quiz CRUD & Filtering & Stats —
app.post('/quizzes', Auth(), async (req, res) => {
  const { title, description, difficulty, category } = req.body;
  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'A cím és leírás kitöltése kötelező.' });
  }
  try {
    const q = await Quiz.create({
      title: title.trim(),
      description: description.trim(),
      difficulty: difficulty ? (difficulty.trim() || null) : null,
      category: category ? (category.trim() || null) : null
    });
    res.status(201).json({ message: 'Kvíz létrehozva.', id: q.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a kvíz létrehozásakor.' });
  }
});

app.get('/quizzes', async (req, res) => {
  const { difficulty, category, sortBy, order = 'ASC', title } = req.query;
  let where = {};
  let ord   = [];
  if (difficulty) where.difficulty = difficulty;
  if (category)  where.category   = { [Op.like]: `%${category}%` };
  if (title)     where.title      = { [Op.like]: `%${title}%` };
  if (sortBy && ['title','id','createdAt','updatedAt','difficulty','category'].includes(sortBy)) {
    ord.push([ sortBy, order.toUpperCase()==='DESC'?'DESC':'ASC' ]);
  }
  try {
    const all = await Quiz.findAll({ where, order: ord.length?ord:[['title','ASC']] });
    res.json(all);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a kvízek listázásakor.' });
  }
});

app.put('/quizzes/:id', Auth(), async (req, res) => {
  const { id } = req.params;
  const { title, description, difficulty, category } = req.body;
  try {
    const q = await Quiz.findByPk(id);
    if (!q) return res.status(404).json({ message: 'Kvíz nem található.' });
    
    if (title      !== undefined) q.title       = title.trim() ? title.trim() : q.title;
    if (description!== undefined) q.description = description.trim() ? description.trim() : q.description;
    
    if (difficulty !== undefined) q.difficulty  = difficulty.trim()  || null;
    if (category   !== undefined) q.category    = category.trim()    || null;

    if (!q.title || !q.description) {
      return res.status(400).json({ message: 'Cím és leírás nem lehet üres.' });
    }
    await q.save();
    res.json({ message: 'Kvíz frissítve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a kvíz frissítésénél.' });
  }
});

app.delete('/quizzes/:id', Auth(), async (req, res) => {
  try {
    const q = await Quiz.findByPk(req.params.id);
    if (!q) return res.status(404).json({ message: 'Kvíz nem található.' });
    await q.destroy();
    res.json({ message: 'Kvíz törölve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a kvíz törlésénél.' });
  }
});

app.get('/quizzes/:id', async (req, res) => {
  try {
    const q = await Quiz.findByPk(req.params.id);
    if (!q) return res.status(404).json({ message: 'Kvíz nem található.' });
    res.json(q);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a kvíz lekérdezésénél.' });
  }
});

app.get('/quizzes/title/:title', async (req, res) => {
  const titleParam = req.params.title ? req.params.title.trim() : "";
  if (!titleParam) {
      return res.status(400).json({ message: 'A cím megadása kötelező a kereséshez.' });
  }
  try {
    const all = await Quiz.findAll({ where: { title: { [Op.like]: `%${titleParam}%` } } });
    res.json(all);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a keresés során.' });
  }
});

app.get('/quizzes/:quizId/stats', async (req, res) => {
  const id = parseInt(req.params.quizId, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Érvénytelen ID.' });
  try {
    const q = await Quiz.findByPk(id);
    if (!q) return res.status(404).json({ message: 'Kvíz nem található.' });
    const atts = await Attempt.findAll({
      where: { quizId: id, completedAt: { [Op.ne]: null }, score: { [Op.ne]: null } },
      attributes: ['score']
    });
    const n = atts.length;
    let sum=0, hi=null, lo=null;
    if (n>0) {
      atts.forEach(a => {
        sum += a.score;
        if (hi===null||a.score>hi) hi=a.score;
        if (lo===null||a.score<lo) lo=a.score;
      });
    }
    res.json({
      quizId: q.id,
      quizTitle: q.title,
      numberOfAttempts: n,
      averageScore: n>0?parseFloat((sum/n).toFixed(2)):0,
      highestScore: hi===null?0:hi,
      lowestScore: lo===null?0:lo
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a statisztikáknál.' });
  }
});

app.get('/quizzes/difficulty/:difficulty', async (req, res) => {
  const difficultyParam = req.params.difficulty ? req.params.difficulty.trim() : "";
  if (!difficultyParam) {
    return res.status(400).json({ message: 'Nehézség megadása kötelező.' });
  }
  try {
    const all = await Quiz.findAll({ where: { difficulty: difficultyParam } });
    res.json(all);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a szűrésnél.' });
  }
});

app.get('/quizzes/category/:category', async (req, res) => {
  const categoryParam = req.params.category ? req.params.category.trim() : "";
  if (!categoryParam) {
    return res.status(400).json({ message: 'Kategória megadása kötelező.' });
  }
  try {
    const all = await Quiz.findAll({ where: { category: { [Op.like]: `%${categoryParam}%` } } });
    res.json(all);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a szűrésnél.' });
  }
});

app.get('/quizzes/sort/average_score', async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    const withAvg = await Promise.all(quizzes.map(async q => {
      const atts = await Attempt.findAll({
        where: { quizId: q.id, completedAt: { [Op.ne]: null }, score: { [Op.ne]: null } },
        attributes: ['score']
      });
      let avg=0;
      if (atts.length) avg = atts.reduce((s,a)=>s+a.score,0)/atts.length;
      return { ...q.toJSON(), averageScore: atts.length?parseFloat(avg.toFixed(2)):0 };
    }));
    withAvg.sort((a,b)=>b.averageScore - a.averageScore);
    res.json(withAvg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Szerverhiba a rendezésnél.' });
  }
});

// — Questions —
app.post('/quizzes/:quizId/questions', Auth(), async (req, res) => {
  const { quizId } = req.params;
  const { question_text } = req.body;
  if (!question_text?.trim()) {
    return res.status(400).json({ message: 'Kérdés szövege kötelező.' });
  }
  try {
    const quiz = await Quiz.findByPk(parseInt(quizId,10)); 
    if (!quiz) {
      return res.status(404).json({ message: 'Kvíz nem található.' });
    }
    const qn = await Question.create({ quizId: parseInt(quizId,10), question_text: question_text.trim() });
    res.status(201).json({ message: 'Kérdés hozzáadva.', id: qn.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba kérdés létrehozásakor.' });
  }
});

app.get('/quizzes/:quizId/questions', async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findByPk(parseInt(quizId,10));
    if (!quiz) {
      return res.status(404).json({ message: 'Kvíz nem található.' });
    }
    const qs = await Question.findAll({
      where: { quizId: parseInt(quizId,10) },
      include: [{ model: Answer, attributes: ['id','text','isCorrect'] }]
    });
    res.json(qs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba kérdések lekérésekor.' });
  }
});

app.put('/questions/:questionId', Auth(), async (req, res) => {
  const { questionId } = req.params;
  const { question_text } = req.body;
  if (!question_text?.trim()) {
    return res.status(400).json({ message: 'Kérdés szövege kötelező.' });
  }
  try {
    const qn = await Question.findByPk(parseInt(questionId,10));
    if (!qn) return res.status(404).json({ message: 'Kérdés nem található.' });
    qn.question_text = question_text.trim();
    await qn.save();
    res.json({ message: 'Kérdés frissítve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba kérdés frissítésénél.' });
  }
});

app.delete('/questions/:questionId', Auth(), async (req, res) => {
  try {
    const qn = await Question.findByPk(parseInt(req.params.questionId,10));
    if (!qn) return res.status(404).json({ message: 'Kérdés nem található.' });
    await qn.destroy();
    res.json({ message: 'Kérdés törölve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba kérdés törlésénél.' });
  }
});

// — Answers —
app.post('/questions/:questionId/answers', Auth(), async (req, res) => {
  const { questionId } = req.params;
  const { text, isCorrect } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ message: 'Válasz szövege kötelező.' });
  }
  if (typeof isCorrect !== 'boolean') {
    return res.status(400).json({ message: 'isCorrect boolean kell legyen.' });
  }
  const t = await sequelize.transaction();
  try {
    const qn = await Question.findByPk(parseInt(questionId,10), { transaction: t });
    if (!qn) {
      await t.rollback();
      return res.status(404).json({ message: 'Kérdés nem található.' });
    }
    if (isCorrect) {
      await Answer.update({ isCorrect: false }, {
        where: { questionId: qn.id, isCorrect: true },
        transaction: t
      });
    }
    const a = await Answer.create({
      text: text.trim(),
      isCorrect,
      questionId: qn.id
    }, { transaction: t });
    await t.commit();
    res.status(201).json({ message: 'Válasz létrehozva.', id: a.id });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ message: 'Hiba válasz létrehozásakor.' });
  }
});

app.get('/questions/:questionId/answers', Auth(), async (req, res) => { 
  try {
    const qn = await Question.findByPk(parseInt(req.params.questionId,10));
    if (!qn) return res.status(404).json({ message: 'Kérdés nem található.' });
    const as = await Answer.findAll({
      where: { questionId: qn.id },
      attributes: ['id','text','isCorrect']
    });
    res.json(as);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba válaszok lekérésekor.' });
  }
});

app.put('/answers/:answerId', Auth(), async (req, res) => {
  const { answerId } = req.params;
  const { text } = req.body; 
  if (text === undefined || !text.trim()) { 
    return res.status(400).json({ message: 'Válasz szövege nem lehet üres.' });
  }
  try {
    const a = await Answer.findByPk(parseInt(answerId,10));
    if (!a) return res.status(404).json({ message: 'Válasz nem található.' });
    a.text = text.trim();
    await a.save();
    res.json({ message: 'Válasz szövege frissítve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba válasz frissítésénél.' });
  }
});

app.delete('/answers/:answerId', Auth(), async (req, res) => {
  try {
    const a = await Answer.findByPk(parseInt(req.params.answerId,10));
    if (!a) return res.status(404).json({ message: 'Válasz nem található.' });
    await a.destroy();
    res.json({ message: 'Válasz törölve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba válasz törlésénél.' });
  }
});

app.put('/answers/:answerId/correct', Auth(), async (req, res) => {
  const { answerId } = req.params;
  const { isCorrect } = req.body; 
  if (typeof isCorrect !== 'boolean') {
    return res.status(400).json({ message: 'isCorrect boolean kell legyen.' });
  }
  const t = await sequelize.transaction();
  try {
    const a = await Answer.findByPk(parseInt(answerId,10), { transaction: t });
    if (!a) {
      await t.rollback();
      return res.status(404).json({ message: 'Válasz nem található.' });
    }
    if (isCorrect) {
      await Answer.update({ isCorrect: false }, {
        where: { questionId: a.questionId, id: { [Op.ne]: a.id } },
        transaction: t
      });
    }
    a.isCorrect = isCorrect;
    await a.save({ transaction: t });
    await t.commit();
    res.json({ message: `Válasz helyessége frissítve.` });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ message: 'Hiba helyesség frissítésénél.' });
  }
});

// — Attempts (taking quizzes) —
app.post('/attempts', Auth(), async (req, res) => {
  const { quizId } = req.body;
  if (quizId == null || isNaN(parseInt(quizId,10))) {
    return res.status(400).json({ message: 'quizId kötelező, számmá kell alakuljon.' });
  }
  try {
    const q = await Quiz.findByPk(parseInt(quizId,10), {
      include: [{
        model: Question,
        attributes: ['id','question_text'],
        include: [{ model: Answer, attributes: ['id','text'] }] 
      }]
    });
    if (!q) {
      return res.status(404).json({ message: 'Kvíz nem található.' });
    }
    if (!q.questions || !q.questions.length) { 
      return res.status(400).json({ message: 'Nincsenek kérdések, nem indítható.' });
    }
    const at = await Attempt.create({
      userId: req.user.id,
      quizId: q.id,
      startedAt: new Date()
    });
    const quizData = {
      id: q.id,
      title: q.title,
      description: q.description,
      questions: q.questions.map(qn => ({
        id: qn.id,
        question_text: qn.question_text,
        answers: qn.answers.map(ans=>({ id: ans.id, text: ans.text })) 
      }))
    };
    res.status(201).json({ attemptId: at.id, quiz: quizData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba kitöltés indításakor.' });
  }
});

app.post('/attempts/:attemptId/answer', Auth(), async (req, res) => {
  const { attemptId }   = req.params;
  const { questionId, selectedAnswerId } = req.body; 
  
  if (questionId == null ) { 
    return res.status(400).json({ message: 'questionId kötelező.' });
  }
  const qId = parseInt(questionId,10);
  if (isNaN(qId)) {
      return res.status(400).json({ message: 'questionId számnak kell lennie.' });
  }

  let sAnsId = null;
  if (selectedAnswerId !== null && selectedAnswerId !== undefined) {
      sAnsId = parseInt(selectedAnswerId, 10);
      if (isNaN(sAnsId)) {
          return res.status(400).json({ message: 'selectedAnswerId számnak kell lennie, ha meg van adva.' });
      }
  }

  try {
    const at = await Attempt.findOne({ where: { id: parseInt(attemptId,10), userId: req.user.id } });
    if (!at) {
      return res.status(404).json({ message: 'Kitöltés nem található vagy nincs jog.' });
    }
    if (at.completedAt) {
      return res.status(400).json({ message: 'Ez már befejezett.' });
    }
    const qn = await Question.findOne({
      where: { id: qId, quizId: at.quizId }
    });
    if (!qn) {
      return res.status(400).json({ message: 'Kérdés nem található a kvízben.' });
    }
    if (sAnsId !== null) { 
      const ans = await Answer.findOne({
        where: { id: sAnsId, questionId: qn.id }
      });
      if (!ans) {
        return res.status(400).json({ message: 'Válasz nem található a kérdéshez.' });
      }
    }
    const [aa, created] = await AttemptAnswer.findOrCreate({
      where: { attemptId: at.id, questionId: qn.id },
      defaults: { selectedAnswerId: sAnsId }
    });
    if (!created) { 
      aa.selectedAnswerId = sAnsId;
      await aa.save();
    }
    res.status(created?201:200).json({ message: 'Válasz rögzítve.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba válasz rögzítésekor.' });
  }
});

app.post('/attempts/:attemptId/submit', Auth(), async (req, res) => {
  const id = parseInt(req.params.attemptId,10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Érvénytelen ID.' });
  }
  try {
    const at = await Attempt.findOne({
      where: { id, userId: req.user.id },
      include: [
        { 
          model: AttemptAnswer, 
          include: [{ model: Answer, as: 'selectedAnswer', attributes: ['isCorrect'] }] 
        },
        { 
          model: Quiz, 
          include: [{ model: Question, attributes: ['id'] }] 
        }
      ]
    });
    if (!at) {
      return res.status(404).json({ message: 'Kitöltés nem található vagy nincs jog.' });
    }
    if (at.completedAt) {
      return res.status(400).json({ message: 'Már befejezett.' });
    }
    let score = 0;
    at.attempt_answers.forEach(ua => {
      if (ua.selectedAnswer && ua.selectedAnswer.isCorrect) { 
        score++;
      }
    });
    at.score = score;
    at.completedAt = new Date();
    await at.save();
    res.json({
      attemptId: at.id,
      quizTitle: at.quiz.title,
      score: at.score,
      totalQuestions: at.quiz.questions.length,
      message: 'Kvíz sikeresen beküldve!'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba beküldéskor.' });
  }
});

app.get('/attempts/:attemptId', Auth(), async (req, res) => {
  const id = parseInt(req.params.attemptId,10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Érvénytelen ID.' });
  }
  try {
    const at = await Attempt.findOne({
      where: { id, userId: req.user.id }, 
      include: [
        { 
          model: Quiz, 
          attributes: ['id','title','description'], 
          include: [{ model: Question, attributes: ['id'] }] 
        },
        { 
          model: AttemptAnswer, 
          attributes: ['id','selectedAnswerId'],
          include: [{
            model: Question, 
            attributes: ['id','question_text'],
            include: [{ model: Answer, attributes: ['id','text','isCorrect'] }]
          }]
        }
      ]
    });

    if (!at) {
      return res.status(404).json({ message: 'Kitöltés nem található vagy nincs jog.' });
    }
    res.json(at);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Hiba részletek lekérésekor.' });
  }
});

// Start
async function syncDb() {
  try {
    await sequelize.sync({ alter: true }); 
    console.log('DB sync complete');
  } catch (e) {
    console.error('DB sync failed', e);
    process.exit(1);
  }
}

syncDb().then(() => {
  const PORT = process.env.PORT||5555;
  app.listen(PORT, ()=> console.log(`Server on http://localhost:${PORT}`));
});
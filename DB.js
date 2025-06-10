require('dotenv').config();
const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'data',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    logging: false
  }
);

const User = sequelize.define('user_info', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  username:      { type: DataTypes.STRING,  allowNull: false, unique: true },
  password:      { type: DataTypes.STRING,  allowNull: false }
});

const Quiz = sequelize.define('quizzes', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  title:         { type: DataTypes.STRING,  allowNull: false },
  description:   { type: DataTypes.TEXT,    allowNull: false },
  difficulty:    { type: DataTypes.STRING,  allowNull: true },
  category:      { type: DataTypes.STRING,  allowNull: true }
});

const Question = sequelize.define('questions', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  quizId:        { type: DataTypes.INTEGER, allowNull: false, references: { model: Quiz, key: 'id' } },
  question_text: { type: DataTypes.STRING,  allowNull: false }
});

const Answer = sequelize.define('answers', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  text:          { type: DataTypes.STRING,  allowNull: false },
  isCorrect:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  questionId:    { type: DataTypes.INTEGER, allowNull: false, references: { model: Question, key: 'id' } }
});

const Attempt = sequelize.define('attempts', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  userId:        { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  quizId:        { type: DataTypes.INTEGER, allowNull: false, references: { model: Quiz, key: 'id' } },
  score:         { type: DataTypes.INTEGER, allowNull: true },
  completedAt:   { type: DataTypes.DATE,    allowNull: true },
  startedAt:     { type: DataTypes.DATE,    defaultValue: Sequelize.NOW }
});

const AttemptAnswer = sequelize.define('attempt_answers', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  attemptId:        { type: DataTypes.INTEGER, allowNull: false, references: { model: Attempt, key: 'id' } },
  questionId:       { type: DataTypes.INTEGER, allowNull: false, references: { model: Question, key: 'id' } },
  selectedAnswerId: { type: DataTypes.INTEGER, allowNull: true,  references: { model: Answer,   key: 'id' } }
});

// Associations
User.hasMany(Attempt,     { foreignKey: 'userId', onDelete: 'CASCADE' });
Attempt.belongsTo(User,   { foreignKey: 'userId' });

Quiz.hasMany(Question,    { foreignKey: 'quizId', onDelete: 'CASCADE' });
Question.belongsTo(Quiz,  { foreignKey: 'quizId' });

Quiz.hasMany(Attempt,     { foreignKey: 'quizId', onDelete: 'CASCADE' });
Attempt.belongsTo(Quiz,   { foreignKey: 'quizId' });

Question.hasMany(Answer,   { foreignKey: 'questionId', onDelete: 'CASCADE' });
Answer.belongsTo(Question,{ foreignKey: 'questionId' });

Question.hasMany(AttemptAnswer, { foreignKey: 'questionId', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'questionId' });

Attempt.hasMany(AttemptAnswer,   { foreignKey: 'attemptId', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(Attempt,{ foreignKey: 'attemptId' });

Answer.hasMany(AttemptAnswer,    { foreignKey: 'selectedAnswerId', onDelete: 'SET NULL' });
AttemptAnswer.belongsTo(Answer, { foreignKey: 'selectedAnswerId', as: 'selectedAnswer' });

module.exports = {
  sequelize,
  Op,
  User,
  Quiz,
  Question,
  Answer,
  Attempt,
  AttemptAnswer
};

```javascript const express = require('express'); const cors = require('cors'); const bodyParser = require('body-parser'); const WebSocket = require('ws'); const http = require('http'); const path = require('path'); const { db, initDatabase, initStudents, initQuestions } = require('./database');
const app = express(); const PORT = process.env.PORT || 3000;

app.use(cors()); app.use(bodyParser.json()); app.use(express.static('public'));

const server = http.createServer(app); const wss = new WebSocket.Server({ server }); const clients = new Set();

wss.on('connection', (ws) => { console.log('新的 WebSocket 接'); clients.add(ws);

ws.on('close', () => { clients.delete(ws); console.log('WebSocket 连接关闭'); });

ws.on('error', (error) => { console.error('WebSocket 错误:', error); }); });

function broadcast(data) { const message = JSON.stringify(data); clients.forEach(client => { if (client.readyState === WebSocket.OPEN) { client.send(message); } }); }

app.get('/api/available-students', (req, res) => { const query = SELECT s.name, s.group_number FROM students s LEFT JOIN submissions sub ON s.name = sub.student_name WHERE sub.id IS NULL ORDER BY s.name ;

db.all(query, [], (err, rows) => { if (err) { console.error('查询可用学生失败:', err); return res.status(500).json({ error: '查询失败' }); } res.json({ students: rows }); }); });

app.post('/api/submit-exam', (req, res) => { const { name, group, answers } = req.body;

if (!name || !group || !answers) { return res.status(400).json({ error: '缺少必填字段' }); }

db.get('SELECT id FROM submissions WHERE student_name = ?', [name], (err, row) => { if (err) { console.error('查询提交记录失败:', err); return res.status(500).json({ error: '查询失败' }); }

if (row) {
  return res.status(400).json({ error: '该学生已提交过考试' });
}

db.all('SELECT question_number, correct_answer FROM questions ORDER BY question_number', [], (err, questions) => {
  if (err) {
    console.error('查询题目失败:', err);
    return res.status(500).json({ error: '查询题目失败' });
  }

  let score = 0;
  const answerDetails = [];

  questions.forEach(q => {
    const userAnswer = answers[`q${q.question_number}`];
    const isCorrect = userAnswer === q.correct_answer;
    if (isCorrect) score += 20;

    answerDetails.push({
      questionNumber: q.question_number,
      userAnswer: userAnswer || 'N/A',
      correctAnswer: q.correct_answer,
      isCorrect: isCorrect
    });
  });

  db.run(
    'INSERT INTO submissions (student_name, group_number, score) VALUES (?, ?, ?)',
    [name, group, score],
    function(err) {
      if (err) {
        console.error('插入提交记录失败:', err);
        return res.status(500).json({ error: '提交失败' });
      }

      const submissionId = this.lastID;
      const stmt = db.prepare('INSERT INTO answers (submission_id, question_number, user_answer, correct_answer, is_correct) VALUES (?, ?, ?, ?, ?)');

      answerDetails.forEach(detail => {
        stmt.run(submissionId, detail.questionNumber, detail.userAnswer, detail.correctAnswer, detail.isCorrect ? 1 : 0);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('插入答题详情失败:', err);
          return res.status(500).json({ error: '插入答题详情失败' });
        }

        broadcast({
          type: 'STUDENT_SUBMITTED',
          data: { name, group, score }
        });

        res.json({
          success: true,
          score: score,
          submissionId: submissionId,
          details: answerDetails
        });
      });
    }
  );
});
}); });

app.get('/api/leaderboard/personal', (req, res) => { const query = SELECT student_name as name, group_number as groupNumber, score, submit_time as submitTime, RANK() OVER (ORDER BY score DESC, submit_time ASC) as rank FROM submissions ORDER BY score DESC, submit_time ASC ;

db.all(query, [], (err, rows) => { if (err) { console.error('查询个人排行榜失败:', err); return res.status(500).json({ error: '查询失败' }); } res.json({ leaderboard: rows }); }); });

app.get('/api/leaderboard/group', (req, res) => { const query = SELECT group_number as groupNumber, ROUND(AVG(score), 2) as avgScore, COUNT(*) as submissionCount, MAX(score) as maxScore, MIN(score) as minScore FROM submissions GROUP BY group_number ORDER BY avgScore DESC ;

db.all(query, [], (err, rows) => { if (err) { console.error('查询小组排行榜失败:', err); return res.status(500).json({ error: '查询失败' }); } res.json({ leaderboard: rows }); }); });

app.get('/api/admin/submissions', (req, res) => { const query = SELECT s.id, s.student_name as studentName, s.group_number as groupNumber, s.score, s.submit_time as submitTime FROM submissions s ORDER BY s.submit_time DESC ;

db.all(query, [], (err, rows) => { if (err) { console.error('查询提交记录失败:', err); return res.status(500).json({ error: '查询失败' }); } res.json({ submissions: rows }); }); });

app.get('/api/admin/submission/:id/details', (req, res) => { const submissionId = req.params.id;

const submissionQuery = SELECT s.student_name as studentName, s.group_number as groupNumber, s.score, s.submit_time as submitTime FROM submissions s WHERE s.id = ? ;

const answersQuery = SELECT question_number as questionNumber, user_answer as userAnswer, correct_answer as correctAnswer, is_correct as isCorrect FROM answers WHERE submission_id = ? ORDER BY question_number ;

db.get(submissionQuery, [submissionId], (err, submission) => { if (err) { console.error('查询提交记录失败:', err); return res.status(500).json({ error: '查询失败' }); }

if (!submission) {
  return res.status(404).json({ error: '提交记录不存在' });
}

db.all(answersQuery, [submissionId], (err, answers) => {
  if (err) {
    console.error('查询答题详情失败:', err);
    return res.status(500).json({ error: '查询答题详情失败' });
  }

  res.json({
    submission: submission,
    answers: answers
  });
});
}); });

app.get('/api/admin/statistics', (req, res) => { const queries = { total: 'SELECT COUNT(*) as count FROM submissions', avgScore: 'SELECT ROUND(AVG(score), 2) as avg FROM submissions', questionStats: SELECT question_number as questionNumber, COUNT(*) as totalAttempts, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correctCount, ROUND(100.0 * SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as correctRate, ROUND(100.0 * SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as errorRate FROM answers GROUP BY question_number ORDER BY question_number , wrongAnswerStats: SELECT question_number as questionNumber, user_answer as wrongAnswer, COUNT(*) as count FROM answers WHERE is_correct = 0 AND user_answer != 'N/A' GROUP BY question_number, user_answer ORDER BY question_number, count DESC };

const results = {};

db.get(queries.total, [], (err, row) => { if (err) return res.status(500).json({ error: '查询失败' }); results.totalSubmissions = row.count;

db.get(queries.avgScore, [], (err, row) => {
  if (err) return res.status(500).json({ error: '查询失败' });
  results.averageScore = row.avg || 0;

  db.all(queries.questionStats, [], (err, rows) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    results.questionStatistics = rows;

    db.all(queries.wrongAnswerStats, [], (err, rows) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      results.wrongAnswerDistribution = rows;

      res.json(results);
    });
  });
});
}); });

app.get('/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

async function startServer() { try { await initDatabase(); await initStudents(); await initQuestions();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  考试系统后端服务器已启动`);
  console.log(`========================================`);
  console.log(`  服务运行在端口: ${PORT}`);
  console.log(`========================================\n`);
});
} catch (error) { console.error('启动服务器失败:', error); process.exit(1); } }

startServer();

process.on('SIGINT', () => { console.log('\n正在关闭服务器...'); db.close((err) => { if (err) console.error('关闭数据库连接失败:', err); server.close(() => { console.log('服务器已关闭'); process.exit(0); }); }); });
